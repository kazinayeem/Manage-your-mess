import { redirect } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  redirect("/super-admin");
  return children;
}
