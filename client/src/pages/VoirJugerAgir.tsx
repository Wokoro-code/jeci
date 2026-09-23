/** JECI — Voir, Juger, Agir : la démarche propre à l'identité JEC (cahier §23). */
import { useState } from "react";
import { Compass, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, PageIntro, Panel, ProfileLink } from "@/components/UiPrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { storageUrl } from "@/lib/storageUrl";
import { MediaAndLinkFields } from "@/components/MediaAndLinkFields";

const statusLabels: Record<string, string> = { draft: "Brouillon", in_progress: "En cours", completed: "Terminée" };

export default function VoirJugerAgir() {
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const sheetsQuery = trpc.vja.list.useQuery();
  const createSheet = trpc.vja.create.useMutation({
    onSuccess: () => {
      utils.vja.list.invalidate();
      toast.success("Fiche Voir-Juger-Agir créée.");
      setShowCreate(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const sheets = sheetsQuery.data ?? [];

  return (
    <div>
      <PageIntro
        eyebrow="Identité JEC"
        title="Voir, Juger, Agir."
        description="Une réalité observée, une analyse à la lumière de l'Évangile et de la réflexion collective, une action concrète. La démarche propre au mouvement, ouverte aux contributions individuelles ou collectives."
        action={
          <button
            onClick={() => (isVerified ? setShowCreate(true) : toast.info("Vérifiez votre compte pour contribuer."))}
            className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#17233B]"
          >
            <Plus size={15} /> Nouvelle fiche
          </button>
        }
      />

      {sheetsQuery.isLoading && <p className="text-sm text-[#707787]">Chargement...</p>}

      <div className="space-y-4">
        {sheets.map((sheet) => (
          <Panel key={sheet.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-[#F1F2F5] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#586272]">{statusLabels[sheet.status]}</span>
                <h2 className="mt-2 font-editorial text-2xl font-semibold text-[#10203A]">{sheet.title}</h2>
              </div>
              <Compass size={20} className="shrink-0 text-[#3B32A0]" />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#596575]">
              <strong className="text-[#10203A]">Voir — </strong>
              {sheet.seeReality}
            </p>
            {sheet.mediaStorageKey && (sheet.mediaMimeType?.startsWith("video/") ? (
              <video src={storageUrl(sheet.mediaStorageKey)} controls className="mt-3 h-40 w-full rounded-lg bg-black object-cover" />
            ) : (
              <img src={storageUrl(sheet.mediaStorageKey)} alt={sheet.title} className="mt-3 h-40 w-full rounded-lg object-cover" />
            ))}
            {sheet.linkUrl && (
              <a href={sheet.linkUrl} target="_blank" rel="noreferrer" className="mt-2 block text-[11px] font-bold text-[#5B4FE0] underline">
                Ressource liée
              </a>
            )}
            <div className="mt-4 flex items-center gap-2 border-t border-[#EEEAE3] pt-3 text-xs text-[#687281]">
              <ProfileLink userId={sheet.authorId}>
                <Avatar alt={sheet.authorName ?? "Membre"} src={storageUrl(sheet.authorAvatar)} size="sm" />
              </ProfileLink>
              <ProfileLink userId={sheet.authorId} className="font-bold hover:underline">
                {sheet.authorName}
              </ProfileLink>
              {sheet.unitName && <span>· {sheet.unitName}</span>}
            </div>
          </Panel>
        ))}
      </div>

      {!sheetsQuery.isLoading && sheets.length === 0 && (
        <Panel className="p-10 text-center">
          <p className="font-editorial text-2xl font-semibold text-[#10213D]">Aucune fiche partagée pour l'instant.</p>
          <p className="mt-2 text-xs text-[#707787]">Soyez la première ou le premier à partager une démarche Voir-Juger-Agir.</p>
        </Panel>
      )}

      {showCreate && (
        <CreateVjaModal
          onClose={() => setShowCreate(false)}
          isPending={createSheet.isPending}
          onSubmit={(input) => createSheet.mutate(input)}
        />
      )}
    </div>
  );
}

function CreateVjaModal({
  onClose,
  onSubmit,
  isPending,
}: {
  onClose: () => void;
  isPending: boolean;
  onSubmit: (input: { title: string; seeReality: string; judgeAnalysis?: string; judgeReflection?: string; actObjective?: string; actAction?: string; mediaStorageKey?: string; mediaMimeType?: string; linkUrl?: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [seeReality, setSeeReality] = useState("");
  const [judgeAnalysis, setJudgeAnalysis] = useState("");
  const [actAction, setActAction] = useState("");
  const [mediaStorageKey, setMediaStorageKey] = useState<string | undefined>(undefined);
  const [mediaMimeType, setMediaMimeType] = useState<string | undefined>(undefined);
  const [linkUrl, setLinkUrl] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !seeReality.trim()) {
      toast.error("Le titre et la réalité observée (Voir) sont requis.");
      return;
    }
    onSubmit({ title: title.trim(), seeReality: seeReality.trim(), judgeAnalysis: judgeAnalysis.trim() || undefined, actAction: actAction.trim() || undefined, mediaStorageKey, mediaMimeType, linkUrl: linkUrl.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091830]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#0B1931]">Nouvelle fiche Voir-Juger-Agir</h2>
          <button onClick={onClose} className="rounded-full p-1 text-[#7E8490] hover:bg-[#F3F0EA]">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="vja-title">Titre</Label>
            <Input id="vja-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vja-see">Voir — la réalité observée</Label>
            <Textarea id="vja-see" rows={3} value={seeReality} onChange={(event) => setSeeReality(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vja-judge">Juger — analyse et réflexion</Label>
            <Textarea id="vja-judge" rows={3} value={judgeAnalysis} onChange={(event) => setJudgeAnalysis(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vja-act">Agir — action envisagée</Label>
            <Textarea id="vja-act" rows={3} value={actAction} onChange={(event) => setActAction(event.target.value)} />
          </div>
          <MediaAndLinkFields mediaStorageKey={mediaStorageKey} onMediaChange={(result) => { setMediaStorageKey(result.storageKey); setMediaMimeType(result.mimeType); }} linkUrl={linkUrl} onLinkChange={setLinkUrl} linkLabel="Lien vers une ressource (optionnel)" />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Enregistrement..." : "Publier la fiche"}
          </Button>
        </form>
      </div>
    </div>
  );
}
