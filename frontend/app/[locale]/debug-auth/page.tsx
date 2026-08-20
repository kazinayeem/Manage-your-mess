import { auth } from "@/lib/auth";
import { apiPost } from "@/lib/server-api";

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
  return (
    <pre>
      {JSON.stringify(out, null, 2)}
    </pre>
  );
}