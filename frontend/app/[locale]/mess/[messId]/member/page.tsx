import { redirect } from "next/navigation";
import { messPath } from "@/lib/mess-routes";

export default async function MessMemberAliasPage({
  params,
}: {
  params: Promise<{ messId: string }>;
}) {
  const { messId } = await params;
  redirect(messPath(messId));
}
