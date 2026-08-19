const isDev = process.env.NODE_ENV !== "production";

function timestamp(): string {
  return new Date().toISOString();
}

function formatArgs(args: unknown[]): string {
  return args
    .map((a) => {
      if (a instanceof Error) return a.stack ?? a.message;
      if (typeof a === "object") {
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      }
      return String(a);
    })
    .join(" ");
}

export const logger = {
  info(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.log(`[INFO] ${timestamp()}`, formatArgs(args));
  },
  warn(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${timestamp()}`, formatArgs(args));
  },
  error(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${timestamp()}`, formatArgs(args));
  },
  debug(...args: unknown[]) {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${timestamp()}`, formatArgs(args));
    }
  },
};