/** JECI — « Infos sur le message » : qui a lu / pas encore lu un message de groupe (structure ou communauté). */
import { X } from "lucide-react";
import { Avatar, ProfileLink } from "@/components/UiPrimitives";
import { storageUrl } from "@/lib/storageUrl";
import { trpc } from "@/lib/trpc";

export function MessageReceiptsModal({ conversationId, messageId, onClose }: { conversationId: number; messageId: number; onClose: () => void }) {
  const receiptsQuery = trpc.messaging.messageReceipts.useQuery({ conversationId, messageId });
  const read = receiptsQuery.data?.read ?? [];
  const unread = receiptsQuery.data?.unread ?? [];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#091830]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="max-h-[80dvh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-xl font-semibold text-[#0B1931]">Infos sur le message</h2>
          <button onClick={onClose} className="rounded-full p-1 text-[#7E8490] hover:bg-[#F3F0EA]" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {receiptsQuery.isLoading && <p className="mt-4 text-xs text-[#9AA1AA]">Chargement...</p>}

        {!receiptsQuery.isLoading && (
          <>
            <div className="mt-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#3B32A0]">Lu ({read.length})</p>
              <div className="mt-2 space-y-2">
                {read.map((member) => (
                  <div key={member.userId} className="flex items-center gap-2">
                    <ProfileLink userId={member.userId}>
                      <Avatar alt={member.name ?? "Membre"} src={storageUrl(member.avatarStorageKey)} size="sm" />
                    </ProfileLink>
                    <ProfileLink userId={member.userId} className="text-xs font-bold text-[#293446] hover:underline">
                      {member.name}
                    </ProfileLink>
                  </div>
                ))}
                {read.length === 0 && <p className="text-[11px] text-[#9AA1AA]">Personne pour l'instant.</p>}
              </div>
            </div>
            <div className="mt-5">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#8A94A2]">Pas encore lu ({unread.length})</p>
              <div className="mt-2 space-y-2">
                {unread.map((member) => (
                  <div key={member.userId} className="flex items-center gap-2">
                    <ProfileLink userId={member.userId}>
                      <Avatar alt={member.name ?? "Membre"} src={storageUrl(member.avatarStorageKey)} size="sm" />
                    </ProfileLink>
                    <ProfileLink userId={member.userId} className="text-xs font-bold text-[#293446] hover:underline">
                      {member.name}
                    </ProfileLink>
                  </div>
                ))}
                {unread.length === 0 && <p className="text-[11px] text-[#9AA1AA]">Tout le monde a lu ce message.</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
