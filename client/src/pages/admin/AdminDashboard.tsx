/** JECI admin dashboard: aperçu réel, branché sur server/routers/admin.ts (dashboardStats). */
import { ArrowUpRight, CheckCircle2, ChevronRight, Flag, ShieldCheck, UserCheck2, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { AdminPageHeader, AdminPanel, AdminStatCard } from "@/components/AdminPrimitives";
import { trpc } from "@/lib/trpc";

export default function AdminDashboard() {
  const statsQuery = trpc.admin.dashboardStats.useQuery(undefined, { refetchInterval: 10000 });
  const stats = statsQuery.data;

  const actions = [
    { title: "Vérifications en attente", detail: `${stats?.pendingVerifications ?? 0} dossier(s) à examiner`, href: "/admin/verifications", kind: "gold" as const, show: (stats?.pendingVerifications ?? 0) > 0 },
    { title: "Signalements ouverts", detail: `${stats?.openReports ?? 0} signalement(s) à traiter`, href: "/admin/reports", kind: "critical" as const, show: (stats?.openReports ?? 0) > 0 },
    { title: "Opportunités à valider", detail: `${stats?.pendingOpportunities ?? 0} offre(s) en attente`, href: "/admin/opportunities", kind: "blue" as const, show: (stats?.pendingOpportunities ?? 0) > 0 },
    { title: "Événements à valider", detail: `${stats?.pendingEvents ?? 0} événement(s) en attente`, href: "/admin/events", kind: "blue" as const, show: (stats?.pendingEvents ?? 0) > 0 },
  ].filter((action) => action.show);

  const actionIcon = { critical: Flag, gold: ShieldCheck, blue: CheckCircle2 };

  return (
    <div>
      <AdminPageHeader eyebrow="Pilotage du réseau" title="Aperçu global" description="Suivez l'activité du réseau JECI et traitez les sujets qui demandent votre attention." />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Membres inscrits" value={String(stats?.totalMembers ?? "—")} delta={`${stats?.verifiedMembers ?? 0} vérifiés`} icon="UsersRound" tone="blue" />
        <AdminStatCard label="Publications" value={String(stats?.totalPosts ?? "—")} delta="sur le réseau" icon="MessageSquare" tone="slate" />
        <AdminStatCard label="Signalements ouverts" value={String(stats?.openReports ?? "—")} delta={stats && stats.openReports > 0 ? "à traiter" : "aucun"} icon="Flag" tone={stats && stats.openReports > 0 ? "red" : "slate"} />
        <AdminStatCard label="En attente de validation" value={String((stats?.pendingOpportunities ?? 0) + (stats?.pendingEvents ?? 0))} delta="opportunités + événements" icon="ShieldCheck" tone="gold" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
        <AdminPanel className="p-5">
          <div className="flex items-center gap-2">
            <span className="font-editorial text-[29px] font-semibold text-[#0C1930]">Actions requises</span>
            {actions.length > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-[#F8E6B5] text-[11px] font-extrabold text-[#775214]">{actions.length}</span>}
          </div>
          <div className="mt-5 space-y-3">
            {actions.map((action) => {
              const Icon = actionIcon[action.kind];
              const color = action.kind === "critical" ? "text-[#A52F39] bg-[#FDEBEC]" : action.kind === "gold" ? "text-[#8D681B] bg-[#FFF4DB]" : "text-[#276CA9] bg-[#EAF3FC]";
              return (
                <Link key={action.title} href={action.href} className="block rounded-lg border border-[#E1E4EA] p-4 transition hover:border-[#B9C5D6] hover:shadow-sm">
                  <div className="flex justify-between gap-3">
                    <div className="flex gap-3">
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${color}`}>
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className="text-xs font-extrabold text-[#26334A]">{action.title}</p>
                        <p className="mt-1 text-xs leading-5 text-[#657084]">{action.detail}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            {actions.length === 0 && (
              <p className="flex items-center gap-2 rounded-lg border border-[#DCEBE1] bg-[#F3FAF6] p-4 text-xs font-bold text-[#286146]">
                <UserCheck2 size={16} /> Rien n'attend votre attention pour l'instant.
              </p>
            )}
          </div>
          <Link href="/admin/verifications" className="mt-5 flex items-center justify-center gap-1 rounded-lg bg-[#10294D] py-3 text-xs font-extrabold text-white transition hover:bg-[#17355E]">
            Traiter les requêtes <ChevronRight size={16} />
          </Link>
        </AdminPanel>

        <AdminPanel className="p-5">
          <h2 className="font-editorial text-[31px] font-semibold tracking-[-0.03em] text-[#0B1730]">Résumé du mentorat</h2>
          <p className="mt-1 text-xs text-[#738094]">Vue rapide de l'entraide entre Jécistes</p>
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-[#E1E4EA] p-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#EEF2F7] text-[#254C79]">
              <UsersRound size={19} />
            </span>
            <div>
              <p className="text-sm font-bold text-[#17253C]">{stats?.pendingMentorship ?? 0} demande(s) de mentorat en attente</p>
              <Link href="/admin/mentoring" className="mt-1 inline-flex items-center gap-1 text-xs font-extrabold text-[#173A67] hover:gap-2">
                Voir le détail <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </AdminPanel>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <AdminPanel className="p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#9A752A]">Membres</p>
          <p className="mt-3 font-editorial text-[32px] font-semibold leading-7 text-[#102444]">{stats?.verifiedMembers ?? 0} vérifiés</p>
          <p className="mt-3 text-xs leading-5 text-[#6B7687]">Sur {stats?.totalMembers ?? 0} comptes inscrits au total.</p>
          <Link href="/admin/membres" className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-[#173A67] hover:gap-2">
            Voir les membres <ArrowUpRight size={14} />
          </Link>
        </AdminPanel>
        <AdminPanel className="p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#9A752A]">Contenu</p>
          <p className="mt-3 font-editorial text-[32px] font-semibold leading-7 text-[#102444]">{stats?.openReports ?? 0} signalement(s)</p>
          <p className="mt-3 text-xs leading-5 text-[#6B7687]">Ouverts et en attente d'examen.</p>
          <Link href="/admin/reports" className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-[#173A67] hover:gap-2">
            Voir les signalements <ArrowUpRight size={14} />
          </Link>
        </AdminPanel>
        <AdminPanel className="p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#9A752A]">Validation</p>
          <p className="mt-3 font-editorial text-[32px] font-semibold leading-7 text-[#102444]">{stats?.pendingEvents ?? 0} événement(s)</p>
          <p className="mt-3 text-xs leading-5 text-[#6B7687]">En attente de publication.</p>
          <Link href="/admin/events" className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-[#173A67] hover:gap-2">
            Gérer les événements <ArrowUpRight size={14} />
          </Link>
        </AdminPanel>
      </section>
    </div>
  );
}
