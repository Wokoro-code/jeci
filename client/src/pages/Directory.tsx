/** JECI — Annuaire mondial : recherche de membres, branché sur server/routers/account.ts et network.ts. */
import { useMemo, useState } from "react";
import { MapPin, Search, SlidersHorizontal, UserCheck, UserPlus, Clock } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Avatar, JecStatusBadge, PageIntro, Panel, ProfileLink } from "@/components/UiPrimitives";
import { MobileFilterSheet, MobileQueryBar } from "@/components/MobileQueryControls";
import { storageUrl } from "@/lib/storageUrl";
import { jecStatusColors, jecStatusLabels, jecStatusOptions, type JecStatus } from "@/lib/jecStatus";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function Directory() {
  const [location] = useLocation();
  const preset = new URLSearchParams(location.split("?")[1] ?? "").get("q") ?? "";
  const [search, setSearch] = useState(preset);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [jecStatus, setJecStatus] = useState<JecStatus | null>(null);
  const [country, setCountry] = useState("");
  const [mentorOnly, setMentorOnly] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const utils = trpc.useUtils();

  const unitsQuery = trpc.account.organizationalUnits.useQuery({});
  const directoryQuery = trpc.account.directory.useQuery({ search: search || undefined, unitId: unitId ?? undefined, jecStatus: jecStatus ?? undefined, country: country || undefined, mentorOnly: mentorOnly || undefined, limit: 48 });
  const connectionsQuery = trpc.network.list.useQuery();
  const pendingQuery = trpc.network.pending.useQuery();

  const statusFor = useMemo(() => {
    const map = new Map<number, "connected" | "pending">();
    connectionsQuery.data?.forEach((connection) => map.set(connection.otherUserId, "connected"));
    pendingQuery.data?.outgoing.forEach((request) => map.set(request.otherUserId, "pending"));
    return map;
  }, [connectionsQuery.data, pendingQuery.data]);

  const sendRequest = trpc.network.sendRequest.useMutation({
    onSuccess: (_data, variables) => {
      utils.network.pending.invalidate();
      toast.success("Invitation envoyée.");
      void variables;
    },
    onError: (error) => toast.error(error.message),
  });

  const unitOptions = unitsQuery.data ?? [];
  const visible = directoryQuery.data?.items ?? [];
  const resetFilters = () => {
    setSearch("");
    setUnitId(null);
    setJecStatus(null);
    setCountry("");
    setMentorOnly(false);
  };
  const activeFilters = (unitId ? 1 : 0) + (jecStatus ? 1 : 0) + (country ? 1 : 0) + (mentorOnly ? 1 : 0);


  const handleConnect = (targetUserId: number) => {
    if (!isVerified) {
      toast.info("Vérifiez votre compte pour envoyer des invitations de connexion.");
      return;
    }
    sendRequest.mutate({ userId: targetUserId });
  };

  return (
    <div>
      <PageIntro eyebrow="Annuaire JEC" title="Retrouver les Jécistes du monde entier." description="Recherchez, retrouvez et activez les Jécistes et anciens Jécistes qui peuvent enrichir vos projets et vos trajectoires." />
      <MobileQueryBar value={search} onChange={setSearch} placeholder="Nom, métier ou organisation…" onOpenFilters={() => setMobileFilterOpen(true)} filterCount={activeFilters} filterLabel="Filtrer l'annuaire" />
      <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
        <DesktopFilters unitOptions={unitOptions} unitId={unitId} setUnitId={setUnitId} jecStatus={jecStatus} setJecStatus={setJecStatus} country={country} setCountry={setCountry} mentorOnly={mentorOnly} setMentorOnly={setMentorOnly} />
        <section>
          <div className="relative hidden lg:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#717985]" size={20} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, métier ou organisation…" className="h-12 w-full rounded-xl border border-[#DDD8D0] bg-white pl-12 pr-4 text-sm outline-none transition focus:border-[#0A1931] focus:ring-4 focus:ring-[#E1E8F2]" />
          </div>
          <p className="text-xs text-[#697382] lg:mt-4">
            <strong className="text-[#1B2941]">{visible.length} membre{visible.length > 1 ? "s" : ""}</strong> correspondent à votre recherche
          </p>
          {directoryQuery.isLoading && <p className="mt-4 text-sm text-[#707787]">Chargement de l'annuaire...</p>}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((person) => {
              const status = statusFor.get(person.userId);
              return (
                <Panel key={person.userId} className="p-4 transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(10,32,63,0.09)]">
                  <div className="flex items-start justify-between gap-2">
                    <ProfileLink userId={person.userId}>
                      <Avatar alt={person.name ?? "Membre"} src={storageUrl(person.avatarStorageKey)} />
                    </ProfileLink>
                    <button
                      onClick={() => (status ? undefined : handleConnect(person.userId))}
                      disabled={Boolean(status)}
                      className={`grid h-8 w-8 place-items-center rounded-full border transition ${status === "connected" ? "border-[#1F6A54] bg-[#DFF3EA] text-[#1F6A54]" : status === "pending" ? "border-[#F0A366] bg-[#FBE0C8] text-[#8A3F10]" : "border-[#142039] hover:bg-[#142039] hover:text-white"}`}
                      aria-label={status === "connected" ? "Déjà connecté" : status === "pending" ? "Invitation en attente" : `Se connecter à ${person.name}`}
                    >
                      {status === "connected" ? <UserCheck size={16} /> : status === "pending" ? <Clock size={16} /> : <UserPlus size={16} />}
                    </button>
                  </div>
                  <ProfileLink userId={person.userId} className="mt-3 block font-editorial text-[24px] font-semibold leading-5 text-[#0B1931] hover:underline">
                    {person.name}
                  </ProfileLink>
                  <div className="mt-1.5">
                    <JecStatusBadge status={person.jecStatus} />
                  </div>
                  <p className="mt-2 text-xs font-bold text-[#4B5666]">{person.jobTitle ?? "—"}</p>
                  <p className="mt-1 text-[11px] text-[#78808B]">
                    {person.organization ?? "JECI"} {person.unitName ? `· ${person.unitName}` : ""}
                  </p>
                  {person.city && (
                    <p className="mt-3 flex items-center gap-1 text-[11px] text-[#707986]">
                      <MapPin size={14} />
                      {person.city}{person.country ? `, ${person.country}` : ""}
                    </p>
                  )}
                  {person.mentorAvailable && <span className="mt-3 inline-block rounded-full bg-[#F1F2F5] px-2 py-1 text-[10px] font-bold text-[#586272]">Mentor disponible</span>}
                </Panel>
              );
            })}
          </div>
          {!directoryQuery.isLoading && visible.length === 0 ? (
            <Panel className="mt-4 p-10 text-center">
              <p className="font-editorial text-2xl font-semibold text-[#13223A]">Élargissez votre recherche.</p>
              <button onClick={resetFilters} className="mt-2 text-xs font-bold text-[#966D20] underline">
                Effacer les filtres
              </button>
            </Panel>
          ) : null}
        </section>
      </div>
      {mobileFilterOpen ? (
        <MobileFilterSheet title="Filtrer l'annuaire" description="Affinez les profils que vous souhaitez rencontrer." onClose={() => setMobileFilterOpen(false)} onReset={resetFilters} resetDisabled={!activeFilters} applyLabel={`Afficher ${visible.length} membre${visible.length > 1 ? "s" : ""}`}>
          <FilterOptions unitOptions={unitOptions} unitId={unitId} setUnitId={setUnitId} jecStatus={jecStatus} setJecStatus={setJecStatus} country={country} setCountry={setCountry} mentorOnly={mentorOnly} setMentorOnly={setMentorOnly} />
        </MobileFilterSheet>
      ) : null}
    </div>
  );
}

