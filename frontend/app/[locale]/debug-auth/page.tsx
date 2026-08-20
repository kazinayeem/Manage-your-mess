import { auth } from "@/lib/auth";
import { apiPost } from "@/lib/server-api";
import { db } from "@/lib/db";

export default async function DebugAuthPage() {
  const session = await auth();
  if (!session) {
    return <pre>{"NO_SESSION"}</pre>;
  }
  const out: Record<string, unknown> = {};
  try {
    out.direct = await apiPost("/query", {
      model: "User",
      action: "findUnique",
      args: { where: { id: session.user.id } },
    });
  } catch (e) {
    out.direct = `ERROR ${e instanceof Error ? e.message : String(e)}`;
  }
  try {
    const u = await db.user.findUnique({ where: { id: session.user.id } });
    out.proxy = u ? { id: u.id, email: u.email } : null;
  } catch (e) {
    out.proxy = `ERROR ${e instanceof Error ? e.message : String(e)}`;
  }
  return (
    <pre>
      {JSON.stringify(out, null, 2)}
    </pre>
  );
}