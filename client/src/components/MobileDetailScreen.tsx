/** JECI mobile detail screen: native-style, full-screen continuation with a single clear return path. */
import { ArrowLeft } from "lucide-react";
import { type ReactNode, useEffect } from "react";

type MobileDetailScreenProps = { title: string; subtitle?: string; onBack: () => void; children: ReactNode; headerRight?: ReactNode; };

export function MobileDetailScreen({ title, subtitle, onBack, children, headerRight }: MobileDetailScreenProps) {
  useEffect(() => {
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);
  return <section role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[90] overflow-y-auto bg-[#FDFBF7] lg:hidden"><header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-[#E7E1D8] bg-[#FDFBF7]/95 px-4 py-3 shadow-[0_2px_12px_rgba(13,29,52,0.05)] backdrop-blur-xl"><button onClick={onBack} aria-label="Retour à la liste" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#152641] transition hover:bg-[#F1EBDD] active:scale-95"><ArrowLeft size={21} /></button><div className="min-w-0 flex-1"><h1 className="truncate font-editorial text-[24px] font-semibold leading-5 text-[#0A1931]">{title}</h1>{subtitle ? <p className="mt-1 truncate text-[11px] text-[#6C7785]">{subtitle}</p> : null}</div>{headerRight}</header><div className="min-h-[calc(100dvh-4rem)] pb-8">{children}</div></section>;
}
