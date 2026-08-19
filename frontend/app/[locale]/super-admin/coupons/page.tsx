import { getAdminCoupons } from "@/actions/super-admin";
import { CouponsManager } from "@/components/super-admin/coupons-manager";

export default async function SuperAdminCouponsPage() {
  const coupons = await getAdminCoupons();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Coupons</h1>
        <p className="text-zinc-500">Create and manage discount coupons.</p>
      </div>
      <CouponsManager coupons={coupons} />
    </div>
  );
}
