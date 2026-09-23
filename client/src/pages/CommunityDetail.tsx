/** JECI — Fiche communauté complète (cahier §15) : membres (adhésion validée par un admin), publications, événements, projets, documents, discussion. */
import { useState } from "react";
import { ArrowLeft, Check, FileText, MessageSquare, Paperclip, Send, Upload, UserCheck, Users2, X } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { Avatar, JecStatusBadge, Panel, ProfileLink } from "@/components/UiPrimitives";
import { MessageReceiptsModal } from "@/components/MessageReceiptsModal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { storageUrl } from "@/lib/storageUrl";
import { uploadFile } from "@/lib/upload";
import { CreateEventModal } from "@/pages/Events";
import { CreateProjectModal } from "@/pages/Projects";

const scopeLabels: Record<string, string> = { international: "Internationale", regional: "Régionale", national: "Nationale", professional: "Professionnelle", thematic: "Thématique" };
type Tab = "feed" | "events" | "projects" | "documents" | "chat" | "members";
const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "feed", label: "Publications", icon: <MessageSquare size={14} /> },
  { id: "events", label: "Événements", icon: <Users2 size={14} /> },
  { id: "projects", label: "Projets", icon: <FileText size={14} /> },
  { id: "documents", label: "Documents", icon: <Upload size={14} /> },
  { id: "chat", label: "Discussion", icon: <Send size={14} /> },
  { id: "members", label: "Membres", icon: <UserCheck size={14} /> },
];

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const communityId = Number(id);
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const utils = trpc.useUtils();
  const [tab, setTab] = useState<Tab>("feed");

  const communityQuery = trpc.communities.get.useQuery({ communityId }, { enabled: Number.isFinite(communityId) });
  const community = communityQuery.data;

  const requestToJoin = trpc.communities.requestToJoin.useMutation({
    onSuccess: () => {
      utils.communities.get.invalidate({ communityId });
      toast.success("Demande envoyée. Un administrateur de la communauté doit la valider.");
    },
    onError: (error) => toast.error(error.message),
  });
  const leaveCommunity = trpc.communities.leave.useMutation({
    onSuccess: () => utils.communities.get.invalidate({ communityId }),
    onError: (error) => toast.error(error.message),
  });
  const decideMembership = trpc.communities.decideMembership.useMutation({
    onSuccess: () => {
      utils.communities.get.invalidate({ communityId });
      toast.success("Demande traitée.");
    },
    onError: (error) => toast.error(error.message),
  });

  if (communityQuery.isLoading) return <p className="text-sm text-[#707787]">Chargement...</p>;

  if (!community) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link href="/communautes" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#5F6978] hover:text-[#0E1D36]">
          <ArrowLeft size={16} /> Retour aux communautés
        </Link>
        <Panel className="p-10 text-center">
          <p className="font-editorial text-2xl font-semibold text-[#10213D]">Cette communauté n'existe pas.</p>
        </Panel>
      </div>
    );
  }

  const isApprovedMember = community.viewerStatus === "approved";
  const isAdmin = community.viewerRole === "admin";

  const handleJoin = () => {
    if (!isVerified) {
      toast.info("Vérifiez votre compte pour rejoindre une communauté.");
      return;
    }
    requestToJoin.mutate({ communityId });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/communautes" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#5F6978] hover:text-[#0E1D36]">
        <ArrowLeft size={16} /> Retour aux communautés
      </Link>
      <div className="overflow-hidden rounded-2xl border border-[#E1DDD6] bg-white shadow-[0_8px_30px_rgba(10,32,63,0.07)]">
        <div className="bg-[#102846] px-6 py-8 text-white sm:px-9" style={community.imageStorageKey ? { backgroundImage: `linear-gradient(rgba(16,40,70,0.82), rgba(16,40,70,0.9)), url(${storageUrl(community.imageStorageKey)})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#D7E1ED]">Communauté {scopeLabels[community.scope]}</p>
          <h1 className="mt-2 font-editorial text-[38px] font-semibold leading-[0.95] tracking-[-0.03em] sm:text-[48px]">{community.name}</h1>
          {community.description && <p className="mt-4 max-w-2xl text-sm leading-6 text-[#D8DFE9]">{community.description}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 text-sm text-[#D8DFE9]">
              <Users2 size={17} />
              {community.members.length} membre{community.members.length > 1 ? "s" : ""}
            </span>
            {isApprovedMember ? (
              <button onClick={() => leaveCommunity.mutate({ communityId })} disabled={leaveCommunity.isPending} className="rounded-full border border-white/30 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-50">
                Quitter la communauté
              </button>
            ) : community.viewerStatus === "pending" ? (
              <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white">Demande en attente de validation</span>
            ) : (
              <button onClick={handleJoin} disabled={requestToJoin.isPending} className="rounded-full bg-[#E3E0FA] px-4 py-2 text-xs font-extrabold text-[#2A2270] transition hover:bg-[#6C5CE0] disabled:opacity-50">
                {requestToJoin.isPending ? "…" : "Demander à rejoindre"}
              </button>
            )}
          </div>
        </div>

        {isAdmin && community.pendingRequests.length > 0 && (
          <div className="border-b border-[#EEEAE3] bg-[#FBF6EC] px-6 py-4 sm:px-9">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8B6914]">Demandes d'adhésion en attente ({community.pendingRequests.length})</p>
            <div className="mt-3 space-y-2">
              {community.pendingRequests.map((request) => (
                <div key={request.userId} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                  <div className="flex items-center gap-2">
                    <ProfileLink userId={request.userId}>
                      <Avatar alt={request.name ?? "Membre"} src={storageUrl(request.avatarStorageKey)} size="sm" />
                    </ProfileLink>
                    <ProfileLink userId={request.userId} className="text-xs font-bold text-[#293446] hover:underline">
                      {request.name}
                    </ProfileLink>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => decideMembership.mutate({ communityId, userId: request.userId, decision: "approved" })} className="grid h-7 w-7 place-items-center rounded-full bg-[#DFF3EA] text-[#1F6A54] hover:bg-[#C9EADA]" aria-label="Valider">
                      <Check size={14} />
                    </button>
                    <button onClick={() => decideMembership.mutate({ communityId, userId: request.userId, decision: "rejected" })} className="grid h-7 w-7 place-items-center rounded-full bg-[#F9E9E7] text-[#9B2226] hover:bg-[#F3D6D3]" aria-label="Refuser">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-1 overflow-x-auto border-b border-[#EEEAE3] px-4 sm:px-8">
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-bold transition ${tab === item.id ? "border-[#152C4C] text-[#152C4C]" : "border-transparent text-[#8A94A2] hover:text-[#293446]"}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-8">
          {tab === "feed" && <CommunityFeedTab communityId={communityId} canPost={isApprovedMember} />}
          {tab === "events" && <CommunityEventsTab communityId={communityId} canCreate={isApprovedMember} />}
          {tab === "projects" && <CommunityProjectsTab communityId={communityId} canCreate={isApprovedMember} />}
          {tab === "documents" && <CommunityDocumentsTab communityId={communityId} canUpload={isApprovedMember} />}
          {tab === "chat" && <CommunityChatTab communityId={communityId} canJoin={isApprovedMember} />}
          {tab === "members" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {community.members.map((member) => (
                <div key={member.userId} className="flex items-center gap-2.5 rounded-lg border border-[#EEEAE3] p-2.5">
                  <ProfileLink userId={member.userId}>
                    <Avatar alt={member.name ?? "Membre"} src={storageUrl(member.avatarStorageKey)} size="sm" />
                  </ProfileLink>
                  <div className="min-w-0">
                    <ProfileLink userId={member.userId} className="block truncate text-xs font-bold text-[#293446] hover:underline">
                      {member.name}
                    </ProfileLink>
                    {member.role === "admin" && <span className="text-[10px] font-bold text-[#3B32A0]">Administrateur</span>}
                  </div>
                </div>
              ))}
              {community.members.length === 0 && <p className="text-[11px] text-[#9AA1AA]">Aucun membre pour l'instant.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-8 text-center text-xs text-[#9AA1AA]">{text}</p>;
}

function CommunityFeedTab({ communityId, canPost }: { communityId: number; canPost: boolean }) {
  const utils = trpc.useUtils();
  const [body, setBody] = useState("");
  const feedQuery = trpc.feed.list.useQuery({ communityId });
  const createPost = trpc.feed.create.useMutation({
    onSuccess: () => {
      setBody("");
      utils.feed.list.invalidate({ communityId });
    },
    onError: (error) => toast.error(error.message),
  });

  const posts = feedQuery.data?.items ?? [];

  return (
    <div>
      {canPost && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!body.trim()) return;
            createPost.mutate({ body: body.trim(), communityId });
          }}
          className="mb-5 flex gap-2"
        >
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Partager quelque chose avec la communauté…" rows={2} className="flex-1" />
          <Button type="submit" disabled={createPost.isPending || !body.trim()}>
            Publier
          </Button>
        </form>
      )}
      <div className="space-y-3">
        {posts.map((post) => (
          <Panel key={post.id} className="p-4">
            <p className="text-xs font-bold text-[#293446]">{post.authorName}</p>
            <p className="mt-1.5 text-sm leading-6 text-[#485568]">{post.body}</p>
          </Panel>
        ))}
      </div>
      {!feedQuery.isLoading && posts.length === 0 && <EmptyState text="Aucune publication dans cette communauté pour l'instant." />}
    </div>
  );
}

function CommunityEventsTab({ communityId, canCreate }: { communityId: number; canCreate: boolean }) {
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const eventsQuery = trpc.events.listPublished.useQuery({ communityId });
  const createEvent = trpc.events.create.useMutation({
    onSuccess: () => {
      utils.events.listPublished.invalidate({ communityId });
      toast.success("Événement soumis, en attente de validation par l'administration.");
      setShowCreate(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const events = eventsQuery.data ?? [];

  return (
    <div>
      {canCreate && (
        <button onClick={() => setShowCreate(true)} className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#D9D5CE] px-3 py-1.5 text-[11px] font-bold text-[#142039] hover:bg-[#F5F0E7]">
          Proposer un événement
        </button>
      )}
      <div className="space-y-3">
        {events.map((event) => (
          <Panel key={event.id} className="p-4">
            <p className="text-xs font-bold text-[#293446]">{event.title}</p>
            <p className="mt-1 text-[11px] text-[#78808B]">{new Date(event.startsAt).toLocaleString("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
            <p className="mt-2 text-sm leading-6 text-[#596575]">{event.description}</p>
          </Panel>
        ))}
      </div>
      {!eventsQuery.isLoading && events.length === 0 && <EmptyState text="Aucun événement publié pour cette communauté." />}
      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} isPending={createEvent.isPending} onSubmit={(input) => createEvent.mutate({ ...input, communityId })} />}
    </div>
  );
}

function CommunityProjectsTab({ communityId, canCreate }: { communityId: number; canCreate: boolean }) {
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const projectsQuery = trpc.projects.list.useQuery({ communityId });
  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate({ communityId });
      toast.success("Projet créé.");
      setShowCreate(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const projects = projectsQuery.data ?? [];

  return (
    <div>
      {canCreate && (
        <button onClick={() => setShowCreate(true)} className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#D9D5CE] px-3 py-1.5 text-[11px] font-bold text-[#142039] hover:bg-[#F5F0E7]">
          Proposer un projet
        </button>
      )}
      <div className="space-y-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/projets/${project.id}`}>
            <Panel className="cursor-pointer p-4 transition hover:-translate-y-0.5">
              <p className="text-xs font-bold text-[#293446]">{project.name}</p>
              {project.description && <p className="mt-1.5 text-sm leading-6 text-[#596575]">{project.description}</p>}
            </Panel>
          </Link>
        ))}
      </div>
      {!projectsQuery.isLoading && projects.length === 0 && <EmptyState text="Aucun projet rattaché à cette communauté." />}
      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} isPending={createProject.isPending} onSubmit={(input) => createProject.mutate({ ...input, communityId })} />}
    </div>
  );
}

