/** JECI — Profil public d'un membre : accessible en cliquant sur un nom ou une photo n'importe où dans l'application. */
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, Clock, MapPin, MessageSquare, UserCheck, UserPlus } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Avatar, JecStatusBadge, Panel } from "@/components/UiPrimitives";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { storageUrl } from "@/lib/storageUrl";

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const profileQuery = trpc.account.publicProfile.useQuery({ userId }, { enabled: Number.isFinite(userId) });
  const profile = profileQuery.data;

  const sendRequest = trpc.network.sendRequest.useMutation({
    onSuccess: () => {
      utils.account.publicProfile.invalidate({ userId });
      toast.success("Invitation envoyée.");
    },
    onError: (error) => toast.error(error.message),
  });

  const startConversation = trpc.messaging.startConversation.useMutation({
    onSuccess: (data) => navigate(`/messages?c=${data.conversationId}`),
    onError: (error) => toast.error(error.message),
  });

  if (profileQuery.isLoading) return <p className="text-sm text-[#707787]">Chargement...</p>;

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link href="/annuaire" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#5F6978] hover:text-[#0E1D36]">
          <ArrowLeft size={16} /> Retour à l'annuaire
        </Link>
        <Panel className="p-10 text-center">
          <p className="font-editorial text-2xl font-semibold text-[#10213D]">Ce profil est introuvable ou n'est pas accessible.</p>
        </Panel>
      </div>
    );
  }

  if (profile.isSelf) {
    navigate("/profil");
    return null;
  }

  const isVerifiedProfile = profile.accountStatus === "verified";

  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={() => window.history.back()} className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#5F6978] hover:text-[#0E1D36]">
        <ArrowLeft size={16} /> Retour
      </button>
      <Panel className="overflow-hidden">
        <div className="h-24 bg-[#102846]" />
        <div className="px-5 pb-7 sm:px-8">
          <div className="-mt-14">
            <Avatar alt={profile.name ?? "Membre"} src={storageUrl(profile.avatarStorageKey)} size="lg" />
          </div>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-editorial text-[38px] font-semibold leading-9 tracking-[-0.03em] text-[#0A1931]">{profile.name}</h1>
                {isVerifiedProfile && <BadgeCheck size={19} className="text-[#2777D0]" fill="currentColor" />}
              </div>
              <p className="mt-2 text-sm font-bold text-[#4E5969]">{[profile.jobTitle, profile.organization].filter(Boolean).join(" · ")}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#747C87]">
                <JecStatusBadge status={profile.jecStatus} />
                {profile.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {profile.city}
                  </span>
                )}
                {profile.unitName && (
                  <span className="flex items-center gap-1">
                    <BriefcaseBusiness size={13} /> {profile.unitName}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {profile.connectionStatus === "accepted" ? (
                <>
                  <span className="flex items-center gap-1.5 rounded-full bg-[#DFF3EA] px-3 py-2 text-xs font-bold text-[#1F6A54]">
                    <UserCheck size={15} /> Connecté
                  </span>
                  <button onClick={() => startConversation.mutate({ userId })} disabled={startConversation.isPending} className="flex items-center gap-1.5 rounded-full bg-black px-3 py-2 text-xs font-bold text-white hover:bg-[#17233B] disabled:opacity-50">
                    <MessageSquare size={15} /> Message
                  </button>
                </>
              ) : profile.connectionStatus === "pending" ? (
                <span className="flex items-center gap-1.5 rounded-full bg-[#F7E4BA] px-3 py-2 text-xs font-bold text-[#684D16]">
                  <Clock size={15} /> Invitation en attente
                </span>
              ) : (
                <button
                  onClick={() => (isVerified ? sendRequest.mutate({ userId }) : toast.info("Vérifiez votre compte pour envoyer des invitations."))}
                  disabled={sendRequest.isPending}
                  className="flex items-center gap-1.5 rounded-full border border-[#142640] px-3 py-2 text-xs font-bold text-[#142640] hover:bg-[#142640] hover:text-white disabled:opacity-50"
                >
                  <UserPlus size={15} /> Se connecter
                </button>
              )}
            </div>
          </div>
          {profile.bio && <p className="mt-6 max-w-3xl text-sm leading-7 text-[#596575]">{profile.bio}</p>}

          {profile.mentorAvailable && (
            <div className="mt-6 flex items-center gap-2 rounded-lg bg-[#E3E0FA] p-3 text-xs font-bold text-[#3B32A0]">
              Disponible pour le mentorat{Boolean(profile.mentorTopics) && (profile.mentorTopics as string[]).length > 0 ? ` · ${(profile.mentorTopics as string[]).join(", ")}` : ""}
            </div>
          )}
        </div>
      </Panel>

      {profile.experiences.length > 0 && (
        <div className="mt-6">
          <h2 className="font-editorial text-[27px] font-semibold tracking-[-0.03em] text-[#10203A]">Parcours JEC</h2>
          <div className="mt-3 space-y-3">
            {profile.experiences.map((experience) => (
              <Panel key={experience.id} className="p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#3B32A0]">
                  {experience.startDate ? String(experience.startDate) : "?"} — {experience.endDate ? String(experience.endDate) : "en cours"}
                </p>
                <h3 className="mt-1 font-editorial text-lg font-semibold text-[#10203A]">{experience.functionTitle}</h3>
                {experience.movementLabel && <p className="mt-0.5 text-xs font-bold text-[#4B5666]">{experience.movementLabel}</p>}
              </Panel>
            ))}
          </div>
        </div>
      )}

      {profile.professional.length > 0 && (
        <div className="mt-6">
          <h2 className="font-editorial text-[27px] font-semibold tracking-[-0.03em] text-[#10203A]">Parcours professionnel</h2>
          <div className="mt-3 space-y-3">
            {profile.professional.map((entry) => (
              <Panel key={entry.id} className="p-4">
                <h3 className="font-editorial text-lg font-semibold text-[#10203A]">{entry.title}</h3>
                {entry.organization && <p className="mt-0.5 text-xs font-bold text-[#4B5666]">{entry.organization}</p>}
              </Panel>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
