import type { UserRole } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface MessAccess {
  user: SessionUser;
  member: {
    id: string;
    userId: string;
    role: UserRole;
    status: string;
    fullName: string | null;
  } | null;
  mess: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    managerId: string | null;
    inviteCode: string;
    currentMonthId: string | null;
    subscriptionId: string | null;
  } & Record<string, unknown>;
  role: UserRole;
}