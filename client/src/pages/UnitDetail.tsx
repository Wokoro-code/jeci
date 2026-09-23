/** JECI — Espace d'une structure organisationnelle : fiche + groupe de discussion officiel, branché sur server/routers/messaging.ts. */
import { useEffect, useState } from "react";
import { ArrowLeft, Paperclip, Send, UsersRound } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { Avatar, Panel, ProfileLink } from "@/components/UiPrimitives";
import { MessageReceiptsModal } from "@/components/MessageReceiptsModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { storageUrl } from "@/lib/storageUrl";
import { uploadFile } from "@/lib/upload";

const levelLabels: Record<string, string> = { international: "International", regional: "Régional", national: "Mouvement national", local: "Structure locale", group: "Groupe / équipe" };

export default function UnitDetail() {
  const { id } = useParams<{ id: string }>();
  const unitId = Number(id);
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const utils = trpc.useUtils();

  const unitQuery = trpc.account.organizationalUnit.useQuery({ unitId }, { enabled: Number.isFinite(unitId) });
  const unit = unitQuery.data;

  const [conversationId, setConversationId] = useState<number | null>(null);
  const [receiptsFor, setReceiptsFor] = useState<number | null>(null);
  const joinChat = trpc.messaging.joinUnitChat.useMutation({
    onSuccess: (data) => setConversationId(data.conversationId),
    onError: (error) => toast.error(error.message),
  });

  const membersQuery = trpc.messaging.conversationMembers.useQuery({ conversationId: conversationId ?? 0 }, { enabled: Boolean(conversationId) });
  const messagesQuery = trpc.messaging.messages.useQuery({ conversationId: conversationId ?? 0 }, { enabled: Boolean(conversationId), refetchInterval: 4000 });
  const markRead = trpc.messaging.markRead.useMutation();

  const [draft, setDraft] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<{ storageKey: string; originalName: string; mimeType: string; sizeBytes: number } | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const sendMessage = trpc.messaging.send.useMutation({
    onSuccess: () => {
      setDraft("");
      setPendingAttachment(null);
      utils.messaging.messages.invalidate({ conversationId: conversationId ?? 0 });
    },
    onError: (error) => toast.error(error.message),
  });

  const handleJoin = () => {
    if (!isVerified) {
      toast.info("Vérifiez votre compte pour rejoindre l'espace de discussion de cette structure.");
      return;
    }
    joinChat.mutate({ unitId });
  };

  const handleAttachmentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingAttachment(true);
    try {
      setPendingAttachment(await uploadFile(file, "message_attachment"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'envoi de la pièce jointe.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!conversationId || (!draft.trim() && !pendingAttachment)) return;
    sendMessage.mutate({ conversationId, body: draft.trim() || undefined, attachments: pendingAttachment ? [pendingAttachment] : undefined });
  };

  const lastMessageId = messagesQuery.data?.at(-1)?.id;
  useEffect(() => {
    if (conversationId && lastMessageId) {
      markRead.mutate({ conversationId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, lastMessageId]);

  if (unitQuery.isLoading) return <p className="text-sm text-[#707787]">Chargement...</p>;

  if (!unit) {
    return (
      <div className="mx-auto max-w-4xl">
        <Link href="/organisation" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#5F6978] hover:text-[#0E1D36]">
          <ArrowLeft size={16} /> Retour à l'organisation
        </Link>
        <Panel className="p-10 text-center">
          <p className="font-editorial text-2xl font-semibold text-[#10213D]">Cette structure n'existe pas.</p>
        </Panel>
      </div>
    );
  }

  const messages = messagesQuery.data ?? [];
  const members = membersQuery.data ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/organisation" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#5F6978] hover:text-[#0E1D36]">
        <ArrowLeft size={16} /> Retour à l'organisation
      </Link>
      <div className="overflow-hidden rounded-2xl border border-[#E1DDD6] bg-white shadow-[0_8px_30px_rgba(10,32,63,0.07)]">
        <div className="bg-[#102846] px-6 py-8 text-white sm:px-9">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#D7E1ED]">{unit.localTypeLabel || levelLabels[unit.level] || unit.level}</p>
          <h1 className="mt-2 font-editorial text-[38px] font-semibold leading-[0.95] tracking-[-0.03em] sm:text-[48px]">{unit.name}</h1>
          {unit.description && <p className="mt-4 max-w-2xl text-sm leading-6 text-[#D8DFE9]">{unit.description}</p>}
          <p className="mt-4 flex items-center gap-2 text-sm text-[#D8DFE9]">
            <UsersRound size={17} />
            Espace vivant de la structure
          </p>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_240px]">
          <section className="flex min-h-[480px] flex-col border-b border-[#E8E3DA] lg:border-b-0 lg:border-r">
            {!conversationId ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <p className="max-w-sm text-sm leading-6 text-[#647085]">Rejoignez le groupe de discussion officiel de cette structure pour échanger avec ses membres.</p>
                <button onClick={handleJoin} disabled={joinChat.isPending} className="rounded-lg bg-black px-5 py-3 text-xs font-extrabold text-white transition hover:bg-[#17233B] disabled:opacity-50">
                  {joinChat.isPending ? "Connexion..." : "Rejoindre la discussion"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto bg-[#FDFBF7] p-5">
                  {messages.length === 0 && <p className="mt-16 text-center text-sm text-[#6C7684]">Soyez le premier à écrire dans ce groupe.</p>}
                  {messages.map((message) => {
                    const isMine = message.senderId === user?.id;
                    return (
                      <button
                        key={message.id}
                        type="button"
                        onClick={() => setReceiptsFor(message.id)}
                        className={`block text-left ${isMine ? "ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-[#152C4C] p-3 text-xs text-white" : "w-fit max-w-[80%] rounded-2xl rounded-bl-sm bg-white p-3 text-xs text-[#3D495B] shadow-sm"}`}
                      >
                        {!isMine && (
                          <ProfileLink userId={message.senderId} className="mb-1 block text-[10px] font-extrabold text-[#8B661D] hover:underline">
                            {members.find((m) => m.userId === message.senderId)?.name ?? "Membre"}
                          </ProfileLink>
                        )}
                        {message.body}
                        {message.attachments?.map((attachment) => (
                          <a key={attachment.id} href={storageUrl(attachment.storageKey)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className={`mt-2 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] font-bold ${isMine ? "border-white/25 text-white" : "border-[#E4E1D9] text-[#3D495B]"}`}>
                            <Paperclip size={13} /> {attachment.originalName}
                          </a>
                        ))}
                      </button>
                    );
                  })}
                </div>
                <form onSubmit={handleSend} className="border-t border-[#E8E3DA] bg-white p-3">
                  {pendingAttachment && <p className="mb-2 rounded-lg bg-[#F1F3F8] px-3 py-2 text-[11px] font-bold text-[#3D495B]">{pendingAttachment.originalName}</p>}
                  <div className="flex items-center gap-2">
                    <label className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full text-[#536174] hover:bg-[#F1F3F8]">
                      <Paperclip size={19} />
                      <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={handleAttachmentChange} disabled={uploadingAttachment} />
                    </label>
                    <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Écrire au groupe…" className="h-10 min-w-0 flex-1 rounded-full border border-[#D9D5CE] bg-[#FDFBF7] px-4 text-xs outline-none" />
                    <button disabled={sendMessage.isPending} className="grid h-10 w-10 place-items-center rounded-full bg-black text-white disabled:opacity-50">
                      <Send size={17} />
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
          <aside className="p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#3B32A0]">Membres du groupe ({members.length})</p>
            <div className="mt-3 space-y-3">
              {members.map((member) => (
                <div key={member.userId} className="flex items-center gap-2">
                  <ProfileLink userId={member.userId}>
                    <Avatar alt={member.name ?? "Membre"} src={storageUrl(member.avatarStorageKey)} size="sm" />
                  </ProfileLink>
                  <ProfileLink userId={member.userId} className="truncate text-xs font-bold text-[#293446] hover:underline">
                    {member.name}
                  </ProfileLink>
                </div>
              ))}
              {members.length === 0 && <p className="text-[11px] text-[#9AA1AA]">Rejoignez la discussion pour voir les membres.</p>}
            </div>
          </aside>
        </div>
      </div>
      {receiptsFor && conversationId && <MessageReceiptsModal conversationId={conversationId} messageId={receiptsFor} onClose={() => setReceiptsFor(null)} />}
    </div>
  );
}
