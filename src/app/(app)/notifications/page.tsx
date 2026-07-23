import { ensureAppUser } from "@/lib/auth";
import { listNotifications } from "@/features/notifications/queries";
import {
  NotificationsView,
  type NotificationItem,
} from "@/features/notifications/components/notifications-view";
import { CLUB_TIMEZONE } from "@/lib/calendar";

function formatWhen(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TIMEZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function NotificationsPage() {
  const user = await ensureAppUser();
  const rows = await listNotifications(user.id);

  const items: NotificationItem[] = rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    relatedEventId: n.relatedEventId,
    read: n.readAt !== null,
    when: formatWhen(n.createdAt),
  }));

  return (
    <main>
      <h1 className="cst-page-title mb-1">Notifications</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Schedule changes, cancellations, and coach assignments — no more texts.
      </p>
      <NotificationsView items={items} />
    </main>
  );
}
