import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffFromCookies } from "@/server/auth/current-staff";
import { loadClinic } from "@/server/clinics";
import { db } from "@/server/db/client";
import { LogoutButton } from "./logout-button";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const staff = await getStaffFromCookies();
  if (!staff) redirect("/login");
  const clinic = await loadClinic(db, staff.clinicId);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="font-semibold">
            {clinic?.name ?? "VCare"}
          </Link>
          <div className="flex items-center gap-4 text-sm text-zinc-600">
            <span>{staff.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
