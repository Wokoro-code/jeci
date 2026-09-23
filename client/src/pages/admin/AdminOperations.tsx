/** JECI admin operations: événements, opportunités, organisation, mentorat, projets — tous branchés sur server/routers/admin.ts. */
import { Check, Plus, Search, UsersRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MobileFilterSheet, MobileFilterTrigger, MobileQueryBar } from "@/components/MobileQueryControls";
import { AdminPageHeader, AdminPanel, StatusBadge } from "@/components/AdminPrimitives";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const eventStatusLabels: Record<string, string> = { pending: "À valider", published: "Publié", cancelled: "Annulé", archived: "Brouillon" };
const opportunityStatusLabels: Record<string, string> = { pending: "À valider", published: "Publié", rejected: "Refusé", expired: "Expiré", archived: "Brouillon" };

export function AdminEvents() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState("Tous");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const eventsQuery = trpc.admin.allEvents.useQuery();

  const decideEvent = trpc.admin.decideEvent.useMutation({
    onSuccess: () => {
      utils.admin.allEvents.invalidate();
      toast.success("Événement mis à jour.");
    },
    onError: (error) => toast.error(error.message),
  });

  const createEvent = trpc.events.create.useMutation({
    onSuccess: (data) => {
      decideEvent.mutate({ eventId: data.eventId, decision: "published" });
      setShowCreate(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const states = ["Tous", "À valider", "Publié", "Annulé"];
  const rows = (eventsQuery.data ?? []).filter((event) => filter === "Tous" || eventStatusLabels[event.status] === filter);
  const activeFilters = filter === "Tous" ? 0 : 1;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Agenda JEC"
        title="Gestion des événements"
        description="Validez les rencontres, suivez les inscriptions et assurez une expérience cohérente pour les Jécistes."
        action={
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#10294D] px-4 py-3 text-xs font-extrabold text-white hover:bg-[#17355E]">
            <Plus size={17} /> Créer un événement
          </button>
        }
      />
      <MobileFilterTrigger label="Filtrer les événements" onOpenFilters={() => setMobileFilterOpen(true)} filterCount={activeFilters} />
      <div className="mb-5 hidden gap-2 overflow-x-auto pb-1 lg:flex">
        {states.map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold ${filter === item ? "bg-[#10294D] text-white" : "border border-[#D7DEE7] bg-white text-[#5D697C]"}`}>
            {item}
          </button>
        ))}
      </div>
      {eventsQuery.isLoading && <p className="text-sm text-[#707787]">Chargement...</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        {rows.map((event) => (
          <AdminPanel key={event.id} className="overflow-hidden p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="rounded-lg bg-[#F5E4B9] px-2.5 py-1.5 text-[10px] font-extrabold text-[#634A13]">{new Date(event.startsAt).toLocaleDateString("fr-FR")}</span>
              <StatusBadge status={eventStatusLabels[event.status] ?? event.status} />
            </div>
            <h2 className="mt-4 font-editorial text-[27px] font-semibold leading-6 text-[#0D1B33]">{event.title}</h2>
            <p className="mt-2 text-xs text-[#687487]">{event.location ?? "Lieu à confirmer"}</p>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#657185]">
              <UsersRound size={15} />
              {event.registeredCount} inscrits · {event.authorName}
            </p>
            {event.status === "pending" && (
              <div className="mt-5 flex gap-2">
                <button onClick={() => decideEvent.mutate({ eventId: event.id, decision: "published" })} className="flex-1 rounded-lg bg-[#10294D] py-2.5 text-xs font-extrabold text-white hover:bg-[#17355E]">
                  <Check size={14} className="mr-1 inline" /> Valider
                </button>
                <button onClick={() => decideEvent.mutate({ eventId: event.id, decision: "cancelled", reason: "Événement non conforme." })} className="flex-1 rounded-lg border border-[#D6DDE7] py-2.5 text-xs font-extrabold text-[#536174] hover:bg-[#F5F7FA]">
                  Refuser
                </button>
              </div>
            )}
          </AdminPanel>
        ))}
      </div>
      {!eventsQuery.isLoading && rows.length === 0 && <AdminPanel className="mt-4 p-10 text-center"><p className="font-editorial text-2xl font-semibold text-[#14233B]">Aucun événement.</p></AdminPanel>}
      {mobileFilterOpen ? (
        <MobileFilterSheet title="Filtrer les événements" description="Affinez la file de gestion par statut de publication." onClose={() => setMobileFilterOpen(false)} onReset={() => setFilter("Tous")} resetDisabled={!activeFilters} applyLabel={`Afficher ${rows.length} événements`}>
          <div className="mt-5 space-y-2">
            {states.map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={`block w-full rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${filter === item ? "border-[#7A6FE0] bg-[#FFF6DF] text-[#2A2270]" : "border-[#E1E5EB] bg-white text-[#566378]"}`}>
                {item}
              </button>
            ))}
          </div>
        </MobileFilterSheet>
      ) : null}
      {showCreate && (
        <SimpleEventForm
          onClose={() => setShowCreate(false)}
          isPending={createEvent.isPending}
          onSubmit={(input) => createEvent.mutate(input)}
        />
      )}
    </div>
  );
}

function SimpleEventForm({ onClose, onSubmit, isPending }: { onClose: () => void; isPending: boolean; onSubmit: (input: { title: string; description: string; location?: string; startsAt: Date }) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || description.trim().length < 10 || !startsAt) {
      toast.error("Titre, date et description (10 caractères minimum) sont requis.");
      return;
    }
    onSubmit({ title: title.trim(), description: description.trim(), location: location.trim() || undefined, startsAt: new Date(startsAt) });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091830]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#0B1931]">Créer un événement</h2>
          <button onClick={onClose} className="rounded-full p-1 text-[#7E8490] hover:bg-[#F3F0EA]">
            <X size={20} />
          </button>
        </div>
        <p className="mt-1 text-xs text-[#707787]">Publié immédiatement (vous êtes administrateur).</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="admin-event-title">Titre</Label>
            <Input id="admin-event-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-event-date">Date et heure</Label>
            <Input id="admin-event-date" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-event-location">Lieu</Label>
            <Input id="admin-event-location" value={location} onChange={(event) => setLocation(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-event-description">Description</Label>
            <Textarea id="admin-event-description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Création..." : "Créer et publier"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AdminOpportunities() {
  const utils = trpc.useUtils();
  const [term, setTerm] = useState("");
  const opportunitiesQuery = trpc.admin.allOpportunities.useQuery();

  const decideOpportunity = trpc.admin.decideOpportunity.useMutation({
    onSuccess: () => {
      utils.admin.allOpportunities.invalidate();
      toast.success("Offre mise à jour.");
    },
    onError: (error) => toast.error(error.message),
  });

  const rows = useMemo(() => (opportunitiesQuery.data ?? []).filter((item) => `${item.title} ${item.organization ?? ""} ${item.authorName ?? ""}`.toLowerCase().includes(term.toLowerCase())), [opportunitiesQuery.data, term]);

  return (
    <div>
      <AdminPageHeader eyebrow="Emploi et mobilité" title="Gestion des opportunités" description="Supervisez les offres du réseau et leurs demandes de validation." />
      <MobileQueryBar value={term} onChange={setTerm} placeholder="Rechercher une offre…" />
      <AdminPanel className="hidden p-4 lg:block">
        <label className="relative block max-w-lg">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#748096]" />
          <input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Rechercher une offre, une entreprise…" className="h-11 w-full rounded-lg border border-[#D8DEE7] bg-[#FCFDFE] pl-10 pr-3 text-sm outline-none focus:border-[#17355E]" />
        </label>
      </AdminPanel>
      {opportunitiesQuery.isLoading && <p className="mt-4 text-sm text-[#707787]">Chargement...</p>}
      <div className="mt-5 space-y-3">
        {rows.map((item) => (
          <AdminPanel key={item.id} className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#EEF2F7] px-2.5 py-1 text-[10px] font-extrabold text-[#59677A]">{item.type}</span>
                  <StatusBadge status={opportunityStatusLabels[item.status] ?? item.status} />
                </div>
                <h2 className="mt-3 font-editorial text-[27px] font-semibold leading-6 text-[#0F1D35]">{item.title}</h2>
                <p className="mt-1 text-xs font-bold text-[#576376]">{item.organization ?? "—"} · proposée par {item.authorName}</p>
              </div>
              {item.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => decideOpportunity.mutate({ opportunityId: item.id, decision: "published" })} className="rounded-lg bg-[#10294D] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#17355E]">
                    Valider
                  </button>
                  <button onClick={() => decideOpportunity.mutate({ opportunityId: item.id, decision: "rejected", reason: "Offre non conforme." })} className="rounded-lg border border-[#D6DDE7] px-4 py-2.5 text-xs font-extrabold text-[#536174] hover:bg-[#F5F7FA]">
                    Refuser
                  </button>
                </div>
              )}
            </div>
          </AdminPanel>
        ))}
      </div>
      {!opportunitiesQuery.isLoading && rows.length === 0 && <AdminPanel className="mt-4 p-10 text-center"><p className="font-editorial text-2xl font-semibold text-[#14233B]">Aucune opportunité.</p></AdminPanel>}
    </div>
  );
}

export function AdminOrganization() {
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const unitsQuery = trpc.admin.organizationalUnits.useQuery({});

  const createUnit = trpc.admin.createOrganizationalUnit.useMutation({
    onSuccess: () => {
      utils.admin.organizationalUnits.invalidate();
      setShowCreate(false);
      toast.success("Structure créée.");
    },
    onError: (error) => toast.error(error.message),
  });

  const setActive = trpc.admin.setOrganizationalUnitActive.useMutation({
    onSuccess: () => utils.admin.organizationalUnits.invalidate(),
    onError: (error) => toast.error(error.message),
  });

  const levelLabels: Record<string, string> = { international: "International", regional: "Régional", national: "Mouvement national", local: "Structure locale", group: "Groupe / équipe" };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Architecture JECI"
        title="Gestion de l'organisation"
        description="Créez et administrez la hiérarchie configurable : international, régions, mouvements nationaux, structures locales, groupes."
        action={
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#10294D] px-4 py-3 text-xs font-extrabold text-white hover:bg-[#17355E]">
            <Plus size={17} /> Ajouter une structure
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(unitsQuery.data ?? []).map((unit) => (
          <AdminPanel key={unit.id} className="overflow-hidden">
            <div className={`h-2 ${unit.isActive ? "bg-[#10294D]" : "bg-[#D9DEE8]"}`} />
            <div className="p-5">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#3B32A0]">{unit.localTypeLabel || levelLabels[unit.level] || unit.level}</span>
              <p className="mt-1 font-editorial text-[26px] font-semibold leading-8 tracking-[-0.02em] text-[#10233E]">{unit.name}</p>
              <p className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#5D6B7F]">
                <UsersRound size={16} />
                {unit.memberCount} membres
              </p>
              <button onClick={() => setActive.mutate({ unitId: unit.id, isActive: !unit.isActive })} className="mt-4 text-xs font-extrabold text-[#1A3C68] hover:underline">
                {unit.isActive ? "Désactiver" : "Activer"}
              </button>
            </div>
          </AdminPanel>
        ))}
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091830]/40 p-4 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="font-editorial text-2xl font-semibold text-[#0B1931]">Ajouter une structure</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.target as HTMLFormElement;
                const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
                const level = (form.elements.namedItem("level") as HTMLSelectElement).value as "international" | "regional" | "national" | "local" | "group";
                if (!name) return;
                createUnit.mutate({ name, level });
              }}
              className="mt-4 space-y-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="unit-name">Nom</Label>
                <Input id="unit-name" name="name" placeholder="Ex. JEC Togo" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit-level">Niveau</Label>
                <select id="unit-level" name="level" defaultValue="national" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="international">International</option>
                  <option value="regional">Régional</option>
                  <option value="national">Mouvement national</option>
                  <option value="local">Structure locale</option>
                  <option value="group">Groupe / équipe</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={createUnit.isPending}>
                {createUnit.isPending ? "Création..." : "Créer"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminMentoring() {
  const mentorshipQuery = trpc.admin.allMentorship.useQuery();
  const rows = mentorshipQuery.data ?? [];
  const metrics = [
    { label: "Demandes totales", value: String(rows.length) },
    { label: "En attente", value: String(rows.filter((r) => r.status === "pending").length) },
    { label: "Acceptées", value: String(rows.filter((r) => r.status === "accepted").length) },
  ];
  return (
    <div>
      <AdminPageHeader eyebrow="Programme d'entraide" title="Gestion du mentorat" description="Suivez les demandes de mise en relation entre membres." />
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <AdminPanel key={metric.label} className="p-5">
            <p className="text-xs font-bold text-[#667386]">{metric.label}</p>
            <p className="mt-2 font-editorial text-[48px] font-semibold leading-none text-[#10294D]">{metric.value}</p>
          </AdminPanel>
        ))}
      </div>
      <AdminPanel className="mt-6 overflow-hidden">
        <div className="border-b border-[#E1E5EB] px-5 py-4">
          <h2 className="font-editorial text-[28px] font-semibold text-[#10223C]">Demandes de mentorat</h2>
        </div>
        <div className="divide-y divide-[#E5E8ED]">
          {rows.map((request) => (
            <div key={request.id} className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold text-[#1D2B41]">
                  {request.menteeName} <span className="font-normal text-[#788395]">→</span> {request.mentorName}
                </p>
                <p className="mt-1 text-xs text-[#6A7688]">Sujet : {request.topic}</p>
              </div>
              <StatusBadge status={request.status === "pending" ? "En attente" : request.status === "accepted" ? "Actif" : request.status} />
            </div>
          ))}
          {rows.length === 0 && <p className="p-5 text-xs text-[#728094]">Aucune demande de mentorat pour l'instant.</p>}
        </div>
      </AdminPanel>
    </div>
  );
}

const projectStatusLabels: Record<string, string> = { idea: "Idée", in_preparation: "En préparation", in_progress: "En cours", completed: "Terminé", suspended: "Suspendu" };

export function AdminProjects() {
  const utils = trpc.useUtils();
  const [pendingArchive, setPendingArchive] = useState<{ id: number; name: string } | null>(null);
  const projectsQuery = trpc.admin.allProjects.useQuery();

  const archiveProject = trpc.admin.archiveProject.useMutation({
    onSuccess: () => {
      utils.admin.allProjects.invalidate();
      setPendingArchive(null);
      toast.success("Espace archivé.");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div>
      <AdminPageHeader eyebrow="Espaces collaboratifs" title="Gestion des projets" description="Suivez les collectifs créés par les membres et retirez ceux non conformes." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(projectsQuery.data ?? []).map((project) => (
          <AdminPanel key={project.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full bg-[#EEF2F7] px-2.5 py-1 text-[10px] font-extrabold text-[#5B697D]">{project.visibility}</span>
              <StatusBadge status={projectStatusLabels[project.status] ?? project.status} />
            </div>
            <h2 className="mt-4 font-editorial text-[30px] font-semibold leading-6 text-[#0F1D35]">{project.name}</h2>
            <p className="mt-2 text-xs text-[#677386]">Créé par {project.ownerName}</p>
            {project.status !== "suspended" && (
              <button onClick={() => setPendingArchive(project)} className="mt-4 text-xs font-extrabold text-[#9E323A] hover:underline">
                Archiver l'espace
              </button>
            )}
          </AdminPanel>
        ))}
      </div>
      {(projectsQuery.data ?? []).length === 0 && <AdminPanel className="mt-4 p-10 text-center"><p className="font-editorial text-2xl font-semibold text-[#14233B]">Aucun espace pour l'instant.</p></AdminPanel>}
      <AlertDialog open={pendingArchive !== null} onOpenChange={(open) => !open && setPendingArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver « {pendingArchive?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>L'espace ne sera plus visible pour ses membres. Cette action est journalisée.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingArchive && archiveProject.mutate({ projectId: pendingArchive.id, reason: "Contenu non conforme à la charte." })} className="bg-[#9E323A] hover:bg-[#87262E]">
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
