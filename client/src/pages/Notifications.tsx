/** JECI notifications: page dédiée, branchée sur server/routers/notifications.ts. */
import { Bell, Check } from "lucide-react";
import { Link } from "wouter";
import { PageIntro, Panel } from "@/components/UiPrimitives";
import { trpc } from "@/lib/trpc";

function formatRelativeTime(date: string | Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.round(hours / 24)} j`;
}

export default function Notifications() {
  const utils = trpc.useUtils();
  const notificationsQuery = trpc.notifications.list.useQuery({}, { refetchInterval: 15000 });

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const notifications = notificationsQuery.data ?? [];
  const hasUnread = notifications.some((notification) => !notification.readAt);

  return (
    <div className="mx-auto max-w-2xl">
      <PageIntro
        eyebrow="Mon activité"
        title="Notifications"
        description="Toute l'activité du réseau qui vous concerne."
        action={
          hasUnread ? (
            <button onClick={() => markAllRead.mutate()} className="inline-flex items-center gap-1.5 rounded-full border border-[#E0DAD0] px-3.5 py-2 text-xs font-bold text-[#536071] transition hover:bg-[#F5F1EA]">
              <Check size={14} /> Tout marquer comme lu
            </button>
          ) : undefined
        }
      />
      {notificationsQuery.isLoading && <p className="text-sm text-[#707787]">Chargement...</p>}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <Link
            key={notification.id}
            href={notification.link ?? "#"}
            onClick={() => !notification.readAt && markRead.mutate({ notificationId: notification.id })}
            className={`block rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(10,32,63,0.06)] ${!notification.readAt ? "border-[#F0A366] bg-[#FFFBF0]" : "border-[#E6E1D9] bg-white"}`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${!notification.readAt ? "bg-[#F4E5BC] text-[#674A11]" : "bg-[#F1F3F8] text-[#707787]"}`}>
                <Bell size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#18263E]">{notification.title}</p>
                {notification.body && <p className="mt-1 text-xs leading-5 text-[#586277]">{notification.body}</p>}
                <p className="mt-1.5 text-[10px] text-[#9A9A98]">{formatRelativeTime(notification.createdAt)}</p>
              </div>
              {!notification.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#A5232A]" />}
            </div>
          </Link>
        ))}
      </div>
      {!notificationsQuery.isLoading && notifications.length === 0 && (
        <Panel className="p-10 text-center">
          <Bell className="mx-auto text-[#9BA1A9]" size={26} />
          <p className="mt-2 text-sm text-[#697485]">Aucune notification pour l'instant.</p>
        </Panel>
      )}
    </div>
  );
}
