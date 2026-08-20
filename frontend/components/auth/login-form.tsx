"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn } from "@/lib/auth-client";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { normalizeEmail } from "@/lib/utils";
import { setTokens } from "@/lib/token-storage";
import { apiGet, apiPost } from "@/lib/api-client";

function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/portal";
  return raw;
}

export function LoginForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const [loading, setLoading] = useState(false);

  async function processLogin(email: string, password: string) {
    setLoading(true);
    try {
      // 1. Login request
      const res = await apiPost("/auth/login", { email, password });
      if (!res.success || !res.data) {
        toast.error(res.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      // 2. Extract & Persist tokens
      const { accessToken, refreshToken, user } = res.data;
      if (accessToken) {
        setTokens(accessToken, refreshToken);
      }

      // 3. Call /me via API client (attaches Authorization header) to verify session
      const meRes = await apiGet("/auth/me");
      const currentUser = meRes.success && meRes.data?.user ? meRes.data.user : user;

      // 4. Navigate to role-specific dashboard
      if (currentUser?.role === "SUPER_ADMIN") {
        window.location.assign("/super-admin");
      } else {
        window.location.assign(callbackUrl);
      }
    } catch {
      toast.error("Login failed. Please try again.");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const password = String(formData.get("password") ?? "");
    await processLogin(email, password);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
          BM
        </div>
        <CardTitle className="text-2xl">{t("welcomeBack")}</CardTitle>
        <CardDescription>{tCommon("appName")}</CardDescription>
      </CardHeader>
      <CardContent>
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
          <Button type="submit" className="w-full" disabled={loading}>
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
          onClick={() => signIn("google", { callbackUrl })}
        >
          {t("google")}
        </Button>

        {process.env.NODE_ENV !== "production" && (
          <div className="mt-6 border-t pt-4">
            <p className="text-center text-xs font-semibold text-zinc-400 mb-3">
              Quick Login (Dev Mode Only)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => processLogin("admin@messflow.pro", "Admin@123456")}
                disabled={loading}
              >
                Super Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => processLogin("demo@messflow.pro", "Demo@123456")}
                disabled={loading}
              >
                Demo Owner
              </Button>
            </div>
          </div>
        )}

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
