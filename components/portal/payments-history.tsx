"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type PaymentRow = Awaited<ReturnType<typeof import("@/actions/billing").getMyPaymentRequests>>[number];

const badgeTone: Record<string, "secondary" | "default" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

export function PaymentsHistory({ payments }: { payments: PaymentRow[] }) {
  if (!payments.length) {
    return <p className="text-sm text-zinc-500">No payment requests submitted yet.</p>;
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <Card key={payment.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{payment.plan?.name ?? "Unknown plan"}</CardTitle>
              <p className="text-sm text-zinc-500">
                Submitted {new Date(payment.createdAt).toLocaleString()}
              </p>
            </div>
            <Badge variant={badgeTone[payment.status] ?? "secondary"}>{payment.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div><span className="text-zinc-500">Plan Name:</span> {payment.plan?.name ?? "—"}</div>
              <div><span className="text-zinc-500">Amount:</span> {formatCurrency(payment.amount, payment.currency)}</div>
              <div><span className="text-zinc-500">Payment Method:</span> {payment.paymentMethod.name}</div>
              <div><span className="text-zinc-500">Transaction ID:</span> {payment.transactionId ?? "—"}</div>
              <div><span className="text-zinc-500">Mess:</span> {payment.mess?.name ?? "—"}</div>
              <div><span className="text-zinc-500">Approval Date:</span> {payment.reviewedAt ? new Date(payment.reviewedAt).toLocaleString() : "—"}</div>
              <div><span className="text-zinc-500">Reviewer:</span> {payment.reviewedBy?.name ?? "—"}</div>
              <div><span className="text-zinc-500">Status:</span> {payment.status}</div>
              {payment.note && <div className="md:col-span-2"><span className="text-zinc-500">Note:</span> {payment.note}</div>}
              {payment.rejectReason && <div className="md:col-span-2"><span className="text-zinc-500">Rejection reason:</span> {payment.rejectReason}</div>}
            </div>

            {payment.screenshotUrl && (
              <a href={payment.screenshotUrl} target="_blank" rel="noreferrer" className="inline-block">
                <Image
                  src={payment.screenshotUrl}
                  alt="Payment screenshot"
                  width={180}
                  height={180}
                  className="rounded-lg border object-cover"
                />
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