function CommunityDocumentsTab({ communityId, canUpload }: { communityId: number; canUpload: boolean }) {
  const utils = trpc.useUtils();
  const [uploading, setUploading] = useState(false);
  const documentsQuery = trpc.communities.documents.useQuery({ communityId });
  const addDocument = trpc.communities.addDocument.useMutation({
    onSuccess: () => utils.communities.documents.invalidate({ communityId }),
    onError: (error) => toast.error(error.message),
  });

  const documents = documentsQuery.data ?? [];

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFile(file, "community_document");
      addDocument.mutate({ communityId, title: file.name, storageKey: result.storageKey, mimeType: result.mimeType });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'envoi du document.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {canUpload && (
        <label className="mb-4 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#D9D5CE] px-3 py-1.5 text-[11px] font-bold text-[#142039] hover:bg-[#F5F0E7]">
          <Upload size={13} /> {uploading ? "Envoi..." : "Déposer un document"}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" />
        </label>
      )}
      <div className="space-y-2">
        {documents.map((document) => (
          <a key={document.id} href={storageUrl(document.storageKey)} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-lg border border-[#EEEAE3] p-3 text-xs font-bold text-[#293446] hover:bg-[#FBF9F5]">
            <Paperclip size={14} className="text-[#3B32A0]" /> {document.title}
            <span className="ml-auto text-[10px] font-normal text-[#9AA1AA]">{document.uploaderName}</span>
          </a>
        ))}
      </div>
      {!documentsQuery.isLoading && documents.length === 0 && <EmptyState text="Aucun document partagé pour l'instant." />}
    </div>
  );
}

