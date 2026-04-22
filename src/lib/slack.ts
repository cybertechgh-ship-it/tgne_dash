/**
 * src/lib/slack.ts
 * Reusable Slack alert service via Incoming Webhooks.
 *
 * Set SLACK_WEBHOOK_URL in your .env.local and Vercel Dashboard.
 * If the env var is absent the functions are no-ops — no errors thrown.
 *
 * Works in both Node.js and Edge runtimes (uses fetch only).
 */

type SlackLevel = 'info' | 'warning' | 'error' | 'critical';

interface SlackAlertOptions {
  level:    SlackLevel;
  title:    string;
  message:  string;
  context?: Record<string, unknown>;
}

const LEVEL_COLOR: Record<SlackLevel, string> = {
  info:     '#36a64f', // green
  warning:  '#ffb300', // amber
  error:    '#e53935', // red
  critical: '#7b1fa2', // purple
};

const LEVEL_EMOJI: Record<SlackLevel, string> = {
  info:     'ℹ️',
  warning:  '⚠️',
  error:    '🔴',
  critical: '🚨',
};

// ─── Core sender ──────────────────────────────────────────────────────────────

export async function sendSlackAlert(opts: SlackAlertOptions): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return; // silently skip if not configured

  const blocks: unknown[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${LEVEL_EMOJI[opts.level]} *${opts.title}*\n${opts.message}`,
      },
    },
  ];

  if (opts.context && Object.keys(opts.context).length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `\`\`\`${JSON.stringify(opts.context, null, 2)}\`\`\``,
      },
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `*Level:* ${opts.level.toUpperCase()} | *App:* TGNE Dashboard | *Time:* ${new Date().toISOString()}`,
      },
    ],
  });

  const payload = {
    attachments: [
      {
        color:  LEVEL_COLOR[opts.level],
        blocks,
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('[Slack] Webhook failed:', res.status, await res.text());
    }
  } catch (err) {
    // Never let Slack failures crash the app
    console.error('[Slack] Network error:', err);
  }
}

// ─── Convenience API ──────────────────────────────────────────────────────────

export const slack = {
  /** General informational alert */
  info: (title: string, message: string, context?: Record<string, unknown>) =>
    sendSlackAlert({ level: 'info', title, message, context }),

  /** Something needs attention but not broken */
  warning: (title: string, message: string, context?: Record<string, unknown>) =>
    sendSlackAlert({ level: 'warning', title, message, context }),

  /** An error occurred */
  error: (title: string, message: string, context?: Record<string, unknown>) =>
    sendSlackAlert({ level: 'error', title, message, context }),

  /** System-level critical failure */
  critical: (title: string, message: string, context?: Record<string, unknown>) =>
    sendSlackAlert({ level: 'critical', title, message, context }),

  // ── Typed event helpers ────────────────────────────────────────────────────

  /** PIN entry failure */
  authFailure: (ip: string, reason: string) =>
    sendSlackAlert({
      level:   'warning',
      title:   '🔐 Auth Failure — TGNE Dashboard',
      message: reason,
      context: { ip, timestamp: new Date().toISOString() },
    }),

  /** IP hit the rate limit */
  rateLimitHit: (ip: string, path: string) =>
    sendSlackAlert({
      level:   'warning',
      title:   '⚡ Rate Limit Exceeded',
      message: `IP \`${ip}\` exceeded rate limit on \`${path}\``,
      context: { ip, path, timestamp: new Date().toISOString() },
    }),

  /** Unhandled server error */
  criticalError: (error: Error, context?: Record<string, unknown>) =>
    sendSlackAlert({
      level:   'critical',
      title:   '🚨 Unhandled Server Error — TGNE Dashboard',
      message: error.message,
      context: { ...context, stack: error.stack?.split('\n').slice(0, 5).join('\n') },
    }),

  /** Cron job completed */
  cronComplete: (summary: Record<string, unknown>) =>
    sendSlackAlert({
      level:   'info',
      title:   '✅ Cron: Due-date check complete',
      message: 'Daily due-date scan finished.',
      context: summary,
    }),

  /** Suspicious burst from a single IP */
  suspiciousActivity: (ip: string, detail: string) =>
    sendSlackAlert({
      level:   'warning',
      title:   '🕵️ Suspicious Activity Detected',
      message: detail,
      context: { ip, timestamp: new Date().toISOString() },
    }),
};
