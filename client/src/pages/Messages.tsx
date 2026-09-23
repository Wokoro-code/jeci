/** JECI messages: messagerie réelle, branchée sur server/routers/messaging.ts. */
import { Check, CheckCheck, Paperclip, Plus, Search, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, PageIntro, Panel, ProfileLink } from "@/components/UiPrimitives";
import { storageUrl } from "@/lib/storageUrl";
import { uploadFile } from "@/lib/upload";
import { MobileDetailScreen } from "@/components/MobileDetailScreen";
import { MobileQueryBar } from "@/components/MobileQueryControls";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

function formatTime(date: string | Date) {
  return new Date(date).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function Messages() {
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const utils = trpc.useUtils();

  const [term, setTerm] = useState("");
  const [contactTerm, setContactTerm] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [picker, setPicker] = useState(false);
  const [desktopPicker, setDesktopPicker] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);

  const conversationsQuery = trpc.messaging.conversations.useQuery(undefined, { refetchInterval: 8000 });
  const connectionsQuery = trpc.network.list.useQuery();

  const rows = useMemo(() => {
    const list = conversationsQuery.data ?? [];
    if (!term) return list;
    return list.filter((row) => `${row.other?.name ?? ""}`.toLowerCase().includes(term.toLowerCase()));
  }, [conversationsQuery.data, term]);

  const contacts = useMemo(() => {
    const list = connectionsQuery.data ?? [];
    if (!contactTerm) return list;
    return list.filter((connection) => `${connection.name ?? ""} ${connection.headline ?? ""}`.toLowerCase().includes(contactTerm.toLowerCase()));
  }, [connectionsQuery.data, contactTerm]);

  const activeConversationId = selectedConversationId ?? rows[0]?.conversation.id ?? null;
  const activeRow = rows.find((row) => row.conversation.id === activeConversationId) ?? rows[0];

  const startConversation = trpc.messaging.startConversation.useMutation({
    onSuccess: (data) => {
      setSelectedConversationId(data.conversationId);
      utils.messaging.conversations.invalidate();
      setPicker(false);
      setDesktopPicker(false);
      if (window.innerWidth < 1024) setMobileChat(true);
    },
    onError: (error) => toast.error(error.message),
  });

  const newMessage = () => {
    if (!isVerified) {
      toast.info("Vérifiez votre compte pour démarrer une conversation.");
      return;
    }
    setContactTerm("");
    window.innerWidth < 1024 ? setPicker(true) : setDesktopPicker(true);
  };

  const chooseExisting = (id: number) => {
    setSelectedConversationId(id);
    if (window.innerWidth < 1024) setMobileChat(true);
  };

  return (
    <div>
      <PageIntro eyebrow="Messagerie" title="Vos conversations" description="Des échanges directs avec vos connexions du réseau, réservés aux comptes vérifiés." />
      <button onClick={newMessage} className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#10294D] px-4 py-3 text-xs font-extrabold text-white lg:hidden">
        <Plus size={17} /> Nouveau message
      </button>
      <MobileQueryBar value={term} onChange={setTerm} placeholder="Rechercher une conversation…" />
      <Panel className="grid min-h-[570px] overflow-hidden lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-[#E8E3DA] bg-[#FCFBF8] lg:border-b-0 lg:border-r">
          <div className="hidden p-4 lg:block">
            <div className="mb-3 flex items-center justify-between">
              <b className="text-[11px] uppercase tracking-[.13em] text-[#897331]">Conversations</b>
              <button onClick={newMessage} className="inline-flex items-center gap-1.5 rounded-full bg-[#10294D] px-3 py-1.5 text-[10px] font-extrabold text-white">
                <Plus size={14} /> Nouveau
              </button>
            </div>
            <label className="relative block">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78808A]" />
              <input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Rechercher une conversation" className="h-10 w-full rounded-lg border border-[#DDD8D0] bg-white pl-9 pr-3 text-xs outline-none" />
            </label>
          </div>
          {rows.length === 0 && <p className="p-4 text-xs text-[#8A9099]">Aucune conversation pour l'instant.</p>}
          {rows.map((row) => (
            <button key={row.conversation.id} onClick={() => chooseExisting(row.conversation.id)} className={`flex w-full gap-3 px-4 py-3 text-left ${activeConversationId === row.conversation.id ? "bg-[#F0E7D3]" : "hover:bg-[#F7F3ED]"}`}>
              <ProfileLink userId={row.other?.userId}>
                <Avatar alt={row.other?.name ?? "Jéciste"} src={storageUrl(row.other?.avatarStorageKey)} size="sm" />
              </ProfileLink>
              <span className="min-w-0 flex-1">
                <span className="flex justify-between">
                  <b className="truncate text-xs text-[#19253B]">{row.other?.name ?? "Jéciste"}</b>
                  {row.lastMessage && <small className="text-[10px] text-[#8A9099]">{formatTime(row.lastMessage.sentAt)}</small>}
                </span>
                <span className="mt-1 block truncate text-[11px] text-[#727B87]">{row.lastMessage?.body ?? "Nouvelle conversation"}</span>
              </span>
              {row.unreadCount > 0 && <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-[#A5232A] px-1 text-[9px] font-extrabold text-white">{row.unreadCount}</span>}
            </button>
          ))}
        </aside>
        <Chat conversationId={activeRow?.conversation.id ?? null} otherName={activeRow?.other?.name ?? null} otherUserId={activeRow?.other?.userId ?? null} className="hidden lg:flex" />
      </Panel>

      {desktopPicker ? (
        <div className="fixed inset-0 z-[80] hidden items-center justify-center bg-[#091830]/35 p-6 backdrop-blur-sm lg:flex" onClick={() => setDesktopPicker(false)}>
          <section onClick={(event) => event.stopPropagation()} className="w-full max-w-xl rounded-2xl bg-[#FDFBF7] shadow-2xl">
            <Picker contacts={contacts} term={contactTerm} setTerm={setContactTerm} choose={(id: number) => startConversation.mutate({ userId: id })} close={() => setDesktopPicker(false)} />
          </section>
        </div>
      ) : null}
      {picker ? (
        <MobileDetailScreen title="Nouveau message" subtitle="Choisissez une connexion de votre réseau" onBack={() => setPicker(false)}>
          <Picker contacts={contacts} term={contactTerm} setTerm={setContactTerm} choose={(id: number) => startConversation.mutate({ userId: id })} />
        </MobileDetailScreen>
      ) : null}
      {mobileChat && activeRow ? (
        <MobileDetailScreen title={activeRow.other?.name ?? "Conversation"} subtitle="Conversation" onBack={() => setMobileChat(false)} headerRight={<Avatar alt={activeRow.other?.name ?? "Jéciste"} src={storageUrl(activeRow.other?.avatarStorageKey)} size="sm" />}>
          <Chat conversationId={activeRow.conversation.id} otherName={activeRow.other?.name ?? null} otherUserId={activeRow.other?.userId ?? null} className="flex" />
        </MobileDetailScreen>
      ) : null}
    </div>
  );
}

function Picker({ contacts, term, setTerm, choose, close }: { contacts: Array<{ otherUserId: number; name: string | null; headline?: string | null; avatarStorageKey?: string | null }>; term: string; setTerm: (value: string) => void; choose: (id: number) => void; close?: () => void }) {
  return (
    <div className="p-5">
      <div className="flex justify-between">
        <div>
          <h2 className="font-editorial text-[29px] font-semibold text-[#10213A]">Nouveau message</h2>
          <p className="text-xs text-[#728093]">Vos connexions acceptées uniquement.</p>
        </div>
        {close ? (
          <button onClick={close} className="rounded-full p-2">
            <X size={19} />
          </button>
        ) : null}
      </div>
      <label className="relative mt-5 block">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#758093]" />
        <input autoFocus value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Rechercher une connexion…" className="h-11 w-full rounded-xl border border-[#D8DEDF] bg-white pl-10 pr-3 text-sm outline-none" />
      </label>
      <div className="mt-4 overflow-hidden rounded-xl border border-[#E3E0DA] bg-white">
        {contacts.length === 0 && <p className="p-4 text-xs text-[#728093]">Aucune connexion trouvée. Connectez-vous à des Jécistes depuis l'annuaire.</p>}
        {contacts.map((contact) => (
          <button key={contact.otherUserId} onClick={() => choose(contact.otherUserId)} className="flex w-full items-center gap-3 border-b border-[#ECE8E1] px-4 py-3.5 text-left last:border-0 hover:bg-[#FFF9ED]">
            <ProfileLink userId={contact.otherUserId}>
              <Avatar alt={contact.name ?? "Jéciste"} src={storageUrl(contact.avatarStorageKey)} size="sm" />
            </ProfileLink>
            <span className="flex-1">
              <b className="block text-sm text-[#18263E]">{contact.name}</b>
              {contact.headline && <small className="text-[11px] text-[#6D7787]">{contact.headline}</small>}
            </span>
            <b className="text-[11px] text-[#956B1B]">Écrire</b>
          </button>
        ))}
      </div>
    </div>
  );
}

function Chat({ conversationId, otherName, otherUserId, className }: { conversationId: number | null; otherName: string | null; otherUserId: number | null; className: string }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const messagesQuery = trpc.messaging.messages.useQuery({ conversationId: conversationId ?? 0 }, { enabled: Boolean(conversationId), refetchInterval: 4000 });
  const markRead = trpc.messaging.markRead.useMutation();
  const [draft, setDraft] = useState("");

  const sendMessage = trpc.messaging.send.useMutation({
    onSuccess: () => {
      setDraft("");
      utils.messaging.messages.invalidate({ conversationId: conversationId ?? 0 });
      utils.messaging.conversations.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const [pendingAttachment, setPendingAttachment] = useState<{ storageKey: string; originalName: string; mimeType: string; sizeBytes: number } | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const handleAttachmentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingAttachment(true);
    try {
      const result = await uploadFile(file, "message_attachment");
      setPendingAttachment(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'envoi de la pièce jointe.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const lastMessageId = messagesQuery.data?.at(-1)?.id;
  useEffect(() => {
    if (conversationId && lastMessageId) {
      markRead.mutate({ conversationId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, lastMessageId]);

  if (!conversationId) {
    return (
      <section className={`${className} min-h-[400px] flex-col items-center justify-center p-6 text-center text-sm text-[#6C7684]`}>
        Choisissez une conversation ou démarrez-en une nouvelle depuis vos connexions.
      </section>
    );
  }

  const messages = messagesQuery.data ?? [];
  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim() && !pendingAttachment) return;
    sendMessage.mutate({ conversationId, body: draft.trim() || undefined, attachments: pendingAttachment ? [pendingAttachment] : undefined });
    setPendingAttachment(null);
  };

  return (
    <section className={`${className} min-h-[400px] flex-col`}>
      <header className="hidden items-center gap-3 border-b border-[#E8E3DA] px-5 py-3 lg:flex">
        <ProfileLink userId={otherUserId}>
          <Avatar alt={otherName ?? "Jéciste"} size="sm" />
        </ProfileLink>
        <div>
          <ProfileLink userId={otherUserId} className="block text-sm font-bold text-[#142039] hover:underline">
            {otherName ?? "Conversation"}
          </ProfileLink>
        </div>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#FDFBF7] p-5">
        {messages.length === 0 && <p className="mt-16 text-center text-sm text-[#6C7684]">Commencez la conversation avec {otherName?.split(" ")[0] ?? "cette personne"}.</p>}
        {messages.map((message) => {
          const isMine = message.senderId === user?.id;
          return (
            <div key={message.id} className={isMine ? "ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-[#152C4C] p-3 text-xs text-white" : "w-fit max-w-[80%] rounded-2xl rounded-bl-sm bg-white p-3 text-xs text-[#3D495B] shadow-sm"}>
              {message.body}
              {message.attachments?.map((attachment) => (
                <a key={attachment.id} href={storageUrl(attachment.storageKey)} target="_blank" rel="noreferrer" className={`mt-2 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] font-bold ${isMine ? "border-white/25 text-white" : "border-[#E4E1D9] text-[#3D495B]"}`}>
                  <Paperclip size={13} /> {attachment.originalName}
                </a>
              ))}
              {isMine && (
                <span className={`mt-1 flex items-center justify-end gap-1 ${message.deliveryStatus === "read" ? "text-[#5AC8FA]" : "text-white/55"}`} title={message.deliveryStatus === "read" ? "Lu" : message.deliveryStatus === "delivered" ? "Reçu" : "Envoyé"}>
                  {message.deliveryStatus === "delivered" || message.deliveryStatus === "read" ? <CheckCheck size={14} /> : <Check size={14} />}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSend} className="border-t border-[#E8E3DA] bg-white p-3">
        {pendingAttachment && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#F1F3F8] px-3 py-2 text-[11px] font-bold text-[#3D495B]">
            <Paperclip size={13} /> {pendingAttachment.originalName}
            <button type="button" onClick={() => setPendingAttachment(null)} className="ml-auto text-[#8A9099]">
              <X size={14} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full text-[#536174] hover:bg-[#F1F3F8]">
            <Paperclip size={19} />
            <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={handleAttachmentChange} disabled={uploadingAttachment} />
          </label>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Écrire un message…" className="h-10 min-w-0 flex-1 rounded-full border border-[#D9D5CE] bg-[#FDFBF7] px-4 text-xs outline-none" />
          <button disabled={sendMessage.isPending || uploadingAttachment} className="grid h-10 w-10 place-items-center rounded-full bg-black text-white disabled:opacity-50">
            <Send size={17} />
          </button>
        </div>
      </form>
    </section>
  );
}
