"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendList = sendList;
exports.sendMessage = sendMessage;
exports.sendError = sendError;
function sendSuccess(res, data, message = "Success", status = 200) {
    return res.status(status).json({ success: true, message, data });
}
function sendList(res, data, meta, message = "Success") {
    const page = meta.page ?? 1;
    const limit = meta.limit ?? 0;
    const totalPages = meta.totalPages ?? (limit > 0 ? Math.ceil(meta.total / limit) : meta.total > 0 ? 1 : 0);
    return res.status(200).json({
        success: true,
        message,
        data,
        meta: { page, limit, total: meta.total, totalPages },
    });
}
function sendMessage(res, message, status = 200) {
    return res.status(status).json({ success: true, message, data: null });
}
function sendError(res, message, code, details, status = 400) {
    return res.status(status).json({ success: false, message, error: { code, details } });
}
//# sourceMappingURL=response.js.map