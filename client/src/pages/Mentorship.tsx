/** JECI mentoring: mentorat réel, branché sur server/routers/mentorship.ts. */
import { useState } from "react";
import { CalendarClock, CheckCircle2, ChevronRight, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, PageIntro, Panel, ProfileLink } from "@/components/UiPrimitives";
import { MobileFilterSheet, MobileQueryBar } from "@/components/MobileQueryControls";
import { storageUrl } from "@/lib/storageUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type Mentor = { userId: number; name: string | null; headline: string | null; jobTitle?: string | null; organization: string | null; country?: string | null; mentorTopics: string[] | null; languages?: string[] | null; avatarStorageKey?: string | null };

export default function Mentorship() {
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const utils = trpc.useUtils();

  const [domain, setDomain] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [search, setSearch] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const filters = { domain: domain || undefined, country: country || undefined, language: language || undefined, search: search || undefined };
  const activeFilters = [domain, country, language, search].filter(Boolean).length;
  const resetFilters = () => {
    setDomain("");
    setCountry("");
    setLanguage("");
    setSearch("");
  };

  const mentorsQuery = trpc.mentorship.listMentors.useQuery(filters);
  const myAsMenteeQuery = trpc.mentorship.myRequestsAsMentee.useQuery(undefined, { enabled: isVerified });
  const myAsMentorQuery = trpc.mentorship.myRequestsAsMentor.useQuery(undefined, { enabled: isVerified });
  const overviewQuery = trpc.account.overview.useQuery();
  const isMentor = overviewQuery.data?.profile?.mentorAvailable ?? false;

  const [requestTarget, setRequestTarget] = useState<Mentor | null>(null);

  const requestMentorship = trpc.mentorship.request.useMutation({
    onSuccess: () => {
      setRequestTarget(null);
      utils.mentorship.myRequestsAsMentee.invalidate();
      toast.success("Votre demande de mentorat a été envoyée.");
    },
    onError: (error) => toast.error(error.message),
  });

  const respondMutation = trpc.mentorship.respond.useMutation({
    onSuccess: () => {
      utils.mentorship.myRequestsAsMentor.invalidate();
      toast.success("Réponse enregistrée.");
    },
    onError: (error) => toast.error(error.message),
  });

  const becomeMentor = trpc.account.updateProfile.useMutation({
    onSuccess: () => {
      utils.account.overview.invalidate();
      utils.mentorship.listMentors.invalidate();
      toast.success("Vous êtes désormais visible comme mentor disponible.");
    },
    onError: (error) => toast.error(error.message),
  });

  const mentors = (mentorsQuery.data ?? []) as Mentor[];

  const handleAskMentorship = (mentor: Mentor) => {
    if (!isVerified) {
      toast.info("Vérifiez votre compte pour solliciter un mentor.");
      return;
    }
    setRequestTarget(mentor);
  };

  const handleBecomeMentor = () => {
    if (!isVerified) {
      toast.info("Vérifiez votre compte pour devenir mentor.");
      return;
    }
    becomeMentor.mutate({ mentorAvailable: true });
  };

  return (
    <div>
      <PageIntro eyebrow="Mentorat JEC" title="Faire grandir les trajectoires, ensemble." description="Un accompagnement simple et exigeant, construit sur la confiance entre Jécistes et la force du vécu partagé." />

      <section className="overflow-hidden rounded-2xl border border-[#E1DDD5] bg-[#102846] shadow-[0_8px_25px_rgba(10,32,63,0.1)]">
        <div className="p-7 text-white sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#F5B37A]">
            <Sparkles size={14} /> Programme ouvert
          </span>
          <h1 className="mt-5 font-editorial text-[38px] font-semibold leading-[0.95] tracking-[-0.04em] sm:text-[46px]">Un échange peut changer votre prochaine étape.</h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-[#D8DFE9]">Clarifier un projet, prendre confiance dans une décision, entrer dans un nouveau secteur : le mentorat transforme l'expérience des Jécistes en accélérateur collectif.</p>
          <div className="mt-7 flex flex-wrap gap-5 text-xs text-[#EDF1F7]">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={17} className="text-[#6C5CE0]" /> {mentors.length} mentors disponibles
            </span>
          </div>
        </div>
      </section>

      {isVerified && (myAsMenteeQuery.data?.length ?? 0) > 0 && (
        <section className="mt-7">
          <h2 className="font-editorial text-[28px] font-semibold tracking-[-0.03em] text-[#0B1931]">Mes demandes envoyées</h2>
          <div className="mt-3 space-y-2">
            {myAsMenteeQuery.data?.map((request) => (
              <Panel key={request.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-bold text-[#162033]">{request.topic}</p>
                  <p className="text-xs text-[#717784]">Mentor : {request.mentorName}</p>
                </div>
                <StatusBadge status={request.status} />
              </Panel>
            ))}
          </div>
        </section>
      )}

      {isVerified && (myAsMentorQuery.data?.length ?? 0) > 0 && (
        <section className="mt-7">
          <h2 className="font-editorial text-[28px] font-semibold tracking-[-0.03em] text-[#0B1931]">Demandes reçues</h2>
          <div className="mt-3 space-y-2">
            {myAsMentorQuery.data?.map((request) => (
              <Panel key={request.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#162033]">{request.topic}</p>
                  <p className="text-xs text-[#717784]">De : {request.menteeName}</p>
                </div>
                {request.status === "pending" ? (
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => respondMutation.mutate({ requestId: request.id, decision: "accepted" })} className="rounded-lg bg-black px-3 py-1.5 text-[11px] font-extrabold text-white">
                      Accepter
                    </button>
                    <button onClick={() => respondMutation.mutate({ requestId: request.id, decision: "declined" })} className="rounded-lg border border-[#D9D4CC] px-3 py-1.5 text-[11px] font-bold text-[#445064]">
                      Refuser
                    </button>
                  </div>
                ) : (
                  <StatusBadge status={request.status} />
                )}
              </Panel>
            ))}
          </div>
        </section>
      )}

      <section className="mt-7">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#967025]">Pour vous</p>
            <h2 className="mt-1 font-editorial text-[34px] font-semibold tracking-[-0.035em] text-[#0B1931]">Des profils à rencontrer</h2>
          </div>
        </div>

        {/* Filtres du mentorat (cahier §19) : domaine, pays, langue, recherche libre. */}
        <MobileQueryBar value={search} onChange={setSearch} placeholder="Poste, organisation…" onOpenFilters={() => setMobileFilterOpen(true)} filterCount={activeFilters - (search ? 1 : 0)} filterLabel="Filtrer les mentors" />
        <div className="mt-4 hidden gap-2 sm:grid-cols-2 lg:grid lg:grid-cols-4">
          <input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="Domaine (ex. leadership)" className="h-10 rounded-lg border border-[#DDD8D0] bg-white px-3 text-xs outline-none focus:border-[#0A1931]" />
          <input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Pays" className="h-10 rounded-lg border border-[#DDD8D0] bg-white px-3 text-xs outline-none focus:border-[#0A1931]" />
          <input value={language} onChange={(event) => setLanguage(event.target.value)} placeholder="Langue" className="h-10 rounded-lg border border-[#DDD8D0] bg-white px-3 text-xs outline-none focus:border-[#0A1931]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Poste, organisation…" className="h-10 rounded-lg border border-[#DDD8D0] bg-white px-3 text-xs outline-none focus:border-[#0A1931]" />
        </div>
        {activeFilters > 0 && (
          <button onClick={resetFilters} className="mt-2 hidden text-[11px] font-bold text-[#5B4FE0] underline lg:inline-block">
            Réinitialiser les filtres
          </button>
        )}

        {mentorsQuery.isLoading && <p className="mt-4 text-sm text-[#707787]">Chargement des mentors...</p>}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {mentors.map((mentor) => (
            <Panel key={mentor.userId} className="p-5">
              <div className="flex gap-3">
                <ProfileLink userId={mentor.userId}>
                  <Avatar alt={mentor.name ?? "Mentor"} src={storageUrl(mentor.avatarStorageKey)} size="lg" />
                </ProfileLink>
                <div>
                  <ProfileLink userId={mentor.userId} className="block font-editorial text-[25px] font-semibold leading-5 text-[#0C1B33] hover:underline">
                    {mentor.name}
                  </ProfileLink>
                  <p className="mt-1 text-[11px] leading-4 text-[#6B7480]">{mentor.headline ?? mentor.organization ?? "JECI"}</p>
                </div>
              </div>
              {mentor.mentorTopics && mentor.mentorTopics.length > 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#5E6A79]">
                  <CalendarClock size={15} className="text-[#9A7327]" />
                  {mentor.mentorTopics.join(", ")}
                </p>
              )}
              <button onClick={() => handleAskMentorship(mentor)} className="mt-5 w-full rounded-lg bg-black py-2.5 text-[11px] font-extrabold text-white transition hover:bg-[#17233B]">
                Demander un mentorat
              </button>
            </Panel>
          ))}
        </div>
        {!mentorsQuery.isLoading && mentors.length === 0 && (
          <Panel className="mt-4 p-10 text-center">
            <p className="font-editorial text-2xl font-semibold text-[#10213D]">Aucun mentor disponible pour l'instant.</p>
          </Panel>
        )}
      </section>

      {!isMentor && (
        <Panel className="mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#596575]">
            <strong className="font-editorial text-[22px] text-[#112039]">Déjà expérimenté ?</strong>
            <br />
            Partagez ce que vous auriez aimé recevoir à l'entrée dans votre vie professionnelle.
          </p>
          <button onClick={handleBecomeMentor} disabled={becomeMentor.isPending} className="inline-flex items-center gap-1 text-xs font-extrabold text-[#8B661D] hover:gap-2">
            Devenir mentor <ChevronRight size={16} />
          </button>
        </Panel>
      )}

      {requestTarget && (
        <RequestMentorshipModal
          mentor={requestTarget}
          isPending={requestMentorship.isPending}
          onClose={() => setRequestTarget(null)}
          onSubmit={(topic, message) => requestMentorship.mutate({ mentorId: requestTarget.userId, topic, message })}
        />
      )}
      {mobileFilterOpen ? (
        <MobileFilterSheet title="Filtrer les mentors" description="Trouvez le mentor le plus adapté à votre situation." onClose={() => setMobileFilterOpen(false)} onReset={resetFilters} resetDisabled={!activeFilters} applyLabel={`Afficher ${mentors.length} mentor${mentors.length > 1 ? "s" : ""}`}>
          <div className="mt-5 grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mentor-filter-domain">Domaine</Label>
              <Input id="mentor-filter-domain" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="Ex. leadership" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mentor-filter-country">Pays</Label>
              <Input id="mentor-filter-country" value={country} onChange={(event) => setCountry(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mentor-filter-language">Langue</Label>
              <Input id="mentor-filter-language" value={language} onChange={(event) => setLanguage(event.target.value)} />
            </div>
          </div>
        </MobileFilterSheet>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = { pending: "En attente", accepted: "Acceptée", declined: "Refusée", completed: "Terminée", cancelled: "Annulée" };
  const colors: Record<string, string> = { pending: "bg-[#FBE0C8] text-[#8A3F10]", accepted: "bg-[#DFF3EA] text-[#1F6A54]", declined: "bg-[#F8DEDE] text-[#8A2C2C]", completed: "bg-[#EEF1F5] text-[#435873]", cancelled: "bg-[#EEF1F5] text-[#435873]" };
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${colors[status] ?? "bg-[#EEF1F5] text-[#435873]"}`}>{labels[status] ?? status}</span>;
}

function RequestMentorshipModal({ mentor, onClose, onSubmit, isPending }: { mentor: Mentor; onClose: () => void; onSubmit: (topic: string, message?: string) => void; isPending: boolean }) {
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (topic.trim().length < 3) {
      toast.error("Indiquez un sujet (3 caractères minimum).");
      return;
    }
    onSubmit(topic.trim(), message.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091830]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#0B1931]">Demander un mentorat à {mentor.name}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-[#7E8490] hover:bg-[#F3F0EA]">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="mentorship-topic">Sujet</Label>
            <Input id="mentorship-topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Ex. Transition vers le conseil" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mentorship-message">Message (optionnel)</Label>
            <Textarea id="mentorship-message" rows={4} value={message} onChange={(event) => setMessage(event.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Envoi..." : "Envoyer la demande"}
          </Button>
        </form>
      </div>
    </div>
  );
}
