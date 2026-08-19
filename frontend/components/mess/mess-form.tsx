"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type SubmitFn = (messId: string, formData: FormData) => Promise<{ success: boolean; error?: string }>;

interface MessFormProps {
  messId: string;
  title: string;
  submitLabel: string;
  onSubmit: SubmitFn;
  children: React.ReactNode;
}

export function MessForm({ messId, title, submitLabel, onSubmit, children }: MessFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await onSubmit(messId, formData);
    if (!result.success) {
      toast.error(result.error ?? "Something went wrong");
      setLoading(false);
      return;
    }
    toast.success("Saved successfully");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {children}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function FormField({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  children?: React.ReactNode;
}) {
  if (children) {
    return (
      <div>
        <Label htmlFor={name}>{label}</Label>
        <div className="mt-1">{children}</div>
      </div>
    );
  }
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-1"
      />
    </div>
  );
}
