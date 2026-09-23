/** JECI home: fil de publications réel, branché sur server/routers/feed.ts. */
import { useState } from "react";
import { CalendarDays, Image as ImageIcon, UserPlus, Video, X } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, EventDate, Panel } from "@/components/UiPrimitives";
import { PostCard } from "@/components/PostCard";
import { trpc } from "@/lib/trpc";
import { storageUrl } from "@/lib/storageUrl";
import { uploadFile } from "@/lib/upload";

function initialsFrom(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Home() {
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const utils = trpc.useUtils();

  const feedQuery = trpc.feed.list.useQuery({});
  const directoryQuery = trpc.account.directory.useQuery({ limit: 3 });
  const eventsQuery = trpc.events.listPublished.useQuery();
  const overviewQuery = trpc.account.overview.useQuery();

  const [draft, setDraft] = useState("");
  const [pendingMedia, setPendingMedia] = useState<{ storageKey: string; mimeType: string } | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const createPost = trpc.feed.create.useMutation({
    onSuccess: () => {
      setDraft("");
      setPendingMedia(null);
      utils.feed.list.invalidate();
      toast.success("Publication partagée avec le réseau.");
    },
    onError: (error) => toast.error(error.message),
  });

  const sendRequest = trpc.network.sendRequest.useMutation({
    onSuccess: () => {
      utils.account.directory.invalidate();
      toast.success("Invitation envoyée.");
    },
    onError: (error) => toast.error(error.message),
  });

  const handlePublish = () => {
    if (!isVerified) {
      toast.info("Votre compte doit être vérifié pour publier sur le réseau.");
      return;
    }
    if (!draft.trim() && !pendingMedia) return;
    createPost.mutate({ body: draft.trim() || " ", attachmentStorageKey: pendingMedia?.storageKey, attachmentMimeType: pendingMedia?.mimeType });
  };

  const handleMediaChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingMedia(true);
    try {
      const result = await uploadFile(file, "post_media");
      setPendingMedia({ storageKey: result.storageKey, mimeType: result.mimeType });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'envoi du média.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const posts = feedQuery.data?.items ?? [];
  const suggestions = directoryQuery.data?.items ?? [];
  const upcomingEvents = eventsQuery.data?.slice(0, 2) ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_275px]">
      <section className="space-y-5">
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE5D6] bg-[#FCF8EF] px-4 py-2.5 sm:px-5">
            <span className="font-editorial text-[18px] font-semibold text-[#142640]">La table du réseau</span>
            {!isVerified && <span className="rounded-full border border-[#F0A366] bg-[#FBE0C8] px-2.5 py-1 text-[10px] font-extrabold text-[#8A3F10]">Vérification requise pour publier</span>}
          </div>
          <div className="p-4 sm:p-5">
            <div className="flex gap-3">
              <Avatar alt={user?.name ?? "Vous"} src={storageUrl(overviewQuery.data?.profile?.avatarStorageKey)} />
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={!isVerified}
                placeholder={isVerified ? `À quoi pensez-vous, ${user?.name?.split(" ")[0] ?? ""} ?` : "Vérifiez votre compte pour publier sur le réseau."}
                className="h-11 flex-1 resize-none rounded-2xl border border-[#E4E5EA] bg-[#F1F3F8] px-4 py-2.5 text-left text-sm text-[#19243A] placeholder:text-[#707787] transition focus:outline-none focus:ring-2 focus:ring-[#142640]/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            {pendingMedia && (
              <div className="relative mt-3 overflow-hidden rounded-xl border border-[#E4E5EA]">
                {pendingMedia.mimeType.startsWith("video/") ? <video src={storageUrl(pendingMedia.storageKey)} controls className="max-h-72 w-full bg-black" /> : <img src={storageUrl(pendingMedia.storageKey)} alt="Aperçu du média" className="max-h-72 w-full object-cover" />}
                <button onClick={() => setPendingMedia(null)} aria-label="Retirer le média" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70">
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between">
              <label className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition ${isVerified ? "cursor-pointer text-[#536174] hover:bg-[#F1F3F8]" : "cursor-not-allowed text-[#B9BFC7]"}`}>
                <ImageIcon size={17} />
                <Video size={17} />
                {uploadingMedia ? "Envoi..." : "Photo / vidéo"}
                <input type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime" className="hidden" disabled={!isVerified || uploadingMedia} onChange={handleMediaChange} />
              </label>
              <button
                onClick={handlePublish}
                disabled={!isVerified || (!draft.trim() && !pendingMedia) || createPost.isPending}
                className="rounded-full bg-[#142640] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0B1931] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createPost.isPending ? "Publication..." : "Publier"}
              </button>
            </div>
          </div>
        </Panel>

        {feedQuery.isLoading && <Panel className="p-6 text-center text-sm text-[#707787]">Chargement du fil...</Panel>}
        {!feedQuery.isLoading && posts.length === 0 && <Panel className="p-6 text-center text-sm text-[#707787]">Aucune publication pour le moment. Soyez le premier à partager une nouvelle avec le réseau.</Panel>}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} isVerified={isVerified} />
        ))}
      </section>

      <aside className="space-y-5 xl:sticky xl:top-24 xl:h-fit">
        <Panel className="overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-[25px] font-semibold tracking-[-0.025em] text-[#0B1931]">Suggestions pour vous</h2>
          </div>
          <div className="mt-4 space-y-4">
            {suggestions.map((person) => (
              <div key={person.userId} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar alt={person.name ?? initialsFrom(person.name)} src={storageUrl(person.avatarStorageKey)} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#162033]">{person.name}</p>
                    <p className="truncate text-[11px] text-[#717784]">{person.headline ?? person.organization ?? "JECI"}</p>
                  </div>
                </div>
                <button
                  onClick={() => (isVerified ? sendRequest.mutate({ userId: person.userId }) : toast.info("Vérifiez votre compte pour envoyer des invitations."))}
                  aria-label={`Ajouter ${person.name}`}
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#18243A] text-[#18243A] transition hover:bg-[#18243A] hover:text-white"
                >
                  <UserPlus size={16} />
                </button>
              </div>
            ))}
            {suggestions.length === 0 && <p className="text-xs text-[#9A9A98]">Aucune suggestion pour l'instant.</p>}
          </div>
          <Link href="/annuaire" className="mt-4 block border-t border-[#EEEAE3] pt-3 text-center text-xs font-bold text-[#18243A] transition hover:text-[#A07724]">
            Voir tout le réseau
          </Link>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-editorial text-[25px] font-semibold tracking-[-0.025em] text-[#0B1931]">Événements à venir</h2>
            <Link href="/evenements" className="text-[11px] font-bold text-[#956E20] hover:underline">
              Tout voir
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {upcomingEvents.map((event) => {
              const startsAt = new Date(event.startsAt);
              return (
                <Link href={`/evenements/${event.id}`} key={event.id} className="flex gap-3 transition hover:translate-x-0.5">
                  <EventDate day={String(startsAt.getDate())} month={startsAt.toLocaleDateString("fr-FR", { month: "short" })} />
                  <div>
                    <p className="text-sm font-bold leading-5 text-[#162033]">{event.title}</p>
                    <p className="mt-1 text-[11px] leading-4 text-[#737983]">{event.location ?? (event.isOnline ? "En ligne" : "Lieu à confirmer")}</p>
                  </div>
                </Link>
              );
            })}
            {upcomingEvents.length === 0 && <p className="text-xs text-[#9A9A98]">Aucun événement publié pour le moment.</p>}
          </div>
        </Panel>

        <Panel className="relative overflow-hidden border-[#F0A366] bg-[#112A49] p-5 text-white">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#F5B37A]">Repère JECI</p>
          <p className="mt-2 font-editorial text-[22px] font-semibold leading-6">Retrouvez votre promotion et vos anciens camarades.</p>
          <Link href="/promotions" className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#F5B37A] hover:underline">
            <CalendarDays size={14} /> Voir les promotions
          </Link>
        </Panel>
        <p className="px-1 text-center text-[10px] leading-5 text-[#9A9A98]">JECI · Contact · Confidentialité · Règlement intérieur</p>
      </aside>
    </div>
  );
}

