/** JECI header: reference Accueil — brand, central search, clear black action, real notifications. */
import { Mail, Menu, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { assets } from "@/data/mockData";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { storageUrl } from "@/lib/storageUrl";
import { Avatar } from "@/components/UiPrimitives";
import { CreateMenu } from "@/components/CreateMenu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/NotificationBell";

type AppHeaderProps = { onOpenMenu: () => void; mobileMenuOpen: boolean };

function formatRelativeTime(date: string | Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.round(hours / 24)} j`;
}

export function AppHeader({ onOpenMenu, mobileMenuOpen }: AppHeaderProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const overviewQuery = trpc.account.overview.useQuery(undefined, { enabled: Boolean(user) });
  const [createOpen, setCreateOpen] = useState(false);

  function search(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const query = String(form.get("search") ?? "").trim();
    if (query) {
      navigate(`/annuaire?q=${encodeURIComponent(query)}`);
    }
  }

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-[#E2DDD3] bg-[#FEFDFB]/95 shadow-[0_2px_14px_rgba(18,35,61,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-3 px-4 lg:px-8">
        <div className="flex w-auto shrink-0 items-center gap-2.5 lg:w-[280px]">
          <button aria-label="Ouvrir le menu" onClick={onOpenMenu} className="grid h-9 w-9 place-items-center rounded-full text-[#0A1730] transition hover:bg-[#F1EBDD] active:scale-95 lg:hidden">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={21} />}
          </button>
          <Link href="/" className="group flex items-center gap-2.5 text-[#0A1730]">
            <span className="relative">
              <img src={assets.mark} alt="Logo officiel de JECI" className="h-10 w-10 rounded-full object-contain transition-transform duration-200 group-hover:rotate-[-5deg]" />
              <i className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-[#F07030]" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-editorial text-[25px] font-bold tracking-[-0.045em] lg:text-[23px]">
                JECI <span className="hidden lg:inline"></span>
              </span>
              <span className="mt-1 hidden text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#546478] xl:block">Réseau international des Jécistes</span>
            </span>
          </Link>
        </div>

        <form onSubmit={search} className="hidden flex-1 md:block">
          <label className="relative mx-auto block max-w-[680px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6C7482]" size={20} />
            <input name="search" placeholder="Rechercher des Jécistes…" className="h-10 w-full rounded-full border border-transparent bg-[#EEF1F7] py-2 pl-11 pr-4 text-sm text-[#12213A] outline-none transition focus:border-[#0B1E3A] focus:bg-white focus:ring-4 focus:ring-[#DCE4F0]/70" />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-1.5 lg:gap-2">
          <button onClick={() => setCreateOpen(true)} className="hidden h-10 items-center gap-2 rounded-full bg-black px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#17233B] active:scale-[0.97] md:flex">
            <Plus size={18} strokeWidth={2.6} /> Publier
          </button>
          <button aria-label="Rechercher" onClick={() => navigate("/annuaire")} className="grid h-9 w-9 place-items-center rounded-full text-[#162038] transition hover:bg-[#F1EBDD] active:scale-95 md:hidden">
            <Search size={21} />
          </button>
          <NotificationBell />
          <Link href="/messages" aria-label="Messages" className="hidden h-9 w-9 place-items-center rounded-full text-[#162038] transition hover:bg-[#F1EBDD] active:scale-95 sm:grid">
            <Mail size={20} />
          </Link>
          <Link href="/profil" aria-label="Mon profil" className="ml-0.5 overflow-hidden rounded-full border border-[#DAD5CC] shadow-sm transition hover:ring-2 hover:ring-[#7A6FE0]/60">
            <Avatar alt={user?.name ?? "Vous"} src={storageUrl(overviewQuery.data?.profile?.avatarStorageKey)} size="sm" />
          </Link>
        </div>
      </div>
      <CreateMenu open={createOpen} onClose={() => setCreateOpen(false)} />
    </header>
  );
}
