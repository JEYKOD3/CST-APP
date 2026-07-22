import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureAppUser } from "@/lib/auth";
import { canManageSchedule } from "@/lib/roles";
import { listAllVenues } from "@/features/venues/queries";
import { VenueManager } from "@/features/venues/components/venue-manager";

export default async function VenuesPage() {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) redirect("/schedule");

  const venues = await listAllVenues();

  return (
    <main>
      <Link href="/schedule/manage" className="text-xs text-zinc-500">
        ← Manage schedule
      </Link>
      <h1 className="mb-1 mt-2 text-xl font-bold">Venues</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Add or edit venues as court rentals change. Deactivated venues stay on
        past practices but are hidden from new-practice pickers and season
        attribution.
      </p>

      <VenueManager venues={venues} />
    </main>
  );
}
