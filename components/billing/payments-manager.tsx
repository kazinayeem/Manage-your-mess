"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { reviewPaymentRequest } from "@/actions/billing";
import type { PaymentRequestStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { Check, X, MessageCircle, RotateCcw } from "lucide-react";

type PaymentRequest = Awaited<ReturnType<typeof import("@/actions/billing").getPaymentRequests>>[number];

const TABS: { key: PaymentRequestStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "REFUNDED", label: "Refunded" },
  { key: "NEEDS_INFO", label: "Needs Info" },
];

export function PaymentsManager({ requests }: { requests: PaymentRequest[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<string>("PENDING");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");

  const filtered = requests.filter((request) => {
    const matchTab = tab === "ALL" ? true : request.status === tab;
    const q = search.trim().toLowerCase();
    const matchSearch = !q
      ? true
      : [
          request.user.name ?? "",
          request.user.email ?? "",
          request.plan.name,
          request.paymentMethod.name,
          request.transactionId ?? "",
          request.mess?.name ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
    return matchTab && matchSearch;
  });

  function handleAction(id: string, action: "approve" | "reject" | "needs_info" | "refund") {
    startTransition(async () => {
      const result = await reviewPaymentRequest(id, action, note || undefined);
      if (result.success) {
        toast.success(`Payment ${action}d`);
        setNote("");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Management</h1>
        <p className="text-zinc-500">Review subscription payments, approve, reject, or request more information.</p>
      </div>

      <Input
        placeholder="Search by user, mess, transaction ID, plan, or method"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
              <Badge variant="secondary" className="ml-2">
                {t.key === "ALL" ? requests.length : requests.filter((r) => r.status === t.key).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.key} value={t.key} className="space-y-4">
            {filtered.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-zinc-500">No {t.label.toLowerCase()} payments.</CardContent></Card>
            ) : (
              filtered.map((req) => (
                <Card key={req.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle>{req.user.name ?? req.user.email}</CardTitle>
                        <p className="text-sm text-zinc-500">{req.user.email}</p>
                      </div>
                      <Badge>{req.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      <div><span className="text-zinc-500">Plan:</span> {req.plan.name}</div>
                      <div><span className="text-zinc-500">Amount:</span> {formatCurrency(req.amount, req.currency)}</div>
                      <div><span className="text-zinc-500">Method:</span> {req.paymentMethod.name}</div>
                      <div><span className="text-zinc-500">Transaction ID:</span> {req.transactionId ?? "—"}</div>
                      <div><span className="text-zinc-500">Sender:</span> {req.senderNumber ?? "—"}</div>
                      <div><span className="text-zinc-500">Mess:</span> {req.mess?.name ?? "—"}</div>
                      <div><span className="text-zinc-500">Requested:</span> {new Date(req.createdAt).toLocaleString()}</div>
                      <div><span className="text-zinc-500">Reviewed:</span> {req.reviewedAt ? new Date(req.reviewedAt).toLocaleString() : "—"}</div>
                      <div><span className="text-zinc-500">Reviewer:</span> {req.reviewedBy?.name ?? "—"}</div>
                      {req.note && <div className="sm:col-span-2"><span className="text-zinc-500">Note:</span> {req.note}</div>}
                      {req.rejectReason && <div className="sm:col-span-2"><span className="text-zinc-500">Rejection reason:</span> {req.rejectReason}</div>}
                      {req.adminNote && <div className="sm:col-span-2"><span className="text-zinc-500">Admin note:</span> {req.adminNote}</div>}
                    </div>

                    {req.screenshotUrl && (
                      <div>
                        <p className="mb-2 text-sm text-zinc-500">Payment Screenshot</p>
                        <a href={req.screenshotUrl} target="_blank" rel="noreferrer" className="inline-block">
                          <Image src={req.screenshotUrl} alt="Payment screenshot" width={200} height={200} className="rounded-lg border object-cover" />
                        </a>
                      </div>
                    )}

                    {req.status === "PENDING" && (
                      <div className="space-y-3 border-t pt-4">
                        <Textarea placeholder="Admin note or rejection reason..." value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" className="gap-1" disabled={pending} onClick={() => handleAction(req.id, "approve")}>
                            <Check className="h-4 w-4" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" className="gap-1" disabled={pending} onClick={() => handleAction(req.id, "reject")}>
                            <X className="h-4 w-4" /> Reject
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1" disabled={pending} onClick={() => handleAction(req.id, "needs_info")}>
                            <MessageCircle className="h-4 w-4" /> Request Info
                          </Button>
                        </div>
                      </div>
                    )}

                    {req.status === "APPROVED" && (
                      <Button size="sm" variant="outline" className="gap-1" disabled={pending} onClick={() => handleAction(req.id, "refund")}>
                        <RotateCcw className="h-4 w-4" /> Refund
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
