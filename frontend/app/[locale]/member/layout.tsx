import { redirect } from "next/navigation";

export default function MemberRedirectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  redirect("/portal");
  return children;
}
