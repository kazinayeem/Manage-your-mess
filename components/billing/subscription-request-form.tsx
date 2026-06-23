"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { submitSubscriptionRequest } from "@/actions/billing";
import { formatPlanDuration, type ParsedPlan } from "@/lib/billing/plan-utils";
import { formatCurrency } from "@/lib/utils";
import type { PaymentMethod } from "@prisma/client";
import { CheckCircle2 } from "lucide-react";

export function SubscriptionRequestForm({
  plan,
  paymentMethods,
  messes,
}: {
  plan: ParsedPlan;
  paymentMethods: PaymentMethod[];
  messes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? "");
  const [messId, setMessId] = useState(messes[0]?.id ?? "");
  const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId);

  if (submitted) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <CheckCircle2 className="h-16 w-16 text-emerald-600" />
          <h2 className="text-xl font-bold">Subscription request submitted successfully</h2>
          <p className="text-zinc-500">
            Your payment request has been submitted successfully. Please wait for admin approval.
          </p>
          <p className="text-sm font-medium text-amber-600">Status: Pending Approval</p>
          <Button onClick={() => router.push("/portal/subscription")}>View Subscription</Button>
        </CardContent>
      </Card>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("planId", plan.id);
    formData.set("paymentMethodId", paymentMethodId);
    if (messId) formData.set("messId", messId);

    startTransition(async () => {
      const result = await submitSubscriptionRequest(formData);
      if (result.success) {
        setSubmitted(true);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{plan.name}</CardTitle>
          <CardDescription>
            {formatCurrency(plan.price, plan.currency)} · {formatPlanDuration(plan)}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Send payment using one of the methods below, then submit your transaction details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedMethod && (
            <div className="rounded-lg border bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
              <p className="font-semibold">{selectedMethod.name}</p>
              {selectedMethod.accountName && <p>Account: {selectedMethod.accountName}</p>}
              {selectedMethod.accountNumber && <p>Number: {selectedMethod.accountNumber}</p>}
              {selectedMethod.instructions && <p className="mt-2 text-zinc-500">{selectedMethod.instructions}</p>}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {messes.length > 0 && (
              <div className="space-y-2">
                <Label>Mess (optional)</Label>
                <Select value={messId} onValueChange={setMessId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {messes.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Transaction ID</Label>
                <Input name="transactionId" required placeholder="e.g. TRX123456" />
              </div>
              <div className="space-y-2">
                <Label>Sender Number</Label>
                <Input name="senderNumber" placeholder="01XXXXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label>Payment Amount</Label>
                <Input name="amount" type="number" step="0.01" required defaultValue={plan.price || ""} />
              </div>
              <div className="space-y-2">
                <Label>Screenshot Upload</Label>
                <Input name="screenshot" type="file" accept="image/*" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea name="note" rows={2} placeholder="Any additional information..." />
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
