/** JECI — Fiche projet détaillée, branché sur server/routers/projects.ts. */
import { ArrowLeft, LockKeyhole, Users2 } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { Avatar, Panel } from "@/components/UiPrimitives";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { storageUrl } from "@/lib/storageUrl";

const visibilityLabels: Record<string, string> = { network: "Ouvert au réseau", unit_only: "Réservé à ma structure", private: "Sur invitation" };
const statusLabels: Record<string, string> = { idea: "Idée", in_preparation: "En préparation", in_progress: "En cours", completed: "Terminé", suspended: "Suspendu" };

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const utils = trpc.useUtils();

  const projectQuery = trpc.projects.get.useQuery({ projectId }, { enabled: Number.isFinite(projectId) });
  const project = projectQuery.data;

  const joinProject = trpc.projects.join.useMutation({
    onSuccess: () => {
      utils.projects.get.invalidate({ projectId });
      toast.success("Vous avez rejoint cet espace.");
    },
    onError: (error) => toast.error(error.message),
  });
  const leaveProject = trpc.projects.leave.useMutation({
    onSuccess: () => utils.projects.get.invalidate({ projectId }),
    onError: (error) => toast.error(error.message),
  });

  if (projectQuery.isLoading) return <p className="text-sm text-[#707787]">Chargement...</p>;

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link href="/projets" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#5F6978] hover:text-[#0E1D36]">
          <ArrowLeft size={16} /> Retour aux projets
        </Link>
        <Panel className="p-10 text-center">
          <p className="font-editorial text-2xl font-semibold text-[#10213D]">Cet espace n'existe pas, ou vous n'y avez pas accès.</p>
        </Panel>
      </div>
    );
  }

  const isMember = Boolean(project.viewerRole);
  const isOwner = project.viewerRole === "owner";
  const canJoinDirectly = project.visibility === "network" && !isMember;

  const handleJoin = () => {
    if (!isVerified) {
      toast.info("Vérifiez votre compte pour rejoindre un espace.");
      return;
    }
    joinProject.mutate({ projectId });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/projets" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#5F6978] hover:text-[#0E1D36]">
        <ArrowLeft size={16} /> Retour aux projets
      </Link>
      <div className="overflow-hidden rounded-2xl border border-[#E1DDD6] bg-white shadow-[0_8px_30px_rgba(10,32,63,0.07)]">
        {project.coverStorageKey ? (
          project.coverMimeType?.startsWith("video/") ? (
            <video src={storageUrl(project.coverStorageKey)} controls className="h-56 w-full bg-black object-cover" />
          ) : (
            <img src={storageUrl(project.coverStorageKey)} alt="" className="h-56 w-full object-cover" />
          )
        ) : null}
        <div className="bg-[#102846] px-6 py-8 text-white sm:px-9">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#D7E1ED]">{visibilityLabels[project.visibility]}</span>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#D7E1ED]">{statusLabels[project.status]}</span>
            {project.visibility === "private" && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#D7E1ED]">
                <LockKeyhole size={12} /> Privé
              </span>
            )}
          </div>
          <h1 className="mt-3 font-editorial text-[38px] font-semibold leading-[0.95] tracking-[-0.03em] sm:text-[48px]">{project.name}</h1>
          {project.description && <p className="mt-4 max-w-2xl text-sm leading-6 text-[#D8DFE9]">{project.description}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 text-sm text-[#D8DFE9]">
              <Users2 size={17} />
              {project.members.length} membre{project.members.length > 1 ? "s" : ""} · créé par {project.ownerName}
            </span>
            {!isOwner && (isMember ? (
              <button onClick={() => leaveProject.mutate({ projectId })} disabled={leaveProject.isPending} className="rounded-full border border-white/30 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-50">
                Quitter l'espace
              </button>
            ) : canJoinDirectly ? (
              <button onClick={handleJoin} disabled={joinProject.isPending} className="rounded-full bg-[#EFCB80] px-4 py-2 text-xs font-extrabold text-[#4D3510] transition hover:bg-[#E6BE68] disabled:opacity-50">
                {joinProject.isPending ? "…" : "Rejoindre"}
              </button>
            ) : (
              <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white">Sur invitation du créateur</span>
            ))}
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_260px]">
          <section className="space-y-5">
            {project.objective && (
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#8B742F]">Objectif</p>
                <p className="mt-1.5 text-sm leading-6 text-[#485568]">{project.objective}</p>
              </div>
            )}
            {project.needs && (
              <div className="rounded-lg bg-[#FBE0C8] p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#8A3F10]">Besoins</p>
                <p className="mt-1.5 text-sm leading-6 text-[#8A3F10]">{project.needs}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {project.domain && (
                <div>
                  <p className="font-extrabold uppercase tracking-[0.1em] text-[#8B742F]">Domaine</p>
                  <p className="mt-1 text-[#485568]">{project.domain}</p>
                </div>
              )}
              {project.location && (
                <div>
                  <p className="font-extrabold uppercase tracking-[0.1em] text-[#8B742F]">Localisation</p>
                  <p className="mt-1 text-[#485568]">{project.location}</p>
                </div>
              )}
              {project.budgetIndicative && (
                <div>
                  <p className="font-extrabold uppercase tracking-[0.1em] text-[#8B742F]">Budget indicatif</p>
                  <p className="mt-1 text-[#485568]">{project.budgetIndicative}</p>
                </div>
              )}
              {project.partners && (
                <div>
                  <p className="font-extrabold uppercase tracking-[0.1em] text-[#8B742F]">Partenaires</p>
                  <p className="mt-1 text-[#485568]">{project.partners}</p>
                </div>
              )}
            </div>
            {project.linkUrl && (
              <a href={project.linkUrl} target="_blank" rel="noreferrer" className="inline-block text-xs font-bold text-[#5B4FE0] underline">
                Voir le lien du projet
              </a>
            )}
          </section>
          <aside>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#8B742F]">Membres</p>
            <div className="mt-3 space-y-2">
              {project.members.map((member) => (
                <div key={member.userId} className="flex items-center gap-2.5 rounded-lg border border-[#EEEAE3] p-2">
                  <Avatar alt={member.name ?? "Membre"} src={undefined} size="sm" />
                  <div>
                    <span className="block truncate text-xs font-bold text-[#293446]">{member.name}</span>
                    {member.role === "owner" && <span className="text-[10px] font-bold text-[#977123]">Créateur</span>}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
