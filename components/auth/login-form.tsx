"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signIn, getSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Shield } from "lucide-react";

function loginErrorMessage(error?: string | null): string {
  if (!error) return "Invalid email or password.";
  const lower = error.toLowerCase();
  if (lower.includes("locked")) {
    return "Account is temporarily locked after too many failed attempts. Wait 30 minutes or contact support.";
  }
  if (lower.includes("too many")) return "Too many login attempts. Please wait and try again.";
  if (error === "CredentialsSignin") return "Invalid email or password.";
  return error;
}

const SUPER_ADMIN_EMAIL = "admin@messflow.pro";
const SUPER_ADMIN_PASSWORD = "Admin@123456";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  async function completeLogin() {
    const session = await getSession();
    const role = session?.user?.role;

    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      router.push("/super-admin");
    } else {
      router.push("/portal");
    }
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    const result = await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      toast.error(loginErrorMessage(result.error));
      setLoading(false);
      return;
    }

    await completeLogin();
  }

  async function handleSuperAdminLogin() {
    setAdminLoading(true);
    const result = await signIn("credentials", {
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Super admin login failed. Run: npm run db:seed");
      setAdminLoading(false);
      return;
    }

    toast.success("Logged in as Super Admin");
    await completeLogin();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
          MF
        </div>
        <CardTitle className="text-2xl">{t("welcomeBack")}</CardTitle>
        <CardDescription>Sign in to your MessFlow Pro account</CardDescription>
      </CardHeader>
      <CardContent>
        {isDev && (
          <Button
            type="button"
            variant="secondary"
            className="mb-4 w-full gap-2"
            onClick={handleSuperAdminLogin}
            disabled={adminLoading || loading}
          >
            <Shield className="h-4 w-4" />
            {adminLoading ? "Signing in..." : "Quick Login — Super Admin"}
          </Button>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" name="email" type="email" required className="mt-1" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("password")}</Label>
              <Link href="/forgot-password" className="text-xs text-emerald-600 hover:underline">
                {t("forgotPassword")}
              </Link>
            </div>
            <Input id="password" name="password" type="password" required className="mt-1" />
          </div>
          <Button type="submit" className="w-full" disabled={loading || adminLoading}>
            {loading ? "Signing in..." : t("welcomeBack")}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-950">{t("orContinueWith")}</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => signIn("google", { callbackUrl: "/portal" })}
        >
          {t("google")}
        </Button>

        <p className="mt-6 text-center text-sm text-zinc-500">
          {t("noAccount")}{" "}
          <Link href="/register" className="font-medium text-emerald-600 hover:underline">
            {t("createAccount")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
