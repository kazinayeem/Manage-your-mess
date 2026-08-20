"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useUpdateMemberMutation, useAddMemberMutation } from "@/lib/store/api/mess-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { messPath } from "@/lib/mess-routes";

export type MemberFormValues = {
  fullName: string;
  phone?: string | null;
  nid?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  occupation?: string | null;
  university?: string | null;
  monthlyDeposit: number;
};

export function MemberFormFields({
  defaultValues,
  labels,
}: {
  defaultValues?: Partial<MemberFormValues>;
  labels: Record<string, string>;
}) {
  return (
    <>
      <div>
        <Label htmlFor="fullName">{labels.fullName}</Label>
        <Input id="fullName" name="fullName" required defaultValue={defaultValues?.fullName ?? ""} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="phone">{labels.phone}</Label>
        <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ""} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="nid">{labels.nid}</Label>
        <Input id="nid" name="nid" defaultValue={defaultValues?.nid ?? ""} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="bloodGroup">{labels.bloodGroup}</Label>
        <Input id="bloodGroup" name="bloodGroup" placeholder="e.g. O_POSITIVE" defaultValue={defaultValues?.bloodGroup ?? ""} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="address">{labels.address}</Label>
        <Textarea id="address" name="address" rows={2} defaultValue={defaultValues?.address ?? ""} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="occupation">{labels.occupation}</Label>
        <Input id="occupation" name="occupation" defaultValue={defaultValues?.occupation ?? ""} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="university">{labels.university}</Label>
        <Input id="university" name="university" defaultValue={defaultValues?.university ?? ""} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="monthlyDeposit">{labels.monthlyDeposit}</Label>
        <Input
          id="monthlyDeposit"
          name="monthlyDeposit"
          type="number"
          min={0}
          step="0.01"
          defaultValue={defaultValues?.monthlyDeposit ?? 0}
          className="mt-1"
        />
      </div>
    </>
  );
}

export function EditMemberForm({
  messId,
  memberId,
  defaultValues,
}: {
  messId: string;
  memberId: string;
  defaultValues: MemberFormValues;
}) {
  const t = useTranslations("messMembers");
  const router = useRouter();
  const [updateMember] = useUpdateMemberMutation();
  const [loading, setLoading] = useState(false);

  const labels = {
    fullName: t("fullName"),
    phone: t("phone"),
    nid: t("nid"),
    bloodGroup: t("bloodGroup"),
    address: t("address"),
    occupation: t("occupation"),
    university: t("university"),
    monthlyDeposit: t("monthlyDeposit"),
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      fullName: String(fd.get("fullName") || ""),
      phone: String(fd.get("phone") || ""),
      nid: String(fd.get("nid") || ""),
      bloodGroup: String(fd.get("bloodGroup") || ""),
      address: String(fd.get("address") || ""),
      occupation: String(fd.get("occupation") || ""),
      university: String(fd.get("university") || ""),
      monthlyDeposit: Number(fd.get("monthlyDeposit") || 0),
    };

    try {
      await updateMember({ messId, memberId, body }).unwrap();
      toast.success(t("saveSuccess"));
      router.push(messPath(messId, `/members/${memberId}`));
      router.refresh();
    } catch (err: any) {
      toast.error(err?.data?.message || t("saveFailed"));
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>{t("editTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <MemberFormFields defaultValues={defaultValues} labels={labels} />
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t("saving") : t("save")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function AddMemberFormClient({ messId }: { messId: string }) {
  const t = useTranslations("messMembers");
  const router = useRouter();
  const [addMember] = useAddMemberMutation();
  const [loading, setLoading] = useState(false);

  const labels = {
    fullName: t("fullName"),
    phone: t("phone"),
    nid: t("nid"),
    bloodGroup: t("bloodGroup"),
    address: t("address"),
    occupation: t("occupation"),
    university: t("university"),
    monthlyDeposit: t("monthlyDeposit"),
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      fullName: String(fd.get("fullName") || ""),
      phone: String(fd.get("phone") || ""),
      nid: String(fd.get("nid") || ""),
      bloodGroup: String(fd.get("bloodGroup") || ""),
      address: String(fd.get("address") || ""),
      occupation: String(fd.get("occupation") || ""),
      university: String(fd.get("university") || ""),
      monthlyDeposit: Number(fd.get("monthlyDeposit") || 0),
    };

    try {
      await addMember({ messId, body }).unwrap();
      toast.success(t("addSuccess"));
      router.push(messPath(messId, "/members"));
      router.refresh();
    } catch (err: any) {
      toast.error(err?.data?.message || t("saveFailed"));
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>{t("addTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <MemberFormFields labels={labels} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("saving") : t("addMember")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

