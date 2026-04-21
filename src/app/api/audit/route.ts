import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity');
    const limit  = parseInt(searchParams.get('limit') ?? '100');
    const rows   = entity
      ? await db.select().from(auditLogs).where(eq(auditLogs.entity, entity)).orderBy(desc(auditLogs.createdAt)).limit(limit)
      : await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('[GET /api/audit]', error);
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, entity, entityId, entityName, details } = body;
    if (!action || !entity || !entityId)
      return NextResponse.json({ error: 'action, entity, entityId required' }, { status: 400 });
    const [row] = await db.insert(auditLogs).values({
      action, entity, entityId,
      entityName: entityName ?? null,
      details: details ? JSON.stringify(details) : null,
      actor: 'TGNE Admin',
    }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('[POST /api/audit]', error);
    return NextResponse.json({ error: 'Failed to write audit log' }, { status: 500 });
  }
}