/** JECI projects: espaces collaboratifs réels, branchés sur server/routers/projects.ts. */
import { useState } from "react";
import { ArrowUpRight, LockKeyhole, UsersRound, X } from "lucide-react";
import { Link } from "wouter";
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

const visibilityLabels: Record<string, string> = { network: "Ouvert au réseau", unit_only: "Réservé à ma structure", private: "Sur invitation" };

export default function Projects() {
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [contributable, setContributable] = useState(false);

  const projectsQuery = trpc.projects.list.useQuery({ contributable: contributable || undefined });

  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      setShowCreate(false);
      utils.projects.list.invalidate();
      toast.success("Espace créé.");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleCreateClick = () => {
    if (!isVerified) {
      toast.info("Vérifiez votre compte pour créer un espace.");
      return;
    }
    setShowCreate(true);
  };

  const projects = projectsQuery.data ?? [];

  return (
    <div>
      <PageIntro
        eyebrow="Espaces collaboratifs"
        title="Les projets qui réunissent."
        description="Rejoignez les collectifs qui prolongent les échanges du réseau en initiatives concrètes."
        action={
          <button onClick={handleCreateClick} className="rounded-full bg-black px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#17233B]">
            Créer un projet
          </button>
        }
      />
      {/* « Projets auxquels je peux contribuer » (cahier §21) */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setContributable(false)} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition ${!contributable ? "bg-[#E3E0FA] text-[#3B32A0]" : "bg-white text-[#636D7C] hover:bg-[#F6F2EB]"}`}>
          Tous les projets
        </button>
        <button onClick={() => setContributable(true)} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition ${contributable ? "bg-[#E3E0FA] text-[#3B32A0]" : "bg-white text-[#636D7C] hover:bg-[#F6F2EB]"}`}>
          Projets auxquels je peux contribuer
        </button>
      </div>
      {projectsQuery.isLoading && <p className="text-sm text-[#707787]">Chargement des espaces...</p>}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <article key={project.id} className="overflow-hidden rounded-xl border border-[#E4DFD7] bg-white shadow-[0_5px_16px_rgba(10,32,63,0.05)] transition hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(10,32,63,0.11)]">
            {project.coverStorageKey && (project.coverMimeType?.startsWith("video/") ? <video src={storageUrl(project.coverStorageKey)} className="h-32 w-full bg-black object-cover" muted /> : <img src={storageUrl(project.coverStorageKey)} alt="" className="h-32 w-full object-cover" />)}
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#F2E5C5] px-2.5 py-1 text-[10px] font-extrabold text-[#674B14]">{visibilityLabels[project.visibility] ?? project.visibility}</span>
                {project.visibility === "private" && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#75808C]">
                    <LockKeyhole size={12} /> Privé
                  </span>
                )}
              </div>
              <h2 className="mt-4 font-editorial text-[29px] font-semibold leading-6 text-[#0B1931]">{project.name}</h2>
              <p className="mt-3 text-xs leading-5 text-[#65707F]">{project.description ?? "Aucune description fournie."}</p>
              {project.needs && (
                <p className="mt-2 rounded-lg bg-[#FBE0C8] px-2.5 py-1.5 text-[11px] font-bold text-[#8A3F10]">Besoins : {project.needs}</p>
              )}
              <div className="mt-5 flex items-center justify-between border-t border-[#EEEAE3] pt-4">
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#626D7B]">
                  <UsersRound size={15} /> Créé par {project.ownerName}
                </span>
                <Link href={`/projets/${project.id}`} className="flex items-center gap-1 text-xs font-extrabold text-[#172842] hover:gap-2">
                  Accéder <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!projectsQuery.isLoading && projects.length === 0 && (
        <Panel className="mt-4 p-10 text-center">
          <p className="font-editorial text-2xl font-semibold text-[#10213D]">Aucun espace collaboratif pour l'instant.</p>
        </Panel>
      )}
      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} isPending={createProject.isPending} onSubmit={(input) => createProject.mutate(input)} />}
    </div>
  );
}

export function CreateProjectModal({ onClose, onSubmit, isPending }: { onClose: () => void; isPending: boolean; onSubmit: (input: { name: string; description?: string; domain?: string; location?: string; objective?: string; needs?: string; budgetIndicative?: string; partners?: string; coverStorageKey?: string; coverMimeType?: string; linkUrl?: string; visibility?: "network" | "unit_only" | "private" }) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [location, setLocation] = useState("");
  const [objective, setObjective] = useState("");
  const [needs, setNeeds] = useState("");
  const [budgetIndicative, setBudgetIndicative] = useState("");
  const [partners, setPartners] = useState("");
  const [visibility, setVisibility] = useState<"network" | "unit_only" | "private">("network");
  const [coverStorageKey, setCoverStorageKey] = useState<string | undefined>(undefined);
  const [coverMimeType, setCoverMimeType] = useState<string | undefined>(undefined);
  const [linkUrl, setLinkUrl] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Le nom de l'espace doit contenir au moins 2 caractères.");
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      domain: domain.trim() || undefined,
      location: location.trim() || undefined,
      objective: objective.trim() || undefined,
      needs: needs.trim() || undefined,
      budgetIndicative: budgetIndicative.trim() || undefined,
      partners: partners.trim() || undefined,
      coverStorageKey,
      coverMimeType,
      linkUrl: linkUrl.trim() || undefined,
      visibility,
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091830]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#0B1931]">Créer un espace</h2>
          <button onClick={onClose} className="rounded-full p-1 text-[#7E8490] hover:bg-[#F3F0EA]">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Nom de l'espace</Label>
            <Input id="project-name" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="project-domain">Domaine</Label>
              <Input id="project-domain" placeholder="Ex. Éducation" value={domain} onChange={(event) => setDomain(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-location">Localisation</Label>
              <Input id="project-location" placeholder="Ex. Lomé, Togo" value={location} onChange={(event) => setLocation(event.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-visibility">Visibilité</Label>
            <select id="project-visibility" value={visibility} onChange={(event) => setVisibility(event.target.value as typeof visibility)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="network">Ouvert à tout le réseau</option>
              <option value="unit_only">Réservé à ma structure</option>
              <option value="private">Privé (sur invitation)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-description">Description</Label>
            <Textarea id="project-description" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-objective">Objectif</Label>
            <Textarea id="project-objective" rows={2} value={objective} onChange={(event) => setObjective(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-needs">Besoins (pour « projets auxquels contribuer »)</Label>
            <Textarea id="project-needs" rows={2} placeholder="Ex. bénévoles, compétences en design, financement…" value={needs} onChange={(event) => setNeeds(event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="project-budget">Budget indicatif</Label>
              <Input id="project-budget" placeholder="Ex. 2 000 €" value={budgetIndicative} onChange={(event) => setBudgetIndicative(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-partners">Partenaires</Label>
              <Input id="project-partners" value={partners} onChange={(event) => setPartners(event.target.value)} />
            </div>
          </div>
          <MediaAndLinkFields mediaStorageKey={coverStorageKey} onMediaChange={(result) => { setCoverStorageKey(result.storageKey); setCoverMimeType(result.mimeType); }} linkUrl={linkUrl} onLinkChange={setLinkUrl} linkLabel="Site ou lien du projet (optionnel)" />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Création..." : "Créer l'espace"}
          </Button>
        </form>
      </div>
    </div>
  );
}
