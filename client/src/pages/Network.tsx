/** JECI network: gestion réelle des demandes de connexion, branchée sur server/routers/network.ts. */
import { UserPlus2 } from "lucide-react";
import { useEffect } from "react";
import { Check, Clock, UserRound, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, PageIntro, Panel, ProfileLink } from "@/components/UiPrimitives";
import { storageUrl } from "@/lib/storageUrl";
import { trpc } from "@/lib/trpc";

export default function Network() {
  const utils = trpc.useUtils();
  const pendingQuery = trpc.network.pending.useQuery(undefined, { refetchInterval: 10000 });
  const connectionsQuery = trpc.network.list.useQuery();
  const suggestionsQuery = trpc.network.suggestions.useQuery();

  const sendRequest = trpc.network.sendRequest.useMutation({
    onSuccess: () => {
      utils.network.pending.invalidate();
      utils.network.suggestions.invalidate();
      toast.success("Invitation envoyée.");
    },
    onError: (error) => toast.error(error.message),
  });

  // Consulter cette page efface les notifications de demande/acceptation de connexion en attente.
  const markByType = trpc.notifications.markByType.useMutation({
    onSuccess: () => utils.notifications.unreadCount.invalidate(),
  });
  useEffect(() => {
    markByType.mutate({ types: ["connection_request", "connection_accepted"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const respond = trpc.network.respond.useMutation({
    onSuccess: (_data, variables) => {
      utils.network.pending.invalidate();
      utils.network.list.invalidate();
      toast.success(variables.decision === "accepted" ? "Connexion acceptée." : "Demande refusée.");
    },
    onError: (error) => toast.error(error.message),
  });

  const cancel = trpc.network.cancel.useMutation({
    onSuccess: () => {
      utils.network.pending.invalidate();
      toast.success("Invitation annulée.");
    },
    onError: (error) => toast.error(error.message),
  });

  const incoming = pendingQuery.data?.incoming ?? [];
  const outgoing = pendingQuery.data?.outgoing ?? [];
  const connections = connectionsQuery.data ?? [];
  const suggestions = suggestionsQuery.data ?? [];

  return (
    <div>
      <PageIntro eyebrow="Mon réseau" title="Demandes de connexion" description="Examinez les invitations reçues et suivez celles que vous avez envoyées." />

      <section>
        <h2 className="font-editorial text-[28px] font-semibold text-[#10203A]">Demandes reçues {incoming.length > 0 && <span className="ml-1 text-base font-normal text-[#8B661D]">({incoming.length})</span>}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {incoming.map((request) => (
            <Panel key={request.connectionId} className="flex items-center gap-3 p-4">
              <ProfileLink userId={request.otherUserId}>
                <Avatar alt={request.name ?? "Jéciste"} src={storageUrl(request.avatarStorageKey)} />
              </ProfileLink>
              <div className="min-w-0 flex-1">
                <ProfileLink userId={request.otherUserId} className="block truncate text-sm font-bold text-[#18263E] hover:underline">
                  {request.name}
                </ProfileLink>
                {request.headline && <p className="truncate text-[11px] text-[#6D7787]">{request.headline}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => respond.mutate({ requesterId: request.otherUserId, decision: "accepted" })} aria-label="Accepter" className="grid h-9 w-9 place-items-center rounded-full bg-[#142640] text-white transition hover:bg-[#0B1931]">
                  <Check size={16} />
                </button>
                <button onClick={() => respond.mutate({ requesterId: request.otherUserId, decision: "declined" })} aria-label="Refuser" className="grid h-9 w-9 place-items-center rounded-full border border-[#E0DAD0] text-[#6D7787] transition hover:bg-[#F5F1EA]">
                  <X size={16} />
                </button>
              </div>
            </Panel>
          ))}
        </div>
        {incoming.length === 0 && (
          <Panel className="mt-4 p-8 text-center">
            <UserRound className="mx-auto text-[#9BA1A9]" size={26} />
            <p className="mt-2 text-sm text-[#697485]">Aucune demande en attente pour l'instant.</p>
          </Panel>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-editorial text-[28px] font-semibold text-[#10203A]">Invitations envoyées</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {outgoing.map((request) => (
            <Panel key={request.connectionId} className="flex items-center gap-3 p-4">
              <ProfileLink userId={request.otherUserId}>
                <Avatar alt={request.name ?? "Jéciste"} src={storageUrl(request.avatarStorageKey)} />
              </ProfileLink>
              <div className="min-w-0 flex-1">
                <ProfileLink userId={request.otherUserId} className="block truncate text-sm font-bold text-[#18263E] hover:underline">
                  {request.name}
                </ProfileLink>
                <p className="flex items-center gap-1 text-[11px] text-[#8B661D]">
                  <Clock size={12} /> En attente de réponse
                </p>
              </div>
              <button onClick={() => cancel.mutate({ userId: request.otherUserId })} aria-label="Annuler l'invitation" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#E0DAD0] text-[#6D7787] transition hover:bg-[#F5F1EA]">
                <UserX size={16} />
              </button>
            </Panel>
          ))}
        </div>
        {outgoing.length === 0 && <p className="mt-4 text-xs text-[#9A9A98]">Aucune invitation en attente.</p>}
      </section>

      <section className="mt-8">
        <h2 className="font-editorial text-[28px] font-semibold text-[#10203A]">Mes connexions ({connections.length})</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => (
            <Panel key={connection.connectionId} className="flex items-center gap-3 p-4">
              <ProfileLink userId={connection.otherUserId}>
                <Avatar alt={connection.name ?? "Jéciste"} src={storageUrl(connection.avatarStorageKey)} />
              </ProfileLink>
              <div className="min-w-0">
                <ProfileLink userId={connection.otherUserId} className="block truncate text-sm font-bold text-[#18263E] hover:underline">
                  {connection.name}
                </ProfileLink>
                {connection.headline && <p className="truncate text-[11px] text-[#6D7787]">{connection.headline}</p>}
              </div>
            </Panel>
          ))}
        </div>
        {connections.length === 0 && <p className="mt-4 text-xs text-[#9A9A98]">Vous n'avez pas encore de connexion. Retrouvez des Jécistes depuis l'annuaire.</p>}
      </section>

      {/* « Vous connaissez peut-être » (cahier §17, §42) */}
      {suggestions.length > 0 && (
        <section className="mt-8">
          <h2 className="font-editorial text-[28px] font-semibold text-[#10203A]">Vous connaissez peut-être</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((suggestion) => (
              <Panel key={suggestion.userId} className="p-4">
                <div className="flex items-center gap-3">
                  <ProfileLink userId={suggestion.userId}>
                    <Avatar alt={suggestion.name ?? "Jéciste"} src={storageUrl(suggestion.avatarStorageKey)} />
                  </ProfileLink>
                  <div className="min-w-0 flex-1">
                    <ProfileLink userId={suggestion.userId} className="block truncate text-sm font-bold text-[#18263E] hover:underline">
                      {suggestion.name}
                    </ProfileLink>
                    {suggestion.headline && <p className="truncate text-[11px] text-[#6D7787]">{suggestion.headline}</p>}
                  </div>
                </div>
                <p className="mt-2 text-[10px] font-bold text-[#5B4FE0]">{suggestion.reasons.join(" · ")}</p>
                <button
                  onClick={() => sendRequest.mutate({ userId: suggestion.userId })}
                  disabled={sendRequest.isPending}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#142640] py-2 text-[11px] font-extrabold text-[#142640] transition hover:bg-[#142640] hover:text-white disabled:opacity-50"
                >
                  <UserPlus2 size={14} /> Se connecter
                </button>
              </Panel>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
