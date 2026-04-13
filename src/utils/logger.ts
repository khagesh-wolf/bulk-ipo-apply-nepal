/**
 * Logging Utility — Bulk IPO Apply Nepal
 *
 * Structured logger that wraps console methods. In production builds only
 * warnings and errors are emitted; in __DEV__ mode everything is logged.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel = __DEV__ ? 'debug' : 'warn';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  debug(tag: string, message: string, data?: unknown) {
    if (!shouldLog('debug')) return;
    console.debug(`[${timestamp()}] [DEBUG] [${tag}] ${message}`, data ?? '');
  },

  info(tag: string, message: string, data?: unknown) {
    if (!shouldLog('info')) return;
    console.info(`[${timestamp()}] [INFO] [${tag}] ${message}`, data ?? '');
  },

  warn(tag: string, message: string, data?: unknown) {
    if (!shouldLog('warn')) return;
    console.warn(`[${timestamp()}] [WARN] [${tag}] ${message}`, data ?? '');
  },

  error(tag: string, message: string, error?: unknown) {
    if (!shouldLog('error')) return;
    console.error(`[${timestamp()}] [ERROR] [${tag}] ${message}`, error ?? '');
  },
};
