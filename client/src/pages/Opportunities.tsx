/** JECI opportunities: offres réelles, branchées sur server/routers/opportunities.ts. */
import { useMemo, useState } from "react";
import { Bookmark, Building2, MapPin, Search, WalletCards, X } from "lucide-react";
import { toast } from "sonner";
import { useSearch } from "wouter";
import { MobileDetailScreen } from "@/components/MobileDetailScreen";
import { MobileQueryBar } from "@/components/MobileQueryControls";
import { PageIntro, Panel } from "@/components/UiPrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const typeLabels: Record<string, string> = { job: "Emploi", internship: "Stage", volunteering: "Bénévolat", scholarship: "Bourse", training: "Formation", call_for_projects: "Appel à projets", funding: "Financement", mission: "Mission", expertise: "Expertise", other: "Autre" };

type PublishedOpportunity = { id: number; title: string; type: string; organization: string | null; location: string | null; description: string; applyUrl: string | null; closesAt: string | Date | null; publishedAt: string | Date | null; authorName: string | null };

export default function Opportunities() {
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const utils = trpc.useUtils();
  const search = useSearch();
  const preselectedId = Number(new URLSearchParams(search).get("id")) || null;

  const [selectedId, setSelectedId] = useState<number | null>(preselectedId);
  const [term, setTerm] = useState("");
  const [type, setType] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(Boolean(preselectedId));
  const [showCreate, setShowCreate] = useState(false);

  const listQuery = trpc.opportunities.listPublished.useQuery({ type: (type as never) ?? undefined });
  const savedIdsQuery = trpc.saved.ids.useQuery();

  const items = useMemo(() => {
    const list = (listQuery.data ?? []) as PublishedOpportunity[];
    if (!term) return list;
    return list.filter((item) => `${item.title} ${item.organization ?? ""} ${item.location ?? ""}`.toLowerCase().includes(term.toLowerCase()));
  }, [listQuery.data, term]);

  const activeId = selectedId ?? items[0]?.id ?? null;
  const current = items.find((item) => item.id === activeId) ?? items[0];

  const savedSet = useMemo(() => new Set((savedIdsQuery.data ?? []).filter((row) => row.itemType === "opportunity").map((row) => row.itemId)), [savedIdsQuery.data]);

  const toggleSaved = trpc.saved.toggle.useMutation({
    onSuccess: (data) => {
      utils.saved.ids.invalidate();
      toast.success(data.saved ? "Offre enregistrée." : "Offre retirée des enregistrés.");
    },
    onError: (error) => toast.error(error.message),
  });

  const createOpportunity = trpc.opportunities.create.useMutation({
    onSuccess: () => {
      setShowCreate(false);
      toast.success("Votre offre a été soumise pour validation par l'administration.");
    },
    onError: (error) => toast.error(error.message),
  });

  const selectOpportunity = (id: number) => {
    setSelectedId(id);
    if (window.innerWidth < 1024) setMobileDetailOpen(true);
  };

  const handlePublishClick = () => {
    if (!isVerified) {
      toast.info("Vérifiez votre compte pour proposer une opportunité.");
      return;
    }
    setShowCreate(true);
  };

  return (
    <div>
      <PageIntro
        eyebrow="Carrières et opportunités"
        title="Faire circuler les opportunités."
        description="Des offres et missions partagées par les Jécistes pour accélérer les prochaines étapes de chacun."
        action={
          <button onClick={handlePublishClick} className="rounded-full bg-black px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#17233B]">
            Publier une offre
          </button>
        }
      />
      <MobileQueryBar value={term} onChange={setTerm} placeholder="Métier, entreprise, localisation…" />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setType(null)} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition ${type === null ? "bg-[#E3E0FA] text-[#3B32A0]" : "bg-white text-[#636D7C] hover:bg-[#F6F2EB]"}`}>
          Toutes
        </button>
        {Object.entries(typeLabels).map(([value, label]) => (
          <button key={value} onClick={() => setType(value)} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition ${type === value ? "bg-[#E3E0FA] text-[#3B32A0]" : "bg-white text-[#636D7C] hover:bg-[#F6F2EB]"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.88fr)_minmax(340px,1.12fr)]">
        <section>
          <div className="relative mb-4 hidden xl:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777F8A]" size={19} />
            <input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Métier, entreprise, localisation…" className="h-11 w-full rounded-xl border border-[#DDD8D0] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#10203A] focus:ring-4 focus:ring-[#DFE7F1]" />
          </div>
          {listQuery.isLoading && <p className="text-sm text-[#707787]">Chargement des opportunités...</p>}
          <div className="space-y-3">
            {items.map((opportunity) => (
              <button key={opportunity.id} onClick={() => selectOpportunity(opportunity.id)} className={`w-full rounded-xl border p-4 text-left transition ${activeId === opportunity.id ? "border-[#7A6FE0] bg-[#FFFDF8] shadow-[0_5px_18px_rgba(134,97,24,0.1)]" : "border-[#E4DFD7] bg-white hover:border-[#C7C0B6]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-[#EEF1F5] px-2.5 py-1 text-[10px] font-extrabold text-[#536071]">{typeLabels[opportunity.type] ?? opportunity.type}</span>
                  {opportunity.publishedAt && <span className="text-[10px] text-[#7A818B]">{new Date(opportunity.publishedAt).toLocaleDateString("fr-FR")}</span>}
                </div>
                <h2 className="mt-3 font-editorial text-[25px] font-semibold leading-5 text-[#0B1931]">{opportunity.title}</h2>
                <p className="mt-1 text-xs font-bold text-[#536071]">{opportunity.organization ?? "JECI"}</p>
                {opportunity.location && (
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#717A87]">
                    <MapPin size={14} />
                    {opportunity.location}
                  </p>
                )}
              </button>
            ))}
          </div>
          {!listQuery.isLoading && items.length === 0 && (
            <Panel className="mt-4 p-10 text-center">
              <p className="font-editorial text-2xl font-semibold text-[#10213D]">Aucune opportunité publiée pour l'instant.</p>
            </Panel>
          )}
        </section>
        {current ? (
          <Panel className="hidden h-fit overflow-hidden lg:block">
            <OpportunityDetail opportunity={current} saved={savedSet.has(current.id)} onToggleSaved={() => toggleSaved.mutate({ itemType: "opportunity", itemId: current.id })} />
          </Panel>
        ) : null}
      </div>
      {mobileDetailOpen && current ? (
        <MobileDetailScreen title={current.title} subtitle={current.organization ?? ""} onBack={() => setMobileDetailOpen(false)}>
          <OpportunityDetail opportunity={current} saved={savedSet.has(current.id)} onToggleSaved={() => toggleSaved.mutate({ itemType: "opportunity", itemId: current.id })} mobile />
        </MobileDetailScreen>
      ) : null}
      {showCreate && <CreateOpportunityModal onClose={() => setShowCreate(false)} onSubmit={(input) => createOpportunity.mutate(input)} isPending={createOpportunity.isPending} />}
    </div>
  );
}

