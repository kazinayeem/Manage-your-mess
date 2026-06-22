"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerUser } from "@/actions/mess";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const result = await registerUser(formData);
    if (!result.success) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (signInResult?.error) {
      toast.error("Account created. Please sign in.");
      router.push("/login");
      return;
    }

    toast.success("Welcome to MessFlow Pro!");
    router.push("/portal");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
          MF
        </div>
        <CardTitle className="text-2xl">{t("createAccount")}</CardTitle>
        <CardDescription>Start managing your mess for free</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" name="name" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" name="email" type="email" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" name="password" type="password" required minLength={8} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required className="mt-1" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : t("createAccount")}
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
          {t("hasAccount")}{" "}
          <Link href="/login" className="font-medium text-emerald-600 hover:underline">
            {t("welcomeBack")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
