"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/actions";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  relatedEventId: string | null;
  read: boolean;
  when: string;
};

export function NotificationsView({ items }: { items: NotificationItem[] }) {
  const [pending, startTransition] = useTransition();
  const hasUnread = items.some((i) => !i.read);

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
        No notifications yet. Schedule changes and coach assignments show up here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {hasUnread && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => void (await markAllNotificationsRead()))}
          className="text-xs text-[#8BC34A] disabled:opacity-50"
        >
          Mark all as read
        </button>
      )}
      <div className="space-y-2">
        {items.map((item) => {
          const inner = (
            <div
              className={`rounded-xl border p-3 ${
                item.read
                  ? "border-zinc-800 bg-zinc-900"
                  : "border-[#8BC34A]/30 bg-[#8BC34A]/5"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                {!item.read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#8BC34A]" />
                )}
              </div>
              {item.body && (
                <p className="mt-0.5 text-xs text-zinc-400">{item.body}</p>
              )}
              <p className="mt-1 text-[11px] text-zinc-600">{item.when}</p>
            </div>
          );

          if (item.relatedEventId) {
            return (
              <Link
                key={item.id}
                href={`/schedule/${item.relatedEventId}`}
                onClick={() =>
                  !item.read &&
                  startTransition(async () =>
                    void (await markNotificationRead(item.id)),
                  )
                }
              >
                {inner}
              </Link>
            );
          }
          return <div key={item.id}>{inner}</div>;
        })}
      </div>
    </div>
  );
}
