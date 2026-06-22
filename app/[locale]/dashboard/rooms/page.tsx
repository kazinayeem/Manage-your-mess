import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserMesses } from "@/lib/queries";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function RoomsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const messes = await getUserMesses(session.user.id);
  if (messes.length === 0) redirect("/dashboard/messes/new");

  const rooms = await db.room.findMany({
    where: { messId: messes[0].messId, deletedAt: null },
    include: { beds: { include: { member: { select: { fullName: true } } } } },
    orderBy: { number: "asc" },
  });

  const totalBeds = rooms.reduce((s, r) => s + r.beds.length, 0);
  const occupied = rooms.reduce((s, r) => s + r.beds.filter((b) => b.isOccupied).length, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Room Management</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{rooms.length}</p><p className="text-xs text-zinc-500">Rooms</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{occupied}/{totalBeds}</p><p className="text-xs text-zinc-500">Occupancy</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0}%</p><p className="text-xs text-zinc-500">Occupancy Rate</p></CardContent></Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <Card key={room.id}>
            <CardHeader>
              <CardTitle className="text-base">Room {room.number}</CardTitle>
              <p className="text-xs text-zinc-500">Floor {room.floor} · Capacity {room.capacity}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {room.beds.map((bed) => (
                <div key={bed.id} className="flex items-center justify-between text-sm">
                  <span>Bed {bed.number}</span>
                  <Badge variant={bed.isOccupied ? "default" : "outline"}>
                    {bed.isOccupied ? bed.member?.fullName ?? "Occupied" : "Vacant"}
                  </Badge>
                </div>
              ))}
              {room.beds.length === 0 && <p className="text-sm text-zinc-500">No beds configured</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
