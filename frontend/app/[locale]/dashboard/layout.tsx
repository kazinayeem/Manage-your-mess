import { redirect } from "next/navigation";

export default function DashboardRedirectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  redirect("/portal");
  return children;
}
