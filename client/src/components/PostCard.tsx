/** JECI post card: réutilisée dans le fil (Home.tsx) et la page de détail (PostDetail.tsx). */
import { useState } from "react";
import { Bookmark, MessageCircle, Send, ThumbsUp, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, ProfileLink } from "@/components/UiPrimitives";
import { trpc } from "@/lib/trpc";
import { storageUrl } from "@/lib/storageUrl";

export type FeedPost = {
  id: number;
  authorId: number;
  body: string;
  createdAt: string | Date;
  authorName: string | null;
  authorAccountStatus: string;
  authorAvatar: string | null;
  attachmentStorageKey: string | null;
  attachmentMimeType: string | null;
  reactionCount: number;
  commentCount: number;
  viewerReaction: string | null;
};

function formatRelativeTime(date: string | Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.round(hours / 24)} j`;
}

export function PostCard({ post, isVerified, defaultCommentsOpen = false }: { post: FeedPost; isVerified: boolean; defaultCommentsOpen?: boolean }) {
  const utils = trpc.useUtils();
  const [commentsOpen, setCommentsOpen] = useState(defaultCommentsOpen);

  const savedIdsQuery = trpc.saved.ids.useQuery();
  const isSaved = (savedIdsQuery.data ?? []).some((row) => row.itemType === "post" && row.itemId === post.id);

  const reactMutation = trpc.feed.react.useMutation({
    onSuccess: () => {
      utils.feed.list.invalidate();
      utils.feed.getById.invalidate({ postId: post.id });
    },
    onError: (error) => toast.error(error.message),
  });

  const toggleSaved = trpc.saved.toggle.useMutation({
    onSuccess: (data) => {
      utils.saved.ids.invalidate();
      toast.success(data.saved ? "Publication enregistrée." : "Publication retirée des enregistrés.");
    },
    onError: (error) => toast.error(error.message),
  });

  const shareLink = () => {
    const url = `${window.location.origin}/publications/${post.id}`;
    if (navigator.clipboard) navigator.clipboard.writeText(url);
    toast.success("Le lien de cette publication a été copié.");
  };

  return (
    <article className="overflow-hidden rounded-xl border border-[#E6E1D9] bg-white shadow-[0_4px_15px_rgba(10,32,63,0.045)]">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <ProfileLink userId={post.authorId}>
              <Avatar alt={post.authorName ?? "Jéciste"} src={storageUrl(post.authorAvatar)} />
            </ProfileLink>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <ProfileLink userId={post.authorId} className="truncate text-sm font-bold text-[#101B31] hover:underline">
                  {post.authorName ?? "JECI"}
                </ProfileLink>
                {post.authorAccountStatus === "verified" ? (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-[#2776CE] text-[9px] text-white">✓</span>
                ) : (
                  <span className="rounded bg-[#F1F3F8] px-1.5 py-0.5 text-[9px] font-bold text-[#707787]">En cours de validation</span>
                )}
              </div>
              <p className="mt-0.5 text-[10px] text-[#9B9DA5]">{formatRelativeTime(post.createdAt)}</p>
            </div>
          </div>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-6 text-[#2A3446]">{post.body.trim()}</p>
        {post.attachmentStorageKey &&
          (post.attachmentMimeType?.startsWith("video/") ? (
            <video src={storageUrl(post.attachmentStorageKey)} controls className="mt-4 max-h-[480px] w-full rounded-xl bg-black" />
          ) : (
            <img src={storageUrl(post.attachmentStorageKey)} alt="Média de la publication" className="mt-4 max-h-[480px] w-full rounded-xl object-cover" />
          ))}
      </div>
      <div className="flex items-center gap-5 px-4 pb-4 pt-3 sm:px-5">
        <button
          onClick={() => (isVerified ? reactMutation.mutate({ postId: post.id, kind: "like" }) : toast.info("Vérifiez votre compte pour réagir."))}
          className={`flex items-center gap-1.5 text-xs font-semibold transition ${post.viewerReaction ? "text-[#172F54]" : "text-[#737983] hover:text-[#172F54]"}`}
        >
          <ThumbsUp size={19} fill={post.viewerReaction ? "currentColor" : "none"} />
          {post.reactionCount}
        </button>
        <button onClick={() => setCommentsOpen((state) => !state)} className="flex items-center gap-1.5 text-xs font-semibold text-[#737983] transition hover:text-[#172F54]">
          <MessageCircle size={19} />
          {post.commentCount}
        </button>
        <button onClick={shareLink} aria-label="Partager" className="text-[#737983] transition hover:text-[#172F54]">
          <Send size={19} />
        </button>
        <button
          onClick={() => (isVerified ? toggleSaved.mutate({ itemType: "post", itemId: post.id }) : toast.info("Vérifiez votre compte pour enregistrer une publication."))}
          aria-label="Enregistrer"
          className={`ml-auto transition ${isSaved ? "text-[#8B661D]" : "text-[#737983] hover:text-[#172F54]"}`}
        >
          <Bookmark size={19} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>
      {commentsOpen && <PostComments postId={post.id} isVerified={isVerified} />}
    </article>
  );
}

function PostComments({ postId, isVerified }: { postId: number; isVerified: boolean }) {
  const utils = trpc.useUtils();
  const commentsQuery = trpc.feed.comments.useQuery({ postId });
  const [draft, setDraft] = useState("");

  const addComment = trpc.feed.addComment.useMutation({
    onSuccess: () => {
      setDraft("");
      utils.feed.comments.invalidate({ postId });
      utils.feed.list.invalidate();
      utils.feed.getById.invalidate({ postId });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteComment = trpc.feed.deleteComment.useMutation({
    onSuccess: () => {
      utils.feed.comments.invalidate({ postId });
      utils.feed.list.invalidate();
      utils.feed.getById.invalidate({ postId });
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isVerified) {
      toast.info("Vérifiez votre compte pour commenter.");
      return;
    }
    if (!draft.trim()) return;
    addComment.mutate({ postId, body: draft.trim() });
  };

  const comments = commentsQuery.data ?? [];

  return (
    <div className="border-t border-[#EEEAE3] bg-[#FBFAF7] px-4 py-4 sm:px-5">
      {commentsQuery.isLoading && <p className="text-xs text-[#9A9A98]">Chargement des commentaires...</p>}
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2.5">
            <ProfileLink userId={comment.authorId}>
              <Avatar alt={comment.authorName ?? "Jéciste"} src={storageUrl(comment.authorAvatar)} size="sm" />
            </ProfileLink>
            <div className="min-w-0 flex-1 rounded-2xl bg-white px-3 py-2 shadow-sm">
              <ProfileLink userId={comment.authorId} className="text-xs font-bold text-[#18263E] hover:underline">
                {comment.authorName}
              </ProfileLink>
              <p className="mt-0.5 whitespace-pre-wrap text-xs leading-5 text-[#3D495B]">{comment.body}</p>
            </div>
            <button onClick={() => deleteComment.mutate({ commentId: comment.id })} aria-label="Supprimer le commentaire" className="self-start text-[#B8BEC7] hover:text-[#9E323A]">
              <X size={13} />
            </button>
          </div>
        ))}
        {!commentsQuery.isLoading && comments.length === 0 && <p className="text-xs text-[#9A9A98]">Aucun commentaire pour l'instant.</p>}
      </div>
      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={isVerified ? "Écrire un commentaire…" : "Vérifiez votre compte pour commenter"}
          disabled={!isVerified}
          className="h-9 min-w-0 flex-1 rounded-full border border-[#E4E5EA] bg-white px-3.5 text-xs outline-none disabled:opacity-60"
        />
        <button disabled={!isVerified || !draft.trim() || addComment.isPending} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#142640] text-white disabled:opacity-40">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
