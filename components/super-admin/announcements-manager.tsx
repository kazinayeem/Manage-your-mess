"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { deleteAnnouncement, saveAnnouncement } from "@/actions/announcements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

const audienceOptions = [
  "ALL_USERS",
  "ALL_MANAGERS",
  "ALL_MEMBERS",
  "FREE_PLAN_USERS",
  "PRO_PLAN_USERS",
  "BUSINESS_PLAN_USERS",
  "ENTERPRISE_PLAN_USERS",
  "SPECIFIC_MESSES",
] as const;

type AnnouncementRow = Awaited<
  ReturnType<typeof import("@/actions/announcements").getAdminAnnouncements>
>[number];

function toDateTimeLocal(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseTargetMessIds(raw: string | null | undefined) {
  try {
    return JSON.parse(raw || "[]") as string[];
  } catch {
    return [];
  }
}

export function AnnouncementsManager({
  announcements,
  messes,
}: {
  announcements: AnnouncementRow[];
  messes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("INFORMATION");
  const [priority, setPriority] = useState("MEDIUM");
  const [audienceType, setAudienceType] = useState("ALL_USERS");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [targetMessIds, setTargetMessIds] = useState<string[]>([]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setType("INFORMATION");
    setPriority("MEDIUM");
    setAudienceType("ALL_USERS");
    setStartsAt("");
    setEndsAt("");
    setIsPublished(true);
    setTargetMessIds([]);
  }

  function openEdit(announcement: AnnouncementRow) {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setDescription(announcement.description);
    setType(announcement.type);
    setPriority(announcement.priority);
    setAudienceType(announcement.audienceType);
    setStartsAt(toDateTimeLocal(announcement.startsAt));
    setEndsAt(toDateTimeLocal(announcement.endsAt));
    setIsPublished(announcement.isPublished);
    setTargetMessIds(parseTargetMessIds(announcement.targetMessIds));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    if (editingId) formData.set("id", editingId);
    formData.set("title", title);
    formData.set("description", description);
    formData.set("type", type);
    formData.set("priority", priority);
    formData.set("audienceType", audienceType);
    if (startsAt) formData.set("startsAt", startsAt);
    if (endsAt) formData.set("endsAt", endsAt);
    formData.set("isPublished", String(isPublished));
    targetMessIds.forEach((messId) => formData.append("targetMessIds", messId));

    startTransition(async () => {
      const result = await saveAnnouncement(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(editingId ? "Announcement updated" : "Announcement saved");
      resetForm();
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this announcement permanently?")) return;
    startTransition(async () => {
      const result = await deleteAnnouncement(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (editingId === id) resetForm();
      toast.success("Announcement deleted");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Announcement" : "Create Announcement"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label>Publish Status</Label>
                <Select value={isPublished ? "published" : "draft"} onValueChange={(value) => setIsPublished(value === "published")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INFORMATION">Information</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="PROMOTION">Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label>Target Audience</Label>
                <Select value={audienceType} onValueChange={setAudienceType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {audienceOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option.replaceAll("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {audienceType === "SPECIFIC_MESSES" && (
                <div className="md:col-span-2 space-y-2">
                  <Label>Specific Messes</Label>
                  <div className="grid gap-2 md:grid-cols-2">
                    {messes.map((mess) => (
                      <label key={mess.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={targetMessIds.includes(mess.id)}
                          onChange={(event) =>
                            setTargetMessIds((current) =>
                              event.target.checked
                                ? [...current, mess.id]
                                : current.filter((id) => id !== mess.id)
                            )
                          }
                          className="h-4 w-4 rounded border-zinc-300"
                        />
                        {mess.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : editingId ? "Update Announcement" : "Save Announcement"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" disabled={pending} onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Announcement History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{announcement.title}</p>
                  <p className="text-sm text-zinc-500">
                    {announcement.audienceType.replaceAll("_", " ")} · {announcement.type} · {announcement.createdBy.name ?? announcement.createdBy.email}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{announcement.priority}</Badge>
                  <Badge>{announcement.isPublished ? "Published" : "Draft"}</Badge>
                  <Badge variant="secondary">{announcement._count.reads} deliveries</Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => openEdit(announcement)}
                    aria-label="Edit announcement"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => handleDelete(announcement.id)}
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{announcement.description}</p>
            </div>
          ))}
          {announcements.length === 0 && <p className="text-sm text-zinc-500">No announcements created yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
