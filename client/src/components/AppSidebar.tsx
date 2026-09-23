/** JECI sidebar: navigation principale, profil courant, badges de vérification. */
import * as Icons from "lucide-react";
import { Camera, LogOut, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { navItems } from "@/data/mockData";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { storageUrl } from "@/lib/storageUrl";
import { uploadFile } from "@/lib/upload";

type AppSidebarProps = { mobileOpen: boolean; onCloseMobile: () => void };
type NavIconName = keyof typeof Icons;

function SidebarContent({ close }: { close?: () => void }) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const utils = trpc.useUtils();

  const overviewQuery = trpc.account.overview.useQuery(undefined, { enabled: Boolean(user) });
  const unitsQuery = trpc.account.organizationalUnits.useQuery(undefined, { enabled: Boolean(user) });
  const conversationsQuery = trpc.messaging.conversations.useQuery(undefined, { enabled: Boolean(user), refetchInterval: 15000 });

  const unreadMessages = (conversationsQuery.data ?? []).reduce((total, row) => total + row.unreadCount, 0);
  const profile = overviewQuery.data?.profile;
  const unit = unitsQuery.data?.find((item: { id: number }) => item.id === profile?.unitId);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      close?.();
      setLocation("/login");
    },
    onError: () => toast.error("Échec de la déconnexion."),
  });

  const updateProfile = trpc.account.updateProfile.useMutation({
    onSuccess: () => utils.account.overview.invalidate(),
    onError: (error) => toast.error(error.message),
  });

  const [uploadingCover, setUploadingCover] = useState(false);
  const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingCover(true);
    try {
      const result = await uploadFile(file, "cover");
      updateProfile.mutate({ coverStorageKey: result.storageKey });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'envoi de la photo de couverture.");
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#E5E0D8] bg-white shadow-[0_5px_18px_rgba(10,32,63,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(10,32,63,0.08)]">
        <div className="relative h-[78px] overflow-hidden bg-[#142B4C]">
          <img src={storageUrl(profile?.coverStorageKey) ?? "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80"} alt="Photo de couverture" className="h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1C35]/70 to-transparent" />
          <label className="absolute right-2 top-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60" title="Changer la photo de couverture">
            <Camera size={15} />
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleCoverChange} disabled={uploadingCover} />
          </label>
        </div>
        <Link href="/profil" onClick={close} className="relative flex flex-col items-center px-5 pb-5 text-center">
          <img src={storageUrl(profile?.avatarStorageKey) ?? "/favicon.svg"} alt={user?.name ?? "Mon profil"} className="-mt-9 h-[76px] w-[76px] rounded-full border-4 border-white bg-white object-cover shadow-sm" />
          <div className="mt-2 flex items-center gap-1 text-[#08162D]">
            <span className="font-editorial text-[22px] font-semibold">{user?.name ?? "Mon profil"}</span>
            {isVerified && <Icons.BadgeCheck className="text-[#2377D1]" size={16} fill="currentColor" />}
          </div>
          <span className="mt-0.5 text-xs font-medium text-[#6F7180]">{unit ? unit.name : "Structure non renseignée"}</span>
          <span className="mt-1 text-[11px] text-[#8A8A8A]">{isVerified ? "Jéciste vérifié" : "En cours de validation"}</span>
        </Link>
      </div>

      <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = Icons[item.icon as NavIconName] as React.ComponentType<{ size?: number; strokeWidth?: number }>;
          const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={close} className={`group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] font-bold tracking-[0.03em] transition ${active ? "bg-[#E3E0FA] text-[#2A2270] shadow-[0_3px_9px_rgba(190,142,46,0.16)]" : "text-[#4C5360] hover:bg-[#F4EFE7] hover:text-[#101D33]"}`}>
              <Icon size={20} strokeWidth={active ? 2.3 : 1.9} />
              {item.label}
              {item.label === "Messages" && unreadMessages > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#A5232A] px-1 text-[10px] text-white">{unreadMessages > 9 ? "9+" : unreadMessages}</span>}
            </Link>
          );
        })}
      </nav>

      <button onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending} className="mt-3 flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left text-[13px] font-semibold text-[#9B2226] transition hover:bg-[#F9E9E7] active:scale-[0.98] disabled:opacity-50">
        <LogOut size={19} /> {logoutMutation.isPending ? "Déconnexion..." : "Déconnexion"}
      </button>
    </>
  );
}

export function AppSidebar({ mobileOpen, onCloseMobile }: AppSidebarProps) {
  return (
    <>
      <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-[248px] shrink-0 flex-col gap-5 overflow-y-auto pb-2 pr-1 lg:flex">
        <SidebarContent />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-[#08162D]/35 backdrop-blur-[2px] lg:hidden" onClick={onCloseMobile}>
          <aside onClick={(event) => event.stopPropagation()} className="flex h-full w-[304px] flex-col gap-5 overflow-y-auto bg-[#FDFBF7] px-4 pb-6 pt-4 shadow-2xl">
            <div className="flex items-center justify-between px-1">
              <span className="font-editorial text-xl font-semibold text-[#091A34]">Menu JECI</span>
              <button onClick={onCloseMobile} aria-label="Fermer le menu" className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-[#F1EBDD]"><X size={20} /></button>
            </div>
            <SidebarContent close={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  );
}
