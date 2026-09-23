/** JECI admin shell: a visible and persistent operational control room, distinct from the member network. */
import { useState } from "react";
import * as Icons from "lucide-react";
import { CircleHelp, Menu, Search, X, ExternalLink } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { adminAssets } from "@/data/adminData";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { storageUrl } from "@/lib/storageUrl";
import { AdminAvatar } from "@/components/AdminPrimitives";
import { NotificationBell } from "@/components/NotificationBell";

type NavIcon = keyof typeof Icons;

const adminNavBase = [
  { label: "Tableau de bord", href: "/admin", icon: "LayoutDashboard" },
  { label: "Gestion des membres", href: "/admin/membres", icon: "UsersRound" },
  { label: "Vérifications", href: "/admin/verifications", icon: "ShieldCheck", statKey: "pendingVerifications" as const },
  { label: "Organisation", href: "/admin/organisation", icon: "Network" },
  { label: "Publications", href: "/admin/publications", icon: "Newspaper" },
  { label: "Opportunités", href: "/admin/opportunities", icon: "BriefcaseBusiness", statKey: "pendingOpportunities" as const },
  { label: "Mentorat", href: "/admin/mentoring", icon: "Handshake" },
  { label: "Projets", href: "/admin/projects", icon: "FolderKanban" },
  { label: "Événements", href: "/admin/events", icon: "CalendarDays", statKey: "pendingEvents" as const },
  { label: "Signalements", href: "/admin/reports", icon: "Flag", statKey: "openReports" as const },
  { label: "Communications", href: "/admin/communications", icon: "Send" },
];

function AdminSideContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  // Rafraîchissement automatique pour que les badges reflètent l'état réel sans recharger la page.
  const statsQuery = trpc.admin.dashboardStats.useQuery(undefined, { refetchInterval: 10000 });
  const stats = statsQuery.data;

  return (
    <>
      <div className="flex items-center gap-3 border-b border-[#E3E5E9] px-4 pb-5">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#F2F4F8]">
          <img src={adminAssets.mark} alt="JEC" className="h-7 w-7 object-contain" />
        </span>
        <div>
          <p className="font-editorial text-[23px] font-semibold leading-5 text-[#0B1730]">
            Administration
            <br />
            JECI
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.11em] text-[#7D8796]">Portail de gestion</p>
        </div>
      </div>
      <nav className="admin-sidebar-scroll mt-5 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 pb-3">
        {adminNavBase.map((item) => {
          const Icon = Icons[item.icon as NavIcon] as React.ComponentType<{ size?: number; strokeWidth?: number }>;
          const active = item.href === "/admin" ? location === "/admin" : location.startsWith(item.href);
          const badgeValue = item.statKey && stats ? stats[item.statKey] : undefined;
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-bold tracking-[0.025em] transition ${active ? "bg-[#EEF2F9] text-[#11294B] shadow-[inset_-3px_0_0_#5B4FE0]" : "text-[#4E5969] hover:bg-[#F4F5F7] hover:text-[#101C32]"}`}>
              <Icon size={19} strokeWidth={active ? 2.3 : 1.9} />
              <span>{item.label}</span>
              {badgeValue ? <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-[#7A6FE0] text-white" : "bg-[#EEF0F4] text-[#657184]"}`}>{badgeValue}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-[#E3E5E9] bg-white p-3">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold text-[#536071] transition hover:bg-[#F4F5F7] hover:text-[#102441]">
          <ExternalLink size={16} /> Voir l'espace membre
        </Link>
        <Link href="/admin/settings" onClick={onNavigate} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold text-[#536071] transition hover:bg-[#F4F5F7] hover:text-[#102441]">
          <Icons.Settings2 size={16} /> Paramètres
        </Link>
      </div>
    </>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const overviewQuery = trpc.account.overview.useQuery(undefined, { enabled: Boolean(user) });

  return (
    <div className="flex min-h-screen bg-[#F6F7FB] text-[#172238]">
      <aside className="sticky top-0 hidden h-screen w-[266px] shrink-0 flex-col overflow-hidden border-r border-[#DDE1E9] bg-white pt-5 lg:flex">
        <AdminSideContent />
      </aside>
      {menuOpen ? (
        <div className="fixed inset-0 z-[70] bg-[#0C1B35]/35 backdrop-blur-[2px] lg:hidden" onClick={() => setMenuOpen(false)}>
          <aside onClick={(event) => event.stopPropagation()} className="flex h-[100dvh] w-[296px] flex-col overflow-hidden bg-white px-2 pb-4 pt-4 shadow-2xl">
            <div className="mb-2 flex shrink-0 justify-end px-2">
              <button onClick={() => setMenuOpen(false)} aria-label="Fermer le menu" className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#F3F5F8]">
                <X size={20} />
              </button>
            </div>
            <AdminSideContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#DDE1E9] bg-white/95 px-4 backdrop-blur-xl sm:px-6">
          <button onClick={() => setMenuOpen(true)} aria-label="Ouvrir la navigation" className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#F3F5F8] lg:hidden">
            <Menu size={21} />
          </button>
          <span className="rounded-full bg-[#F4E5BC] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#674A11] lg:hidden">Admin</span>
          <div className="hidden items-center gap-2 xl:flex">
            <img src={adminAssets.mark} alt="" className="h-6 w-6" />
            <span className="whitespace-nowrap font-editorial text-[22px] font-semibold text-[#101C34]">Administration JECI</span>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              toast.info("Recherche globale prête à être reliée aux données de production.");
            }}
            className="relative ml-auto hidden w-full max-w-[320px] xl:block"
          >
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F7A8A]" />
            <input placeholder="Rechercher…" className="h-10 w-full rounded-full border border-[#DCE1E9] bg-[#F3F5FA] pl-10 pr-4 text-xs outline-none transition focus:border-[#17355E] focus:bg-white focus:ring-4 focus:ring-[#E1EAF7]" />
          </form>
          <NotificationBell buttonClassName="relative ml-auto grid h-9 w-9 place-items-center rounded-full text-[#25324A] hover:bg-[#F3F5F8] xl:ml-0" />
          <button onClick={() => toast.info("Centre d'aide administrateur à connecter.")} aria-label="Aide" className="hidden h-9 w-9 place-items-center rounded-full text-[#25324A] hover:bg-[#F3F5F8] sm:grid">
            <CircleHelp size={20} />
          </button>
          <Link href="/admin/settings" aria-label="Profil administrateur">
            <AdminAvatar name={user?.name ?? "Administrateur"} src={storageUrl(overviewQuery.data?.profile?.avatarStorageKey)} />
          </Link>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-6 pb-12 sm:px-6 lg:px-10 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
