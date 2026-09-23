/** JECI events: agenda réel, branché sur server/routers/events.ts. */
import { useMemo, useState } from "react";
import { CalendarCheck, Clock3, MapPin, Search, UsersRound, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { PageIntro, Panel } from "@/components/UiPrimitives";
import { MobileQueryBar } from "@/components/MobileQueryControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { storageUrl } from "@/lib/storageUrl";
import { uploadFile } from "@/lib/upload";

export const eventTypeLabels: Record<string, string> = {
  meeting: "Rencontre",
  camp: "Camp",
  training: "Formation",
  conference: "Conférence",
  assembly: "Assemblée",
  gathering: "Réunion",
  webinar: "Webinaire",
  social: "Activité sociale",
  international_meeting: "Rencontre internationale",
};
const eventTypes = Object.keys(eventTypeLabels) as (keyof typeof eventTypeLabels)[];

export default function Events() {
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const [term, setTerm] = useState("");
  const [type, setType] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const eventsQuery = trpc.events.listPublished.useQuery({ type: (type as never) ?? undefined });
  const createEvent = trpc.events.create.useMutation({
    onSuccess: () => {
      setShowCreate(false);
      toast.success("Votre événement a été soumis pour validation par l'administration.");
    },
    onError: (error) => toast.error(error.message),
  });

  const visible = useMemo(() => {
    const list = eventsQuery.data ?? [];
    if (!term) return list;
    return list.filter((event) => `${event.title} ${event.location ?? ""}`.toLowerCase().includes(term.toLowerCase()));
  }, [eventsQuery.data, term]);

  const handleProposeClick = () => {
    if (!isVerified) {
      toast.info("Vérifiez votre compte pour proposer un événement.");
      return;
    }
    setShowCreate(true);
  };

  return (
    <div>
      <PageIntro
        eyebrow="Agenda communautaire"
        title="Événements JECI"
        description="Des rendez-vous choisis pour faire grandir les échanges, les projets et les trajectoires de notre réseau."
        action={
          <button onClick={handleProposeClick} className="rounded-full bg-black px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#17233B]">
            Proposer un événement
          </button>
        }
      />
      <MobileQueryBar value={term} onChange={setTerm} placeholder="Rechercher un événement…" />
      <div className="mb-3 hidden gap-5 xl:grid xl:grid-cols-[1fr_310px]">
        <Panel className="p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#767D89]" size={20} />
            <input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Rechercher un événement…" className="h-11 w-full rounded-lg border border-[#DDD9D3] bg-[#FEFDFB] pl-11 pr-4 text-sm outline-none transition focus:border-[#12233E] focus:ring-4 focus:ring-[#E0E8F2]" />
          </div>
        </Panel>
        <Panel className="flex items-center gap-3 p-3.5">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#F7E4BB] text-[#745116]">
            <CalendarCheck size={20} />
          </span>
          <p className="text-xs leading-5 text-[#626B79]">
            <strong className="block text-sm text-[#182239]">{visible.length} rendez-vous à venir</strong>Votre réseau vous attend.
          </p>
        </Panel>
      </div>

      {/* Filtre par type d'événement (cahier §22) : une seule ligne défilante, cohérent avec les onglets de la fiche communauté. */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setType(null)} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition ${type === null ? "bg-[#E3E0FA] text-[#3B32A0]" : "bg-white text-[#636D7C] hover:bg-[#F6F2EB]"}`}>
          Tous
        </button>
        {eventTypes.map((value) => (
          <button key={value} onClick={() => setType(value)} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition ${type === value ? "bg-[#E3E0FA] text-[#3B32A0]" : "bg-white text-[#636D7C] hover:bg-[#F6F2EB]"}`}>
            {eventTypeLabels[value]}
          </button>
        ))}
      </div>

      {eventsQuery.isLoading && <p className="text-sm text-[#707787]">Chargement des événements...</p>}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((event, index) => {
          const startsAt = new Date(event.startsAt);
          return (
            <article key={event.id} className="overflow-hidden rounded-xl border border-[#E2DED7] bg-white shadow-[0_5px_16px_rgba(10,32,63,0.05)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(10,32,63,0.11)]">
              <div className="relative flex h-28 items-center justify-center bg-[#F1F3F8]" style={event.imageStorageKey ? { backgroundImage: `url(${storageUrl(event.imageStorageKey)})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                <div className="rounded-lg border border-white/70 bg-white/90 px-4 py-2 text-center shadow-sm">
                  <p className="text-[10px] font-extrabold tracking-[0.1em] text-[#13233C]">{startsAt.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()}</p>
                  <p className="font-editorial text-[25px] font-bold leading-5 text-[#13233C]">{startsAt.getDate()}</p>
                </div>
                {event.isOnline && <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-extrabold text-[#4C5563]">En ligne</span>}
              </div>
              <div className="p-5">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#977123]">{eventTypeLabels[event.type] ?? event.type}</span>
                <h3 className="mt-1 font-editorial text-[27px] font-semibold leading-[1] tracking-[-0.03em] text-[#0B1931]">{event.title}</h3>
                <div className="mt-4 space-y-1.5 text-xs text-[#6A7280]">
                  <p className="flex gap-2">
                    <MapPin size={16} className="shrink-0" />
                    {event.location ?? (event.isOnline ? "En ligne" : "Lieu à confirmer")}
                  </p>
                  <p className="flex gap-2">
                    <Clock3 size={16} className="shrink-0" />
                    {startsAt.toLocaleString("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="flex gap-2">
                    <UsersRound size={16} className="shrink-0" />
                    {event.registeredCount} inscrits
                  </p>
                </div>
                <Link href={`/evenements/${event.id}`} className={`mt-5 block rounded-lg py-3 text-center text-xs font-extrabold transition ${index === 0 ? "bg-black text-white hover:bg-[#17233B]" : "border-2 border-[#111E33] text-[#111E33] hover:bg-[#F5F1EA]"}`}>
                  Voir l'événement
                </Link>
                {event.registrationUrl && (
                  <a href={event.registrationUrl} target="_blank" rel="noreferrer" className="mt-2 block text-center text-[11px] font-bold text-[#5B4FE0] underline">
                    Lien d'inscription externe
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!eventsQuery.isLoading && visible.length === 0 ? (
        <Panel className="mt-4 p-10 text-center">
          <p className="font-editorial text-2xl font-semibold text-[#10213D]">Aucun événement publié pour l'instant.</p>
        </Panel>
      ) : null}
      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} isPending={createEvent.isPending} onSubmit={(input) => createEvent.mutate(input)} />}
    </div>
  );
}

export function CreateEventModal({
  onClose,
  onSubmit,
  isPending,
}: {
  onClose: () => void;
  isPending: boolean;
  onSubmit: (input: { title: string; description: string; type?: "meeting" | "camp" | "training" | "conference" | "assembly" | "gathering" | "webinar" | "social" | "international_meeting"; location?: string; isOnline?: boolean; startsAt: Date; capacity?: number; imageStorageKey?: string; registrationUrl?: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"meeting" | "camp" | "training" | "conference" | "assembly" | "gathering" | "webinar" | "social" | "international_meeting">("meeting");
  const [location, setLocation] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [capacity, setCapacity] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
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
    if (!title.trim() || description.trim().length < 10 || !startsAt) {
      toast.error("Titre, date et description (10 caractères minimum) sont requis.");
      return;
    }
    onSubmit({ title: title.trim(), description: description.trim(), type, location: location.trim() || undefined, isOnline, startsAt: new Date(startsAt), capacity: capacity ? Number(capacity) : undefined, imageStorageKey, registrationUrl: registrationUrl.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091830]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#0B1931]">Proposer un événement</h2>
          <button onClick={onClose} className="rounded-full p-1 text-[#7E8490] hover:bg-[#F3F0EA]">
            <X size={20} />
          </button>
        </div>
        <p className="mt-1 text-xs text-[#707787]">Votre événement sera visible après validation par un administrateur.</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="event-title">Titre</Label>
            <Input id="event-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-type">Type</Label>
            <select id="event-type" value={type} onChange={(event) => setType(event.target.value as typeof type)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              {eventTypes.map((value) => (
                <option key={value} value={value}>
                  {eventTypeLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-date">Date et heure</Label>
              <Input id="event-date" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-capacity">Capacité (optionnel)</Label>
              <Input id="event-capacity" type="number" min={1} value={capacity} onChange={(event) => setCapacity(event.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-location">Lieu</Label>
            <Input id="event-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder={isOnline ? "Lien de connexion" : "Adresse"} />
          </div>
          <label className="flex items-center gap-2 text-xs text-[#687080]">
            <input type="checkbox" checked={isOnline} onChange={(event) => setIsOnline(event.target.checked)} className="accent-[#182943]" /> Événement en ligne
          </label>
          <div className="space-y-1.5">
            <Label htmlFor="event-description">Description</Label>
            <Textarea id="event-description" rows={5} value={description} onChange={(event) => setDescription(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-registration-url">Lien d'inscription externe (optionnel)</Label>
            <Input id="event-registration-url" type="url" placeholder="https://…" value={registrationUrl} onChange={(event) => setRegistrationUrl(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Image (optionnel)</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#D9D4CC] py-3 text-xs font-bold text-[#536174] hover:bg-[#F7F4EE]">
              {uploadingImage ? "Envoi..." : imageStorageKey ? "Image ajoutée ✓" : "Ajouter une image"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageChange} disabled={uploadingImage} />
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Envoi..." : "Soumettre pour validation"}
          </Button>
        </form>
      </div>
    </div>
  );
}