function OpportunityDetail({ opportunity, saved, onToggleSaved, mobile = false }: { opportunity: PublishedOpportunity; saved: boolean; onToggleSaved: () => void; mobile?: boolean }) {
  return (
    <>
      <div className="border-b border-[#EAE5DC] bg-[#102846] px-6 py-7 text-white">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#D7E1ED]">{typeLabels[opportunity.type] ?? opportunity.type}</p>
        <h1 className="mt-2 font-editorial text-[40px] font-semibold leading-[0.95] tracking-[-0.04em]">{opportunity.title}</h1>
        <p className="mt-3 text-sm text-[#D8DFE9]">{opportunity.organization ?? "JECI"}</p>
      </div>
      <div className={`bg-white p-6 ${mobile ? "min-h-[calc(100dvh-13rem)]" : ""}`}>
        <div className="grid gap-4 text-sm text-[#576374] sm:grid-cols-2">
          <p className="flex gap-2">
            <Building2 className="shrink-0 text-[#173351]" size={18} />
            {opportunity.organization ?? "—"}
          </p>
          <p className="flex gap-2">
            <MapPin className="shrink-0 text-[#173351]" size={18} />
            {opportunity.location ?? "—"}
          </p>
          <p className="flex gap-2">
            <WalletCards className="shrink-0 text-[#173351]" size={18} />
            Partagée par {opportunity.authorName ?? "un membre"}
          </p>
        </div>
        <h2 className="mt-7 font-editorial text-3xl font-semibold text-[#10203A]">La mission</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#626D7A]">{opportunity.description}</p>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          <a
            href={opportunity.applyUrl ?? "#"}
            target={opportunity.applyUrl ? "_blank" : undefined}
            rel="noreferrer"
            onClick={(event) => {
              if (!opportunity.applyUrl) {
                event.preventDefault();
                toast.info("Aucun lien de candidature fourni pour cette offre.");
              }
            }}
            className="flex-1 rounded-lg bg-black py-3 text-center text-xs font-extrabold text-white transition hover:bg-[#17233B]"
          >
            Je suis intéressé·e
          </a>
          <button onClick={onToggleSaved} aria-label="Enregistrer l'offre" className="grid min-h-11 place-items-center rounded-lg border-2 border-[#15233B] px-4 text-[#15233B] transition hover:bg-[#F3EFE8]">
            <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </>
  );
}

export function CreateOpportunityModal({ onClose, onSubmit, isPending }: { onClose: () => void; onSubmit: (input: { title: string; type: "job" | "internship" | "volunteering" | "scholarship" | "training" | "call_for_projects" | "funding" | "mission" | "expertise" | "other"; organization?: string; location?: string; description: string; applyUrl?: string }) => void; isPending: boolean }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"job" | "internship" | "volunteering" | "scholarship" | "training" | "call_for_projects" | "funding" | "mission" | "expertise" | "other">("job");
  const [organization, setOrganization] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [applyUrl, setApplyUrl] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || description.trim().length < 10) {
      toast.error("Titre et description (10 caractères minimum) sont requis.");
      return;
    }
    onSubmit({ title: title.trim(), type, organization: organization.trim() || undefined, location: location.trim() || undefined, description: description.trim(), applyUrl: applyUrl.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091830]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#0B1931]">Proposer une opportunité</h2>
          <button onClick={onClose} className="rounded-full p-1 text-[#7E8490] hover:bg-[#F3F0EA]">
            <X size={20} />
          </button>
        </div>
        <p className="mt-1 text-xs text-[#707787]">Votre offre sera visible publiquement après validation par un administrateur.</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="opp-title">Titre du poste</Label>
            <Input id="opp-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="opp-type">Type</Label>
              <select id="opp-type" value={type} onChange={(event) => setType(event.target.value as typeof type)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opp-org">Organisation</Label>
              <Input id="opp-org" value={organization} onChange={(event) => setOrganization(event.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="opp-location">Localisation</Label>
            <Input id="opp-location" value={location} onChange={(event) => setLocation(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="opp-url">Lien de candidature (optionnel)</Label>
            <Input id="opp-url" type="url" placeholder="https://..." value={applyUrl} onChange={(event) => setApplyUrl(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="opp-description">Description</Label>
            <Textarea id="opp-description" rows={5} value={description} onChange={(event) => setDescription(event.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Envoi..." : "Soumettre pour validation"}
          </Button>
        </form>
      </div>
    </div>
  );
}