type UnitOption = { id: number; name: string; level: string };
type FilterProps = { unitOptions: UnitOption[]; unitId: number | null; setUnitId: (value: number | null) => void; jecStatus: JecStatus | null; setJecStatus: (value: JecStatus | null) => void; country: string; setCountry: (value: string) => void; mentorOnly: boolean; setMentorOnly: (value: boolean) => void };

function FilterOptions({ unitOptions, unitId, setUnitId, jecStatus, setJecStatus, country, setCountry, mentorOnly, setMentorOnly }: FilterProps) {
  return (
    <>
      <div className="mt-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#3B32A0]">Statut JEC</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button onClick={() => setJecStatus(null)} className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${jecStatus === null ? "bg-[#142039] text-white" : "bg-[#F1F2F5] text-[#586272] hover:bg-[#E7E9ED]"}`}>
            Tous
          </button>
          {jecStatusOptions.map((value) => {
            const colors = jecStatusColors[value];
            const active = jecStatus === value;
            return (
              <button key={value} onClick={() => setJecStatus(active ? null : value)} className="rounded-full px-2.5 py-1 text-[11px] font-bold transition" style={active ? { backgroundColor: colors.dot, color: "#fff" } : { backgroundColor: colors.bg, color: colors.text }}>
                {jecStatusLabels[value]}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#3B32A0]">Structure</p>
        <div className="mt-2 space-y-1">
          <button onClick={() => setUnitId(null)} className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${unitId === null ? "bg-[#E3E0FA] text-[#2A2270]" : "text-[#636D7C] hover:bg-[#F6F2EB]"}`}>
            Toutes les structures
          </button>
          {unitOptions.map((unit) => (
            <button key={unit.id} onClick={() => setUnitId(unit.id)} className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${unitId === unit.id ? "bg-[#E3E0FA] text-[#2A2270]" : "text-[#636D7C] hover:bg-[#F6F2EB]"}`}>
              {unit.name}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 border-t border-[#EEE9E0] pt-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#3B32A0]">Pays</p>
        <input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Ex. Togo" className="mt-2 h-9 w-full rounded-lg border border-[#DDD8D0] bg-white px-3 text-xs outline-none focus:border-[#0A1931]" />
      </div>
      <div className="mt-6 border-t border-[#EEE9E0] pt-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#3B32A0]">Disponibilité</p>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-[#687080]">
          <input type="checkbox" checked={mentorOnly} onChange={(event) => setMentorOnly(event.target.checked)} className="accent-[#182943]" /> Mentors disponibles uniquement
        </label>
      </div>
    </>
  );
}

function DesktopFilters(props: FilterProps) {
  return (
    <Panel className="hidden h-fit p-5 lg:block">
      <div className="flex items-center gap-2 text-sm font-bold text-[#142039]">
        <SlidersHorizontal size={18} /> Affiner la recherche
      </div>
      <FilterOptions {...props} />
    </Panel>
  );
}
