import { messPath } from "@/lib/mess-routes";

/** Static bazaar routes — must not collide with task IDs under /bazaar/tasks/[taskId]. */
export const BAZAAR_STATIC_SEGMENTS = new Set([
  "new",
  "my",
  "history",
  "assigned",
  "reports",
  "tasks",
]);

export function bazaarTaskPath(messId: string, taskId: string) {
  return messPath(messId, `/bazaar/tasks/${taskId}`);
}
