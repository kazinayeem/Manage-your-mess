import { redirect } from "next/navigation";

export default function WelcomeRedirectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  redirect("/portal");
  return children;
}
