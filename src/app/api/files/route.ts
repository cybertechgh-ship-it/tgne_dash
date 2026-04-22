import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clientFiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const clientId = new URL(req.url).searchParams.get('clientId');
    if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });
    const files = await db.select().from(clientFiles).where(eq(clientFiles.clientId, clientId));
    return NextResponse.json(files);
  } catch (error) {
    console.error('[GET /api/files]', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { clientId, name, base64, mimeType, size, category } = await req.json();
    if (!clientId || !name || !base64)
      return NextResponse.json({ error: 'clientId, name, base64 required' }, { status: 400 });
    const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET ?? 'tgne_files';
    if (!cloudName) return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
    const fd = new FormData();
    fd.append('file', base64);
    fd.append('upload_preset', uploadPreset);
    fd.append('folder', `tgne/clients/${clientId}`);
    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: fd });
    if (!cloudRes.ok) {
      const errBody = await cloudRes.text().catch(() => 'unknown');
      console.error('[POST /api/files] Cloudinary upload failed:', errBody);
      return NextResponse.json({ error: 'Cloudinary upload failed' }, { status: 500 });
    }
    const cloud = await cloudRes.json();
    const [file] = await db.insert(clientFiles).values({
      clientId, name, url: cloud.secure_url, publicId: cloud.public_id,
      size: size ?? cloud.bytes ?? null, mimeType: mimeType ?? null, category: category ?? 'document',
    }).returning();
    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    console.error('[POST /api/files]', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    // Fetch the file record first so we can clean up Cloudinary
    const [fileRecord] = await db.select().from(clientFiles).where(eq(clientFiles.id, id));

    // Delete from Cloudinary if we have a publicId
    if (fileRecord?.publicId) {
      const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey       = process.env.CLOUDINARY_API_KEY;
      const apiSecret    = process.env.CLOUDINARY_API_SECRET;
      if (cloudName && apiKey && apiSecret) {
        try {
          const timestamp = Math.floor(Date.now() / 1000);
          // Build signature string
          const crypto   = await import('crypto');
          const sigStr   = `public_id=${fileRecord.publicId}&timestamp=${timestamp}${apiSecret}`;
          const signature = crypto.createHash('sha1').update(sigStr).digest('hex');
          const fd = new FormData();
          fd.append('public_id',  fileRecord.publicId);
          fd.append('api_key',    apiKey);
          fd.append('timestamp',  String(timestamp));
          fd.append('signature',  signature);
          await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/destroy`, { method: 'POST', body: fd });
        } catch (cloudErr) {
          // Non-fatal — log but still delete DB record
          console.warn('[DELETE /api/files] Cloudinary delete failed (non-fatal):', cloudErr);
        }
      }
    }

    await db.delete(clientFiles).where(eq(clientFiles.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/files]', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