function CommunityChatTab({ communityId, canJoin }: { communityId: number; canJoin: boolean }) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [receiptsFor, setReceiptsFor] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const joinChat = trpc.communities.joinChat.useMutation({
    onSuccess: (data) => setConversationId(data.conversationId),
    onError: (error) => toast.error(error.message),
  });
  const membersQuery = trpc.messaging.conversationMembers.useQuery({ conversationId: conversationId ?? 0 }, { enabled: Boolean(conversationId) });
  const messagesQuery = trpc.messaging.messages.useQuery({ conversationId: conversationId ?? 0 }, { enabled: Boolean(conversationId), refetchInterval: 4000 });
  const sendMessage = trpc.messaging.send.useMutation({
    onSuccess: () => {
      setDraft("");
      utils.messaging.messages.invalidate({ conversationId: conversationId ?? 0 });
    },
    onError: (error) => toast.error(error.message),
  });

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="max-w-sm text-sm text-[#647085]">Rejoignez le fil de discussion officiel de cette communauté.</p>
        <button
          onClick={() => (canJoin ? joinChat.mutate({ communityId }) : toast.info("Rejoignez d'abord la communauté."))}
          disabled={joinChat.isPending}
          className="rounded-lg bg-black px-5 py-3 text-xs font-extrabold text-white hover:bg-[#17233B] disabled:opacity-50"
        >
          {joinChat.isPending ? "Connexion..." : "Ouvrir la discussion"}
        </button>
      </div>
    );
  }

  const messages = messagesQuery.data ?? [];
  const members = membersQuery.data ?? [];

  return (
    <div>
      <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg bg-[#FDFBF7] p-3">
        {messages.map((message) => {
          const isMine = message.senderId === user?.id;
          return (
            <button
              key={message.id}
              type="button"
              onClick={() => setReceiptsFor(message.id)}
              className={`block text-left ${isMine ? "ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-[#152C4C] p-2.5 text-xs text-white" : "w-fit max-w-[80%] rounded-2xl rounded-bl-sm bg-white p-2.5 text-xs text-[#3D495B] shadow-sm"}`}
            >
              {!isMine && (
                <ProfileLink userId={message.senderId} className="mb-1 block text-[10px] font-extrabold text-[#8B661D] hover:underline">
                  {members.find((m) => m.userId === message.senderId)?.name ?? "Membre"}
                </ProfileLink>
              )}
              {message.body}
            </button>
          );
        })}
        {messages.length === 0 && <p className="py-6 text-center text-xs text-[#9AA1AA]">Soyez le premier à écrire ici.</p>}
      </div>
      {receiptsFor && <MessageReceiptsModal conversationId={conversationId} messageId={receiptsFor} onClose={() => setReceiptsFor(null)} />}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          sendMessage.mutate({ conversationId, body: draft.trim() });
        }}
        className="mt-3 flex gap-2"
      >
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Écrire à la communauté…" className="h-10 min-w-0 flex-1 rounded-full border border-[#D9D5CE] bg-white px-4 text-xs outline-none" />
        <button disabled={sendMessage.isPending} className="grid h-10 w-10 place-items-center rounded-full bg-black text-white disabled:opacity-50">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
