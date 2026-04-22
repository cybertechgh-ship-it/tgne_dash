/**
 * src/lib/logger.ts
 * Structured Winston logger for all Node.js runtime code.
 *
 * - Production : JSON to stdout → captured by Vercel log drain
 * - Development: Coloured, readable printf format
 *
 * NEVER import this in Edge runtime files (middleware.ts) — use console there.
 * NEVER import this in client components ("use client").
 */

import winston from 'winston';

const { combine, timestamp, json, colorize, printf } = winston.format;

const isProd = process.env.NODE_ENV === 'production';

// ─── Formats ──────────────────────────────────────────────────────────────────

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp: ts, service, ...meta }) => {
    const svc    = service ? `[${service}]` : '';
    const extras = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${ts} ${level} ${svc} ${message}${extras}`;
  })
);

const prodFormat = combine(
  timestamp(),
  json()
);

// ─── Root logger ──────────────────────────────────────────────────────────────

export const logger = winston.createLogger({
  level:       process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  format:      isProd ? prodFormat : devFormat,
  defaultMeta: { app: 'tgne-dash' },
  transports:  [new winston.transports.Console()],
  exitOnError: false,
});

// ─── Child loggers (named by domain) ─────────────────────────────────────────

/** Use in API route files */
export const apiLogger  = logger.child({ service: 'api'  });

/** Use in auth-related code */
export const authLogger = logger.child({ service: 'auth' });

/** Use in database helpers */
export const dbLogger   = logger.child({ service: 'db'   });

/** Use in cron/background jobs */
export const cronLogger = logger.child({ service: 'cron' });

/** Use in email/notification senders */
export const emailLogger = logger.child({ service: 'email' });
