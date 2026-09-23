/** JECI — Mon profil : profil professionnel et « Mon parcours JEC », branché sur server/routers/account.ts. */
import { useMemo, useState } from "react";
import { BadgeCheck, BriefcaseBusiness, Camera, Edit3, MapPin, Plus, Trash2, UsersRound, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, JecStatusBadge, PageIntro, Panel } from "@/components/UiPrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { storageUrl } from "@/lib/storageUrl";
import { uploadFile } from "@/lib/upload";
import { jecStatusLabels, type JecStatus } from "@/lib/jecStatus";

function formatRelativeTime(date: string | Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const hours = Math.round(diffMs / 3600000);
  if (hours < 1) return "à l'instant";
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.round(hours / 24)} j`;
}

export default function Profile() {
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [addingExperience, setAddingExperience] = useState(false);
  const [addingProfessional, setAddingProfessional] = useState(false);

  const overviewQuery = trpc.account.overview.useQuery();
  const connectionsQuery = trpc.network.list.useQuery();
  const unitsQuery = trpc.account.organizationalUnits.useQuery({});
  const feedQuery = trpc.feed.list.useQuery({});

  const profile = overviewQuery.data?.profile;
  const experiences = overviewQuery.data?.experiences ?? [];
  const professional = overviewQuery.data?.professional ?? [];
  const unit = unitsQuery.data?.find((item) => item.id === profile?.unitId);
  const myPosts = useMemo(() => (feedQuery.data?.items ?? []).filter((post) => post.authorId === user?.id).slice(0, 2), [feedQuery.data, user?.id]);

  const updateProfile = trpc.account.updateProfile.useMutation({
    onSuccess: () => {
      utils.account.overview.invalidate();
      setEditing(false);
      toast.success("Profil mis à jour.");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteExperience = trpc.account.deleteJecExperience.useMutation({
    onSuccess: () => utils.account.overview.invalidate(),
    onError: (error) => toast.error(error.message),
  });

  const deleteProfessional = trpc.account.deleteProfessionalExperience.useMutation({
    onSuccess: () => utils.account.overview.invalidate(),
    onError: (error) => toast.error(error.message),
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const result = await uploadFile(file, "avatar");
      updateProfile.mutate({ avatarStorageKey: result.storageKey });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'envoi de la photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageIntro
        eyebrow="Mon espace membre"
        title="Mon profil"
        description="Un profil professionnel et un parcours JEC utiles à la communauté, sans jamais devenir impersonnels."
        action={
          <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#17233B]">
            <Edit3 size={15} /> Modifier mon profil
          </button>
        }
      />
      <Panel className="overflow-hidden">
        <div className="relative h-28 bg-[#102846]" />
        <div className="relative px-5 pb-7 sm:px-8">
          <div className="-mt-16 w-fit rounded-full border-4 border-white shadow-md">
            <label className="group relative block cursor-pointer">
              <Avatar alt={user.name ?? "Vous"} src={storageUrl(profile?.avatarStorageKey)} size="lg" />
              <span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#152C4C] text-white shadow transition group-hover:bg-[#0B1931]">
                <Camera size={13} />
              </span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
            </label>
          </div>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-editorial text-[43px] font-semibold leading-9 tracking-[-0.04em] text-[#0A1931]">{user.name}</h1>
                {isVerified ? <BadgeCheck size={21} className="text-[#2777D0]" fill="currentColor" /> : <span className="rounded bg-[#F1F3F8] px-2 py-1 text-[10px] font-bold text-[#707787]">En cours de validation</span>}
              </div>
              <p className="mt-2 text-sm font-bold text-[#4E5969]">{[profile?.jobTitle, profile?.organization].filter(Boolean).join(" · ") || "Ajoutez votre poste et votre organisation"}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#747C87]">
                <JecStatusBadge status={profile?.jecStatus ?? "alumni_jeciste"} />
                {profile?.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {profile.city}{profile.country ? `, ${profile.country}` : ""}
                  </span>
                )}
                {unit && (
                  <span className="flex items-center gap-1">
                    <BriefcaseBusiness size={14} />
                    {unit.name}
                  </span>
                )}
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-[#596575]">{profile?.bio || "Ajoutez une courte présentation pour que le réseau vous connaisse mieux."}</p>
          <div className="mt-6 grid grid-cols-2 border-t border-[#EEEAE3] pt-5">
            <Stat icon={<UsersRound size={17} />} label="Relations" value={String(connectionsQuery.data?.length ?? 0)} />
            <Stat icon={<BriefcaseBusiness size={17} />} label="Mentorat" value={profile?.mentorAvailable ? "Disponible" : "Non disponible"} />
          </div>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_290px]">
        <section>
          {/* « Mon parcours JEC » (cahier §8) — distinct du CV professionnel */}
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-[31px] font-semibold tracking-[-0.035em] text-[#10203A]">Mon parcours JEC</h2>
            <button onClick={() => setAddingExperience(true)} className="inline-flex items-center gap-1.5 rounded-full border border-[#D9D5CE] px-3 py-1.5 text-[11px] font-bold text-[#142039] transition hover:bg-[#F5F0E7]">
              <Plus size={14} /> Ajouter une étape
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {experiences.map((experience) => (
              <Panel key={experience.id} className="flex items-start justify-between gap-3 p-5">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#3B32A0]">
                    {experience.startDate ? String(experience.startDate) : "?"} — {experience.endDate ? String(experience.endDate) : "en cours"}
                  </p>
                  <h3 className="mt-1 font-editorial text-xl font-semibold text-[#10203A]">{experience.functionTitle}</h3>
                  <p className="mt-1 text-xs font-bold text-[#4B5666]">{experience.movementLabel}</p>
                  {experience.description && <p className="mt-2 text-sm leading-6 text-[#596575]">{experience.description}</p>}
                </div>
                <button onClick={() => deleteExperience.mutate({ experienceId: experience.id })} className="shrink-0 rounded-full p-1.5 text-[#9AA1AA] hover:bg-[#F9E9E7] hover:text-[#9B2226]" aria-label="Supprimer cette étape">
                  <Trash2 size={15} />
                </button>
              </Panel>
            ))}
            {experiences.length === 0 && <p className="text-xs text-[#9A9A98]">Vous n'avez pas encore renseigné votre parcours JEC (mouvement, structure, fonction, période).</p>}
          </div>

          {/* Parcours professionnel : expériences, formation, certifications (cahier §7) — distinct du parcours JEC */}
          <div className="mt-8 flex items-center justify-between">
            <h2 className="font-editorial text-[31px] font-semibold tracking-[-0.035em] text-[#10203A]">Parcours professionnel</h2>
            <button onClick={() => setAddingProfessional(true)} className="inline-flex items-center gap-1.5 rounded-full border border-[#D9D5CE] px-3 py-1.5 text-[11px] font-bold text-[#142039] transition hover:bg-[#F5F0E7]">
              <Plus size={14} /> Ajouter
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {professional.map((entry) => (
              <Panel key={entry.id} className="flex items-start justify-between gap-3 p-5">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#3B32A0]">
                    {professionalKindLabels[entry.kind]} · {entry.startDate ? String(entry.startDate) : "?"} — {entry.endDate ? String(entry.endDate) : "en cours"}
                  </p>
                  <h3 className="mt-1 font-editorial text-xl font-semibold text-[#10203A]">{entry.title}</h3>
                  {entry.organization && <p className="mt-1 text-xs font-bold text-[#4B5666]">{entry.organization}</p>}
                  {entry.description && <p className="mt-2 text-sm leading-6 text-[#596575]">{entry.description}</p>}
                </div>
                <button onClick={() => deleteProfessional.mutate({ experienceId: entry.id })} className="shrink-0 rounded-full p-1.5 text-[#9AA1AA] hover:bg-[#F9E9E7] hover:text-[#9B2226]" aria-label="Supprimer cette étape">
                  <Trash2 size={15} />
                </button>
              </Panel>
            ))}
            {professional.length === 0 && <p className="text-xs text-[#9A9A98]">Ajoutez vos expériences professionnelles, formations et certifications.</p>}
          </div>

          <h2 className="mt-8 font-editorial text-[31px] font-semibold tracking-[-0.035em] text-[#10203A]">Activité récente</h2>
          <div className="mt-4 space-y-4">
            {myPosts.map((post) => (
              <Panel key={post.id} className="p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#3B32A0]">Partagé dans le réseau · {formatRelativeTime(post.createdAt)}</p>
                <p className="mt-3 text-sm leading-6 text-[#485568]">{post.body}</p>
                <div className="mt-4 flex gap-4 border-t border-[#EEEAE3] pt-3 text-[11px] font-bold text-[#687281]">
                  <span>{post.reactionCount} réactions</span>
                  <span>{post.commentCount} commentaires</span>
                </div>
              </Panel>
            ))}
            {myPosts.length === 0 && <p className="text-xs text-[#9A9A98]">Vous n'avez pas encore publié sur le réseau.</p>}
          </div>
        </section>
        <aside className="space-y-4">
          <Panel className="p-5">
            <h2 className="font-editorial text-2xl font-semibold text-[#10203A]">À propos</h2>
            <dl className="mt-4 space-y-3 text-xs">
              <div>
                <dt className="font-extrabold uppercase tracking-[0.12em] text-[#3B32A0]">Disponibilités</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5 text-[#596575]">
                  {profile?.mentorAvailable && <span className="rounded-full bg-[#E3E0FA] px-2 py-0.5 text-[10px] font-bold text-[#3B32A0]">Mentorat</span>}
                  {profile?.availableForCollaboration && <span className="rounded-full bg-[#E3E0FA] px-2 py-0.5 text-[10px] font-bold text-[#3B32A0]">Collaboration</span>}
                  {profile?.availableAsExpert && <span className="rounded-full bg-[#E3E0FA] px-2 py-0.5 text-[10px] font-bold text-[#3B32A0]">Expertise</span>}
                  {profile?.availableForProjects && <span className="rounded-full bg-[#E3E0FA] px-2 py-0.5 text-[10px] font-bold text-[#3B32A0]">Accompagnement projet</span>}
                  {!profile?.mentorAvailable && !profile?.availableForCollaboration && !profile?.availableAsExpert && !profile?.availableForProjects && "Aucune"}
                </dd>
              </div>
              {Boolean(profile?.mentorTopics) && (profile!.mentorTopics as string[]).length > 0 && (
                <div>
                  <dt className="font-extrabold uppercase tracking-[0.12em] text-[#3B32A0]">Sujets de mentorat</dt>
                  <dd className="mt-1.5 text-[#596575]">{(profile!.mentorTopics as string[]).join(", ")}</dd>
                </div>
              )}
              {Boolean(profile?.languages) && (profile!.languages as string[]).length > 0 && (
                <div>
                  <dt className="font-extrabold uppercase tracking-[0.12em] text-[#3B32A0]">Langues</dt>
                  <dd className="mt-1.5 text-[#596575]">{(profile!.languages as string[]).join(", ")}</dd>
                </div>
              )}
              {Boolean(profile?.skills) && (profile!.skills as string[]).length > 0 && (
                <div>
                  <dt className="font-extrabold uppercase tracking-[0.12em] text-[#3B32A0]">Compétences</dt>
                  <dd className="mt-1.5 text-[#596575]">{(profile!.skills as string[]).join(", ")}</dd>
                </div>
              )}
              {Boolean(profile?.certifications) && (profile!.certifications as string[]).length > 0 && (
                <div>
                  <dt className="font-extrabold uppercase tracking-[0.12em] text-[#3B32A0]">Certifications</dt>
                  <dd className="mt-1.5 text-[#596575]">{(profile!.certifications as string[]).join(", ")}</dd>
                </div>
              )}
              {Boolean(profile?.interests) && (profile!.interests as string[]).length > 0 && (
                <div>
                  <dt className="font-extrabold uppercase tracking-[0.12em] text-[#3B32A0]">Centres d'intérêt</dt>
                  <dd className="mt-1.5 text-[#596575]">{(profile!.interests as string[]).join(", ")}</dd>
                </div>
              )}
              <div>
                <dt className="font-extrabold uppercase tracking-[0.12em] text-[#3B32A0]">Visibilité annuaire</dt>
                <dd className="mt-1.5 text-[#596575]">{profile?.directoryVisibility === "private" ? "Privé" : profile?.directoryVisibility === "unit_only" ? "Ma structure" : "Tout le réseau"}</dd>
              </div>
            </dl>
          </Panel>
        </aside>
      </div>

      {editing && profile && (
        <EditProfileModal
          initial={{
            headline: profile.headline ?? "",
            jobTitle: profile.jobTitle ?? "",
            organization: profile.organization ?? "",
            city: profile.city ?? "",
            country: profile.country ?? "",
            bio: profile.bio ?? "",
            unitId: profile.unitId ?? null,
            jecStatus: profile.jecStatus,
            mentorAvailable: profile.mentorAvailable ?? false,
            mentorTopics: ((profile.mentorTopics as string[] | null) ?? []).join(", "),
            availableForCollaboration: profile.availableForCollaboration ?? false,
            availableAsExpert: profile.availableAsExpert ?? false,
            availableForProjects: profile.availableForProjects ?? false,
            languages: ((profile.languages as string[] | null) ?? []).join(", "),
            skills: ((profile.skills as string[] | null) ?? []).join(", "),
            certifications: ((profile.certifications as string[] | null) ?? []).join(", "),
            interests: ((profile.interests as string[] | null) ?? []).join(", "),
          }}
          onClose={() => setEditing(false)}
          isPending={updateProfile.isPending}
          onSubmit={(input) => updateProfile.mutate(input)}
        />
      )}
      {addingExperience && <AddExperienceModal onClose={() => setAddingExperience(false)} onSaved={() => utils.account.overview.invalidate()} />}
      {addingProfessional && <AddProfessionalModal onClose={() => setAddingProfessional(false)} onSaved={() => utils.account.overview.invalidate()} />}
    </div>
  );
}

const professionalKindLabels: Record<string, string> = { work: "Expérience professionnelle", education: "Formation", certification: "Certification" };

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-r border-[#EEEAE3] px-3 first:pl-0 last:border-0">
      <span className="text-[#987124]">{icon}</span>
      <strong className="font-editorial text-2xl leading-5 text-[#10203A]">{value}</strong>
      <span className="text-[10px] font-bold text-[#747D88]">{label}</span>
    </div>
  );
}

function EditProfileModal({
  initial,
  onClose,
  onSubmit,
  isPending,
}: {
  initial: { headline: string; jobTitle: string; organization: string; city: string; country: string; bio: string; unitId: number | null; jecStatus: string; mentorAvailable: boolean; mentorTopics: string; availableForCollaboration: boolean; availableAsExpert: boolean; availableForProjects: boolean; languages: string; skills: string; certifications: string; interests: string };
  onClose: () => void;
  isPending: boolean;
  onSubmit: (input: {
    jobTitle?: string;
    organization?: string;
    city?: string;
    country?: string;
    bio?: string;
    unitId?: number;
    jecStatus?: JecStatus;
    mentorAvailable?: boolean;
    mentorTopics?: string[];
    availableForCollaboration?: boolean;
    availableAsExpert?: boolean;
    availableForProjects?: boolean;
    languages?: string[];
    skills?: string[];
    certifications?: string[];
    interests?: string[];
  }) => void;
}) {
  const [jobTitle, setJobTitle] = useState(initial.jobTitle);
  const [organization, setOrganization] = useState(initial.organization);
  const [city, setCity] = useState(initial.city);
  const [country, setCountry] = useState(initial.country);
  const [bio, setBio] = useState(initial.bio);
  const [unitId, setUnitId] = useState<string>(initial.unitId ? String(initial.unitId) : "");
  const [jecStatus, setJecStatus] = useState(initial.jecStatus);
  const [mentorAvailable, setMentorAvailable] = useState(initial.mentorAvailable);
  const [mentorTopics, setMentorTopics] = useState(initial.mentorTopics);
  const [availableForCollaboration, setAvailableForCollaboration] = useState(initial.availableForCollaboration);
  const [availableAsExpert, setAvailableAsExpert] = useState(initial.availableAsExpert);
  const [availableForProjects, setAvailableForProjects] = useState(initial.availableForProjects);
  const [languages, setLanguages] = useState(initial.languages);
  const [skills, setSkills] = useState(initial.skills);
  const [certifications, setCertifications] = useState(initial.certifications);
  const [interests, setInterests] = useState(initial.interests);
  const unitsQuery = trpc.account.organizationalUnits.useQuery({});

  const toList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      jobTitle: jobTitle.trim() || undefined,
      organization: organization.trim() || undefined,
      city: city.trim() || undefined,
      country: country.trim() || undefined,
      bio: bio.trim() || undefined,
      unitId: unitId ? Number(unitId) : undefined,
      jecStatus: jecStatus as JecStatus,
      mentorAvailable,
      mentorTopics: toList(mentorTopics),
      availableForCollaboration,
      availableAsExpert,
      availableForProjects,
      languages: toList(languages),
      skills: toList(skills),
      certifications: toList(certifications),
      interests: toList(interests),
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091830]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#0B1931]">Modifier mon profil</h2>
          <button onClick={onClose} className="rounded-full p-1 text-[#7E8490] hover:bg-[#F3F0EA]">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="profile-status">Statut JEC</Label>
            <select id="profile-status" value={jecStatus} onChange={(event) => setJecStatus(event.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              {Object.entries(jecStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="profile-job">Poste</Label>
              <Input id="profile-job" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-org">Organisation</Label>
              <Input id="profile-org" value={organization} onChange={(event) => setOrganization(event.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-unit">Structure de rattachement</Label>
            <select id="profile-unit" value={unitId} onChange={(event) => setUnitId(event.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">Non renseignée</option>
              {(unitsQuery.data ?? []).map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="profile-city">Ville</Label>
              <Input id="profile-city" value={city} onChange={(event) => setCity(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-country">Pays</Label>
              <Input id="profile-country" value={country} onChange={(event) => setCountry(event.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-bio">Présentation</Label>
            <Textarea id="profile-bio" rows={4} value={bio} onChange={(event) => setBio(event.target.value)} />
          </div>

          <div className="space-y-1.5 border-t border-[#EEEAE3] pt-3">
            <Label htmlFor="profile-languages">Langues (séparées par des virgules)</Label>
            <Input id="profile-languages" placeholder="Français, Anglais…" value={languages} onChange={(event) => setLanguages(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-skills">Compétences</Label>
            <Input id="profile-skills" placeholder="Gestion de projet, plaidoyer…" value={skills} onChange={(event) => setSkills(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-certifications">Certifications / diplômes</Label>
            <Input id="profile-certifications" placeholder="Master en..., Certification PMP…" value={certifications} onChange={(event) => setCertifications(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-interests">Centres d'intérêt professionnels</Label>
            <Input id="profile-interests" placeholder="Suivi-évaluation, plaidoyer…" value={interests} onChange={(event) => setInterests(event.target.value)} />
          </div>

          <div className="space-y-2 border-t border-[#EEEAE3] pt-3">
            <Label>Disponibilités (cahier §7)</Label>
            <label className="flex items-center gap-2 text-xs text-[#4B586A]">
              <input type="checkbox" checked={mentorAvailable} onChange={(event) => setMentorAvailable(event.target.checked)} className="accent-[#5B4FE0]" /> Disponible pour le mentorat
            </label>
            {mentorAvailable && <Input placeholder="Sujets de mentorat (séparés par des virgules)" value={mentorTopics} onChange={(event) => setMentorTopics(event.target.value)} />}
            <label className="flex items-center gap-2 text-xs text-[#4B586A]">
              <input type="checkbox" checked={availableForCollaboration} onChange={(event) => setAvailableForCollaboration(event.target.checked)} className="accent-[#5B4FE0]" /> Disponible pour collaborer
            </label>
            <label className="flex items-center gap-2 text-xs text-[#4B586A]">
              <input type="checkbox" checked={availableAsExpert} onChange={(event) => setAvailableAsExpert(event.target.checked)} className="accent-[#5B4FE0]" /> Disponible pour intervenir comme expert
            </label>
            <label className="flex items-center gap-2 text-xs text-[#4B586A]">
              <input type="checkbox" checked={availableForProjects} onChange={(event) => setAvailableForProjects(event.target.checked)} className="accent-[#5B4FE0]" /> Disponible pour accompagner un projet
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function AddExperienceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [movementLabel, setMovementLabel] = useState("");
  const [functionTitle, setFunctionTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  const addExperience = trpc.account.addJecExperience.useMutation({
    onSuccess: () => {
      onSaved();
      toast.success("Étape ajoutée à votre parcours JEC.");
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!functionTitle.trim()) {
      toast.error("La fonction est requise.");
      return;
    }
    addExperience.mutate({ movementLabel: movementLabel.trim() || undefined, functionTitle: functionTitle.trim(), startDate: startDate || undefined, endDate: endDate || undefined, description: description.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091830]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onSubmit={handleSubmit}>
        <div className="flex items-start justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#0B1931]">Ajouter une étape à mon parcours JEC</h2>
          <button onClick={onClose} className="rounded-full p-1 text-[#7E8490] hover:bg-[#F3F0EA]">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="exp-movement">Mouvement / structure</Label>
            <Input id="exp-movement" placeholder="Ex. JEC Togo — Diocèse de Lomé" value={movementLabel} onChange={(event) => setMovementLabel(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-function">Fonction</Label>
            <Input id="exp-function" placeholder="Ex. Responsable diocésain" value={functionTitle} onChange={(event) => setFunctionTitle(event.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-start">Date de début</Label>
              <Input id="exp-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-end">Date de fin</Label>
              <Input id="exp-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-description">Description / responsabilités</Label>
            <Textarea id="exp-description" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={addExperience.isPending}>
            {addExperience.isPending ? "Enregistrement..." : "Ajouter"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function AddProfessionalModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState<"work" | "education" | "certification">("work");
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  const addProfessional = trpc.account.addProfessionalExperience.useMutation({
    onSuccess: () => {
      onSaved();
      toast.success("Ajouté à votre parcours professionnel.");
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    addProfessional.mutate({ kind, title: title.trim(), organization: organization.trim() || undefined, startDate: startDate || undefined, endDate: endDate || undefined, description: description.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091830]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#0B1931]">Ajouter à mon parcours professionnel</h2>
          <button onClick={onClose} className="rounded-full p-1 text-[#7E8490] hover:bg-[#F3F0EA]">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="prof-kind">Type</Label>
            <select id="prof-kind" value={kind} onChange={(event) => setKind(event.target.value as typeof kind)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="work">Expérience professionnelle</option>
              <option value="education">Formation</option>
              <option value="certification">Certification / diplôme</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prof-title">Intitulé</Label>
            <Input id="prof-title" placeholder="Ex. Chargée de projet" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prof-org">Organisation / établissement</Label>
            <Input id="prof-org" value={organization} onChange={(event) => setOrganization(event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prof-start">Date de début</Label>
              <Input id="prof-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-end">Date de fin</Label>
              <Input id="prof-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prof-description">Description</Label>
            <Textarea id="prof-description" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={addProfessional.isPending}>
            {addProfessional.isPending ? "Enregistrement..." : "Ajouter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
