import type { MessAccess, SessionUser } from "./auth";

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      access?: MessAccess;
    }
  }
}

export {};