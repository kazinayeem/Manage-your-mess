"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthCookies = setAuthCookies;
exports.setAccessCookie = setAccessCookie;
exports.clearAuthCookies = clearAuthCookies;
exports.setActiveMessCookie = setActiveMessCookie;
exports.getActiveMessFromCookie = getActiveMessFromCookie;
const env_1 = require("../config/env");
const baseCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: env_1.env.isProduction,
    path: "/",
};
function setAuthCookies(res, accessToken, refreshToken) {
    res.cookie(env_1.SESSION_COOKIE_NAME, accessToken, {
        ...baseCookieOptions,
        maxAge: 15 * 60 * 1000,
    });
    res.cookie(env_1.REFRESH_COOKIE_NAME, refreshToken, {
        ...baseCookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
}
function setAccessCookie(res, accessToken) {
    res.cookie(env_1.SESSION_COOKIE_NAME, accessToken, {
        ...baseCookieOptions,
        maxAge: 15 * 60 * 1000,
    });
}
function clearAuthCookies(res) {
    res.clearCookie(env_1.SESSION_COOKIE_NAME, { ...baseCookieOptions });
    res.clearCookie(env_1.REFRESH_COOKIE_NAME, { ...baseCookieOptions });
}
function setActiveMessCookie(res, messId) {
    res.cookie(env_1.ACTIVE_MESS_COOKIE, messId, {
        httpOnly: false,
        sameSite: "lax",
        secure: env_1.env.isProduction,
        path: "/",
        maxAge: 365 * 24 * 60 * 60 * 1000,
    });
}
function getActiveMessFromCookie(cookies) {
    return cookies[env_1.ACTIVE_MESS_COOKIE] ?? null;
}
//# sourceMappingURL=cookies.js.map