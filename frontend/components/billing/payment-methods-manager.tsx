"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { savePaymentMethod, deletePaymentMethod } from "@/actions/billing";
import type { PaymentMethod } from "@prisma/client";
import { Pencil, Plus, Trash2 } from "lucide-react";

export function PaymentMethodsManager({ methods }: { methods: PaymentMethod[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    accountName: "",
    accountNumber: "",
    accountType: "",
    qrCodeUrl: "",
    instructions: "",
    isActive: true,
    sortOrder: "0",
  });

  function openCreate() {
    setEditing(null);
    setForm({ name: "", accountName: "", accountNumber: "", accountType: "", qrCodeUrl: "", instructions: "", isActive: true, sortOrder: String(methods.length) });
    setShowForm(true);
  }

  function openEdit(m: PaymentMethod) {
    setEditing(m);
    setForm({
      name: m.name,
      accountName: m.accountName ?? "",
      accountNumber: m.accountNumber ?? "",
      accountType: m.accountType ?? "",
      qrCodeUrl: m.qrCodeUrl ?? "",
      instructions: m.instructions ?? "",
      isActive: m.isActive,
      sortOrder: String(m.sortOrder),
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    if (editing) fd.set("id", editing.id);
    Object.entries(form).forEach(([k, v]) => fd.set(k, String(v)));
    startTransition(async () => {
      const result = await savePaymentMethod(fd);
      if (result.success) {
        toast.success(editing ? "Updated" : "Created");
        setShowForm(false);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <p className="text-zinc-500">Configure bKash, Nagad, Rocket, bank transfer, and custom methods.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Method</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editing ? "Edit" : "New"} Payment Method</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="bKash" /></div>
              <div className="space-y-2"><Label>Account Name</Label><Input value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Account / Mobile Number</Label><Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} /></div>
              <div className="space-y-2"><Label>Account Type</Label><Input value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })} placeholder="Personal / Merchant" /></div>
              <div className="space-y-2 sm:col-span-2"><Label>QR Code URL</Label><Input value={form.qrCodeUrl} onChange={(e) => setForm({ ...form, qrCodeUrl: e.target.value })} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Instructions</Label><Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={3} /></div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /> Active</label>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={pending}>Save</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {methods.map((m) => (
          <Card key={m.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {m.name}
                <Badge variant={m.isActive ? "default" : "secondary"}>{m.isActive ? "Active" : "Inactive"}</Badge>
              </CardTitle>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => startTransition(async () => { await deletePaymentMethod(m.id); router.refresh(); })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-zinc-600">
              {m.accountName && <p>Account: {m.accountName}</p>}
              {m.accountNumber && <p>Number: {m.accountNumber}</p>}
              {m.accountType && <p>Type: {m.accountType}</p>}
              {m.instructions && <p className="text-zinc-500">{m.instructions}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
