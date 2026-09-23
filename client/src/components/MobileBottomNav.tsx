/** JECI mobile navigation: reference Événements — persistent five-route dock. */
import { BriefcaseBusiness, House, Plus, UsersRound, Handshake } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { CreateMenu } from "@/components/CreateMenu";

const links = [
  { label: "Accueil", href: "/", Icon: House },
  { label: "Annuaire", href: "/annuaire", Icon: UsersRound },
  { label: "Opportunités", href: "/opportunites", Icon: BriefcaseBusiness },
  { label: "Mentorat", href: "/mentorat", Icon: Handshake },
];

export function MobileBottomNav() {
  const [location] = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <>
      <nav aria-label="Navigation rapide" className="fixed inset-x-0 bottom-0 z-50 flex h-[73px] items-end justify-between border-t border-[#D9D4CB] bg-[#FEFDFB]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-7px_22px_rgba(12,25,44,0.09)] backdrop-blur-xl lg:hidden">
        {links.slice(0, 2).map(({ label, href, Icon }) => <MobileLink key={href} label={label} href={href} Icon={Icon} active={href === "/" ? location === "/" : location.startsWith(href)} />)}
        <button onClick={() => setCreateOpen(true)} className="-mt-9 flex w-[64px] flex-col items-center gap-0.5 text-[#0A1730] active:scale-95">
          <span className="grid h-14 w-14 place-items-center rounded-full border-4 border-white bg-black text-white shadow-[0_6px_16px_rgba(0,0,0,0.27)]"><Plus size={29} strokeWidth={2.5} /></span>
          <span className="text-[10px] font-extrabold">Créer</span>
        </button>
        {links.slice(2).map(({ label, href, Icon }) => <MobileLink key={href} label={label} href={href} Icon={Icon} active={location.startsWith(href)} />)}
      </nav>
      <CreateMenu open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

function MobileLink({ label, href, Icon, active }: { label: string; href: string; Icon: typeof House; active: boolean }) {
  return <Link href={href} className={`flex min-w-14 flex-col items-center gap-1 transition ${active ? "text-[#0C1D36]" : "text-[#72757D]"}`}><Icon size={21} strokeWidth={active ? 2.35 : 1.8} /><span className="text-[10px] font-bold">{label}</span></Link>;
}
