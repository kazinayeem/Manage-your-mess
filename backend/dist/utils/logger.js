"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const isDev = process.env.NODE_ENV !== "production";
function timestamp() {
    return new Date().toISOString();
}
function formatArgs(args) {
    return args
        .map((a) => {
        if (a instanceof Error)
            return a.stack ?? a.message;
        if (typeof a === "object") {
            try {
                return JSON.stringify(a);
            }
            catch {
                return String(a);
            }
        }
        return String(a);
    })
        .join(" ");
}
exports.logger = {
    info(...args) {
        // eslint-disable-next-line no-console
        console.log(`[INFO] ${timestamp()}`, formatArgs(args));
    },
    warn(...args) {
        // eslint-disable-next-line no-console
        console.warn(`[WARN] ${timestamp()}`, formatArgs(args));
    },
    error(...args) {
        // eslint-disable-next-line no-console
        console.error(`[ERROR] ${timestamp()}`, formatArgs(args));
    },
    debug(...args) {
        if (isDev) {
            // eslint-disable-next-line no-console
            console.debug(`[DEBUG] ${timestamp()}`, formatArgs(args));
        }
    },
};
//# sourceMappingURL=logger.js.map