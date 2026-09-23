/** JECI admin visual system: analytical clarity, institutional restraint, significant use of promotion gold. */
import * as Icons from "lucide-react";
import { type ReactNode } from "react";

export function AdminPanel({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`rounded-xl border border-[#D9DEE8] bg-white shadow-[0_4px_18px_rgba(22,39,68,0.045)] ${className}`}>{children}</section>; }

export function AdminPageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#977426]">{eyebrow}</p>}<h1 className="font-editorial text-[37px] font-semibold leading-[0.98] tracking-[-0.04em] text-[#0B1730] sm:text-[46px]">{title}</h1><p className="mt-2 text-sm text-[#667185]">{description}</p></div>{action}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = { "Vérifié": "bg-[#E7F3FB] text-[#2675B8]", "En attente": "bg-[#FFF5DE] text-[#956912]", "À valider": "bg-[#FFF5DE] text-[#956912]", "À examiner": "bg-[#FFF0ED] text-[#A54436]", "Critique": "bg-[#FCE8E8] text-[#A12A32]", "Publié": "bg-[#EAF4EE] text-[#286146]", "Brouillon": "bg-[#EDF0F4] text-[#5D6878]", "Expiré": "bg-[#F2F0EE] text-[#79736C]", "Actif": "bg-[#EAF4EE] text-[#286146]", "Planifiée": "bg-[#E7F3FB] text-[#2675B8]", "Envoyée": "bg-[#EAF4EE] text-[#286146]" };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${styles[status] ?? "bg-[#EEF0F4] text-[#596574]"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}

export function AdminStatCard({ label, value, delta, icon, tone }: { label: string; value: string; delta: string; icon: string; tone: "blue" | "gold" | "red" | "slate" }) {
  const Icon = Icons[icon as keyof typeof Icons] as React.ComponentType<{ size?: number }>;
  const toneClass = { blue: "bg-[#E5EFFB] text-[#235D98]", gold: "bg-[#FBEAC0] text-[#8A6416]", red: "bg-[#FBE2E3] text-[#A23137]", slate: "bg-[#E8EDF5] text-[#344D75]" }[tone];
  const deltaClass = tone === "red" ? "bg-[#FCE8E8] text-[#A54436]" : tone === "gold" ? "bg-[#FFF5DE] text-[#956912]" : "bg-[#F0F3F8] text-[#607087]";
  return <AdminPanel className="p-5"><div className="flex items-start justify-between gap-2"><span className={`grid h-10 w-10 place-items-center rounded-full ${toneClass}`}><Icon size={20} /></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${deltaClass}`}>{delta}</span></div><p className="mt-5 text-sm font-semibold text-[#536074]">{label}</p><p className="mt-1 font-editorial text-[51px] font-semibold leading-none tracking-[-0.05em] text-[#0B1730]">{value}</p></AdminPanel>;
}

export function AdminAvatar({ src, name, size = "md" }: { src?: string; name: string; size?: "sm" | "md" }) { const dimensions = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm"; return src ? <img src={src} alt={name} className={`${dimensions} shrink-0 rounded-full border border-[#DDE1E8] object-cover`} /> : <span className={`${dimensions} grid shrink-0 place-items-center rounded-full border border-[#CDD4DF] bg-[#EEF1F5] font-bold text-[#738095]`}>{name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span>; }
