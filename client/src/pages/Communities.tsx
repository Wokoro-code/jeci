/** JECI — Communautés : espaces thématiques, nationaux, régionaux et professionnels (cahier §15). */
import { useState } from "react";
import { Plus, Users2, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { PageIntro, Panel } from "@/components/UiPrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { uploadFile } from "@/lib/upload";
import { storageUrl } from "@/lib/storageUrl";

const scopeLabels: Record<string, string> = { international: "Internationale", regional: "Régionale", national: "Nationale", professional: "Professionnelle", thematic: "Thématique" };
const scopes = ["international", "regional", "national", "professional", "thematic"] as const;

export default function Communities() {
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const [scope, setScope] = useState<(typeof scopes)[number] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const overviewQuery = trpc.account.overview.useQuery(undefined, { enabled: Boolean(user) });
  const isCurrentLeader = overviewQuery.data?.profile?.jecStatus === "current_leader" || user?.role === "admin";

  const communitiesQuery = trpc.communities.list.useQuery(scope ? { scope } : {});
  const createCommunity = trpc.communities.create.useMutation({
    onSuccess: () => {
      utils.communities.list.invalidate();
      toast.success("Communauté créée.");
      setShowCreate(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const communities = communitiesQuery.data ?? [];

  const handleCreateClick = () => {
    if (!isVerified) {
      toast.info("Vérifiez votre compte pour créer une communauté.");
      return;
    }
    if (!isCurrentLeader) {
      toast.info("Seuls les responsables actuels peuvent créer une communauté (cahier des charges §15).");
      return;
    }
    setShowCreate(true);
  };

  return (
    <div>
      <PageIntro
        eyebrow="Vie du réseau"
        title="Des communautés pour chaque appartenance."
        description="Mouvements nationaux, réseaux professionnels ou groupes thématiques : retrouvez les Jécistes qui partagent votre parcours ou vos centres d'intérêt. L'adhésion à une communauté est validée par ses administrateurs."
        action={
          <button onClick={handleCreateClick} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition ${isCurrentLeader ? "bg-black text-white hover:bg-[#17233B]" : "bg-[#F1F2F5] text-[#8A94A2]"}`} title={isCurrentLeader ? undefined : "Réservé aux responsables actuels"}>
            <Plus size={15} /> Créer une communauté
          </button>
        }
      />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setScope(null)} className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition ${scope === null ? "bg-[#E3E0FA] text-[#2A2270]" : "bg-white text-[#636D7C] hover:bg-[#F6F2EB]"}`}>
          Toutes
        </button>
        {scopes.map((value) => (
          <button key={value} onClick={() => setScope(value)} className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition ${scope === value ? "bg-[#E3E0FA] text-[#2A2270]" : "bg-white text-[#636D7C] hover:bg-[#F6F2EB]"}`}>
            {scopeLabels[value]}
          </button>
        ))}
      </div>

      {!isCurrentLeader && (
        <p className="mb-4 text-xs text-[#8A94A2]">Seuls les responsables actuels peuvent créer une communauté ; vous pouvez demander à rejoindre celles existantes.</p>
      )}

      {communitiesQuery.isLoading && <p className="text-sm text-[#707787]">Chargement des communautés...</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {communities.map((community) => (
          <Link key={community.id} href={`/communautes/${community.id}`}>
            <Panel className="block cursor-pointer overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(10,32,63,0.09)]">
              {community.imageStorageKey && <img src={storageUrl(community.imageStorageKey)} alt="" className="h-28 w-full object-cover" />}
              <div className="p-5">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#3B32A0]">{scopeLabels[community.scope]}</span>
                <h2 className="mt-1.5 font-editorial text-2xl font-semibold leading-tight text-[#0B1931]">{community.name}</h2>
                {community.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#687080]">{community.description}</p>}
                <p className="mt-4 flex items-center gap-2 text-xs font-bold text-[#536070]">
                  <Users2 size={15} />
                  {community.memberCount} membre{Number(community.memberCount) > 1 ? "s" : ""}
                </p>
              </div>
            </Panel>
          </Link>
        ))}
      </div>

      {!communitiesQuery.isLoading && communities.length === 0 && (
        <Panel className="mt-4 p-10 text-center">
          <p className="font-editorial text-2xl font-semibold text-[#10213D]">Aucune communauté pour l'instant.</p>
          <p className="mt-2 text-xs text-[#707787]">Un responsable actuel peut en créer une nouvelle.</p>
        </Panel>
      )}

      {showCreate && (
        <CreateCommunityModal onClose={() => setShowCreate(false)} isPending={createCommunity.isPending} onSubmit={(input) => createCommunity.mutate(input)} />
      )}
    </div>
  );
}

function CreateCommunityModal({ onClose, onSubmit, isPending }: { onClose: () => void; isPending: boolean; onSubmit: (input: { name: string; description?: string; scope: "professional" | "thematic"; imageStorageKey?: string }) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<"professional" | "thematic">("thematic");
  const [imageStorageKey, setImageStorageKey] = useState<string | undefined>(undefined);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await uploadFile(file, "post_media");
      setImageStorageKey(result.storageKey);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'envoi de l'image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom est requis.");
      return;
    }
    onSubmit({ name: name.trim(), description: description.trim() || undefined, scope, imageStorageKey });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091830]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#0B1931]">Créer une communauté</h2>
          <button onClick={onClose} className="rounded-full p-1 text-[#7E8490] hover:bg-[#F3F0EA]">
            <X size={20} />
          </button>
        </div>
        <p className="mt-1 text-xs text-[#707787]">Les communautés internationales, régionales et nationales officielles restent créées par l'administration.</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="community-name">Nom</Label>
            <Input id="community-name" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="community-scope">Type</Label>
            <select id="community-scope" value={scope} onChange={(event) => setScope(event.target.value as typeof scope)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="thematic">Thématique</option>
              <option value="professional">Professionnelle</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="community-description">Description</Label>
            <Textarea id="community-description" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Image (optionnel)</Label>
            {imageStorageKey ? (
              <div className="flex items-center justify-between rounded-lg border border-[#D9D4CC] bg-[#F7F4EE] px-3 py-2 text-xs font-bold text-[#3D495B]">
                <span>Image ajoutée ✓</span>
                <button type="button" onClick={() => setImageStorageKey(undefined)} className="rounded-full p-1 text-[#9AA1AA] hover:bg-white hover:text-[#9B2226]" aria-label="Retirer l'image">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#D9D4CC] py-3 text-xs font-bold text-[#536174] hover:bg-[#F7F4EE]">
                {uploadingImage ? "Envoi..." : "Ajouter une image"}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageChange} disabled={uploadingImage} />
              </label>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Création..." : "Créer"}
          </Button>
        </form>
      </div>
    </div>
  );
}
