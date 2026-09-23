/** JECI post detail: ouvre directement une publication précise (depuis un lien direct ou les éléments enregistrés). */
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";
import { Panel } from "@/components/UiPrimitives";
import { PostCard } from "@/components/PostCard";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";

  const postQuery = trpc.feed.getById.useQuery({ postId }, { enabled: Number.isFinite(postId) });

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#5F6978] transition hover:text-[#0E1D36]">
        <ArrowLeft size={16} /> Retour au fil
      </Link>
      {postQuery.isLoading && <p className="text-sm text-[#707787]">Chargement de la publication...</p>}
      {!postQuery.isLoading && !postQuery.data && (
        <Panel className="p-10 text-center">
          <p className="font-editorial text-2xl font-semibold text-[#10213D]">Cette publication n'est plus disponible.</p>
        </Panel>
      )}
      {postQuery.data && <PostCard post={postQuery.data} isVerified={isVerified} defaultCommentsOpen />}
    </div>
  );
}
