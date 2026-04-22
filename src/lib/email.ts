/**
 * src/lib/email.ts
 * Brevo (formerly Sendinblue) transactional email service for TGNE Dashboard.
 *
 * API docs: https://developers.brevo.com/docs/send-a-transactional-email
 * Endpoint: POST https://api.brevo.com/v3/smtp/email
 * Auth:     Header  api-key: <BREVO_API_KEY>
 *
 * Required env vars (add to .env.local):
 *   BREVO_API_KEY        — your Brevo API key (Settings → SMTP & API)
 *   TGNE_ADMIN_EMAIL     — where daily alert emails are sent (your inbox)
 *   BREVO_SENDER_NAME    — display name, e.g. "TGNE Alerts"
 *   BREVO_SENDER_EMAIL   — verified sender address in Brevo account
 */

export interface DueAlert {
  type:       'reminder' | 'website' | 'task';
  title:      string;
  detail:     string;
  daysLeft:   number;
  clientName?: string;
  date:       string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function urgencyBadge(daysLeft: number): string {
  if (daysLeft < 0)   return `OVERDUE by ${Math.abs(daysLeft)}d`;
  if (daysLeft === 0) return 'DUE TODAY';
  if (daysLeft <= 3)  return `URGENT — ${daysLeft}d left`;
  if (daysLeft <= 7)  return `${daysLeft} days left`;
  return `${daysLeft} days away`;
}

function urgencyHex(daysLeft: number): string {
  if (daysLeft < 0)   return '#ef4444';
  if (daysLeft <= 3)  return '#f97316';
  if (daysLeft <= 7)  return '#eab308';
  return '#22c55e';
}

function typeIcon(type: DueAlert['type']): string {
  return type === 'website' ? '🌐' : type === 'task' ? '✅' : '🔔';
}

// ─── HTML email template ───────────────────────────────────────────────────────

function buildHtml(alerts: DueAlert[]): string {
  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const overdueCount = alerts.filter(a => a.daysLeft < 0).length;
  const urgentCount  = alerts.filter(a => a.daysLeft >= 0 && a.daysLeft <= 7).length;

  const rows = alerts.map(a => `
    <tr style="border-bottom:1px solid #1e293b;">
      <td style="padding:14px 16px;vertical-align:top;">
        <span style="
          display:inline-block;
          background:${urgencyHex(a.daysLeft)}18;
          color:${urgencyHex(a.daysLeft)};
          border:1px solid ${urgencyHex(a.daysLeft)}40;
          border-radius:999px;
          font-size:9px;font-weight:900;
          padding:3px 10px;letter-spacing:0.08em;
          white-space:nowrap;
        ">${urgencyBadge(a.daysLeft).toUpperCase()}</span>
      </td>
      <td style="padding:14px 16px;vertical-align:top;">
        <div style="font-weight:700;color:#f1f5f9;font-size:14px;">
          ${typeIcon(a.type)} ${a.title}
        </div>
        <div style="color:#64748b;font-size:12px;margin-top:3px;">${a.detail}</div>
      </td>
      <td style="padding:14px 16px;vertical-align:top;color:#94a3b8;font-size:13px;">
        ${a.clientName ?? '—'}
      </td>
      <td style="padding:14px 16px;vertical-align:top;color:#64748b;font-size:12px;white-space:nowrap;">
        ${a.date}
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#020817;font-family:'Inter',Arial,sans-serif;">
  <div style="max-width:680px;margin:32px auto;background:#0f172a;border:1px solid #1e293b;border-radius:16px;overflow:hidden;">

    <!-- ── Top accent bar ── -->
    <div style="height:4px;background:linear-gradient(90deg,#7c3aed,#6d28d9,#4f46e5);"></div>

    <!-- ── Header ── -->
    <div style="padding:28px 36px 20px;background:linear-gradient(135deg,#0f172a,#1e1b4b);">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td>
            <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">TGNE CORE</div>
            <div style="font-size:11px;color:#7c3aed;margin-top:2px;font-weight:700;letter-spacing:0.12em;">
              DAILY ALERT DIGEST
            </div>
          </td>
          <td style="text-align:right;vertical-align:top;">
            <div style="font-size:11px;color:#475569;">${dateStr}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- ── Summary chips ── -->
    <div style="padding:16px 36px;background:#0a0f1e;border-bottom:1px solid #1e293b;display:flex;gap:12px;">
      <span style="background:#ef444418;color:#ef4444;border:1px solid #ef444430;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:800;">
        ⚡ ${overdueCount} OVERDUE
      </span>
      <span style="background:#f9741618;color:#f97316;border:1px solid #f9741630;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:800;">
        🔥 ${urgentCount} URGENT
      </span>
      <span style="background:#7c3aed18;color:#a78bfa;border:1px solid #7c3aed30;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:800;">
        📋 ${alerts.length} TOTAL ITEMS
      </span>
    </div>

    <!-- ── Table ── -->
    <div style="padding:24px 36px;">
      <table style="width:100%;border-collapse:collapse;background:#080d1a;border-radius:12px;overflow:hidden;border:1px solid #1e293b;">
        <thead>
          <tr style="background:#1e293b;">
            <th style="padding:10px 16px;text-align:left;font-size:9px;color:#475569;letter-spacing:0.12em;font-weight:900;">STATUS</th>
            <th style="padding:10px 16px;text-align:left;font-size:9px;color:#475569;letter-spacing:0.12em;font-weight:900;">ITEM</th>
            <th style="padding:10px 16px;text-align:left;font-size:9px;color:#475569;letter-spacing:0.12em;font-weight:900;">CLIENT</th>
            <th style="padding:10px 16px;text-align:left;font-size:9px;color:#475569;letter-spacing:0.12em;font-weight:900;">DATE</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <!-- ── CTA ── -->
    <div style="padding:0 36px 28px;">
      <div style="background:linear-gradient(135deg,#7c3aed18,#4f46e518);border:1px solid #7c3aed30;border-radius:12px;padding:18px 24px;">
        <p style="color:#94a3b8;font-size:13px;margin:0 0 12px;">
          Action these items in your TGNE Dashboard before they become critical.
        </p>
        <a href="https://tgne-dash.vercel.app/reminders"
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-weight:800;font-size:13px;padding:10px 24px;border-radius:8px;text-decoration:none;">
          Open Dashboard →
        </a>
      </div>
    </div>

    <!-- ── Footer ── -->
    <div style="padding:16px 36px;border-top:1px solid #0f172a;background:#060a14;text-align:center;">
      <p style="color:#1e293b;font-size:11px;margin:0;">
        TGNE — Premium Web Solutions &bull; Accra, Ghana &bull; Automated Alert System
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Send via Brevo ────────────────────────────────────────────────────────────

export interface SendResult {
  sent:    boolean;
  messageId?: string;
  error?:  string;
}

export async function sendDueDateAlert(alerts: DueAlert[]): Promise<SendResult> {
  const apiKey      = process.env.BREVO_API_KEY;
  const toEmail     = process.env.TGNE_ADMIN_EMAIL;
  const senderName  = process.env.BREVO_SENDER_NAME  || 'TGNE Alerts';
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey)      return { sent: false, error: 'BREVO_API_KEY not configured in environment' };
  if (!toEmail)     return { sent: false, error: 'TGNE_ADMIN_EMAIL not configured in environment' };
  if (!senderEmail) return { sent: false, error: 'BREVO_SENDER_EMAIL not configured in environment' };
  if (alerts.length === 0) return { sent: false, error: 'No alerts to send — skipped' };

  const overdueCount = alerts.filter(a => a.daysLeft < 0).length;
  const subject = overdueCount > 0
    ? `⚡ ${overdueCount} OVERDUE + ${alerts.length - overdueCount} upcoming — TGNE Daily Alert`
    : `🔔 ${alerts.length} item${alerts.length !== 1 ? 's' : ''} due soon — TGNE Daily Alert`;

  // Brevo transactional email payload
  // https://developers.brevo.com/reference/sendtransacemail
  const payload = {
    sender: { name: senderName, email: senderEmail },
    to:     [{ email: toEmail, name: 'TGNE Admin' }],
    subject,
    htmlContent: buildHtml(alerts),
    tags: ['tgne-daily-alert'],
  };

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: {
        'api-key':      apiKey,
        'Content-Type': 'application/json',
        'Accept':       'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = (body as any)?.message || JSON.stringify(body);
      console.error('[Brevo] Send failed:', res.status, errMsg);
      return { sent: false, error: `Brevo API ${res.status}: ${errMsg}` };
    }

    const messageId = (body as any)?.messageId ?? undefined;
    console.log('[Brevo] Email sent successfully. messageId:', messageId);
    return { sent: true, messageId };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Brevo] Network error:', msg);
    return { sent: false, error: msg };
  }
}
