/** JECI mobile query controls: fixed search entry points and accessible bottom-sheet filters, hidden on desktop. */
import { Check, Search, SlidersHorizontal, X } from "lucide-react";
import { type ReactNode } from "react";

type MobileQueryBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onOpenFilters?: () => void;
  filterCount?: number;
  filterLabel?: string;
};

export function MobileQueryBar({ value, onChange, placeholder, onOpenFilters, filterCount = 0, filterLabel = "Ouvrir les filtres" }: MobileQueryBarProps) {
  return <div className="sticky top-16 z-20 -mx-4 mb-5 border-y border-[#E5E0D8] bg-[#FDFBF7]/95 px-4 py-3 shadow-[0_7px_16px_rgba(14,30,53,0.07)] backdrop-blur-xl lg:hidden"><div className="flex gap-2"><label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717985]" size={18} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-[#DDD8D0] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#0A1931] focus:ring-4 focus:ring-[#E1E8F2]" /></label>{onOpenFilters ? <button onClick={onOpenFilters} aria-label={filterLabel} aria-haspopup="dialog" className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition active:scale-95 ${filterCount ? "border-[#7A6FE0] bg-[#E3E0FA] text-[#2A2270]" : "border-[#D9D5CE] bg-white text-[#142039] hover:bg-[#F5F0E7]"}`}><SlidersHorizontal size={19} />{filterCount ? <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#A5232A] px-1 text-[9px] font-extrabold text-white">{filterCount}</span> : null}</button> : null}</div></div>;
}

export function MobileFilterTrigger({ label, onOpenFilters, filterCount = 0 }: { label: string; onOpenFilters: () => void; filterCount?: number }) {
  return <div className="sticky top-16 z-20 -mx-4 mb-5 border-y border-[#E5E0D8] bg-[#FDFBF7]/95 px-4 py-3 shadow-[0_7px_16px_rgba(14,30,53,0.07)] backdrop-blur-xl lg:hidden"><button onClick={onOpenFilters} aria-label={`Filtrer : ${label}`} aria-haspopup="dialog" className={`flex h-11 w-full items-center justify-between rounded-xl border px-4 text-sm font-bold transition active:scale-[0.99] ${filterCount ? "border-[#7A6FE0] bg-[#FFF8E9] text-[#2A2270]" : "border-[#D9D5CE] bg-white text-[#142039] hover:bg-[#F5F0E7]"}`}><span className="flex items-center gap-2"><SlidersHorizontal size={18} />{label}</span>{filterCount ? <span className="rounded-full bg-[#A5232A] px-2 py-0.5 text-[10px] font-extrabold text-white">{filterCount}</span> : <span className="text-[11px] font-semibold text-[#788290]">Tous</span>}</button></div>;
}

type MobileFilterSheetProps = { title: string; description?: string; onClose: () => void; onReset?: () => void; resetDisabled?: boolean; applyLabel: string; children: ReactNode; };

export function MobileFilterSheet({ title, description, onClose, onReset, resetDisabled = false, applyLabel, children }: MobileFilterSheetProps) {
  return <div className="fixed inset-0 z-[70] bg-[#091830]/35 backdrop-blur-[2px] lg:hidden" role="presentation" onClick={onClose}><section role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()} className="absolute bottom-0 left-0 right-0 max-h-[82dvh] overflow-y-auto rounded-t-[1.5rem] bg-[#FDFBF7] shadow-[0_-12px_34px_rgba(10,25,48,0.2)]"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8E2D9] bg-[#FDFBF7]/95 px-5 py-4 backdrop-blur-xl"><div><p className="font-editorial text-[28px] font-semibold leading-6 text-[#0A1931]">{title}</p>{description ? <p className="mt-1 text-[11px] text-[#727C89]">{description}</p> : null}</div><button onClick={onClose} aria-label="Fermer" className="grid h-10 w-10 place-items-center rounded-full text-[#26354E] hover:bg-[#F1EBDD] active:scale-95"><X size={20} /></button></div><div className="px-5 pb-5">{children}<div className="mt-6 flex items-center gap-3 border-t border-[#E8E2D9] pt-4">{onReset ? <button onClick={onReset} className={`text-xs font-bold underline ${resetDisabled ? "text-[#9AA1AA]" : "text-[#946917]"}`} disabled={resetDisabled}>Réinitialiser</button> : null}<button onClick={onClose} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#0A1931] px-4 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#172B4B] active:scale-[0.98]"><Check size={16} /> {applyLabel}</button></div></div></section></div>;
}
