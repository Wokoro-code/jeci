/** JECI — Mémoire JEC : patrimoine numérique du mouvement (cahier §24). */
import { useState } from "react";
import { Landmark, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PageIntro, Panel } from "@/components/UiPrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { storageUrl } from "@/lib/storageUrl";
import { MediaAndLinkFields } from "@/components/MediaAndLinkFields";

export default function Memory() {
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const entriesQuery = trpc.memory.list.useQuery({});
  const submitEntry = trpc.memory.submit.useMutation({
    onSuccess: () => {
      utils.memory.list.invalidate();
      toast.success("Contribution envoyée pour validation.");
      setShowCreate(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const entries = entriesQuery.data ?? [];

  return (
    <div>
      <PageIntro
        eyebrow="Patrimoine du mouvement"
        title="Mémoire JEC."
        description="Anciennes équipes, événements historiques, témoignages et archives : conserver l'histoire du mouvement pour les générations qui viennent."
        action={
          <button
            onClick={() => (isVerified ? setShowCreate(true) : toast.info("Vérifiez votre compte pour contribuer."))}
            className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#17233B]"
          >
            <Plus size={15} /> Contribuer
          </button>
        }
      />

      {entriesQuery.isLoading && <p className="text-sm text-[#707787]">Chargement...</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <Panel key={entry.id} className="overflow-hidden">
            {entry.mediaStorageKey && (entry.mediaMimeType?.startsWith("video/") ? <video src={storageUrl(entry.mediaStorageKey)} controls className="h-40 w-full bg-black object-cover" /> : <img src={storageUrl(entry.mediaStorageKey)} alt={entry.title} className="h-40 w-full object-cover" />)}
            <div className="p-5">
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#3B32A0]">
                <Landmark size={13} />
                {entry.periodLabel ?? "Mémoire JEC"}
              </div>
              <h2 className="mt-1.5 font-editorial text-xl font-semibold leading-tight text-[#10203A]">{entry.title}</h2>
              {entry.body && <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#687080]">{entry.body}</p>}
              <p className="mt-3 text-[11px] text-[#9AA1AA]">
                {entry.unitName ?? "JECI"} · par {entry.authorName}
              </p>
              {entry.linkUrl && (
                <a href={entry.linkUrl} target="_blank" rel="noreferrer" className="mt-2 block text-[11px] font-bold text-[#5B4FE0] underline">
                  Voir la source
                </a>
              )}
            </div>
          </Panel>
        ))}
      </div>

      {!entriesQuery.isLoading && entries.length === 0 && (
        <Panel className="mt-4 p-10 text-center">
          <p className="font-editorial text-2xl font-semibold text-[#10213D]">Aucune archive publiée pour l'instant.</p>
          <p className="mt-2 text-xs text-[#707787]">Les contributions sont soumises à validation avant publication.</p>
        </Panel>
      )}

      {showCreate && <CreateMemoryModal onClose={() => setShowCreate(false)} isPending={submitEntry.isPending} onSubmit={(input) => submitEntry.mutate(input)} />}
    </div>
  );
}

function CreateMemoryModal({ onClose, onSubmit, isPending }: { onClose: () => void; isPending: boolean; onSubmit: (input: { title: string; periodLabel?: string; body?: string; mediaStorageKey?: string; mediaMimeType?: string; linkUrl?: string }) => void }) {
  const [title, setTitle] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");
  const [body, setBody] = useState("");
  const [mediaStorageKey, setMediaStorageKey] = useState<string | undefined>(undefined);
  const [mediaMimeType, setMediaMimeType] = useState<string | undefined>(undefined);
  const [linkUrl, setLinkUrl] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    onSubmit({ title: title.trim(), periodLabel: periodLabel.trim() || undefined, body: body.trim() || undefined, mediaStorageKey, mediaMimeType, linkUrl: linkUrl.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091830]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#0B1931]">Contribuer à la mémoire JEC</h2>
          <button onClick={onClose} className="rounded-full p-1 text-[#7E8490] hover:bg-[#F3F0EA]">
            <X size={20} />
          </button>
        </div>
        <p className="mt-1 text-xs text-[#707787]">Votre contribution sera publiée après validation par un modérateur.</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="memory-title">Titre</Label>
            <Input id="memory-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="memory-period">Période</Label>
            <Input id="memory-period" placeholder="Ex. 1985–1990" value={periodLabel} onChange={(event) => setPeriodLabel(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="memory-body">Récit / témoignage</Label>
            <Textarea id="memory-body" rows={4} value={body} onChange={(event) => setBody(event.target.value)} />
          </div>
          <MediaAndLinkFields mediaStorageKey={mediaStorageKey} onMediaChange={(result) => { setMediaStorageKey(result.storageKey); setMediaMimeType(result.mimeType); }} linkUrl={linkUrl} onLinkChange={setLinkUrl} linkLabel="Lien vers une archive ou un article (optionnel)" />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Envoi..." : "Envoyer pour validation"}
          </Button>
        </form>
      </div>
    </div>
  );
}
