/** JECI primitives: restrained cards, editorial headings and accessible image fallbacks. */
import { type ReactNode } from "react";
import { Link } from "wouter";
import { type JecStatus, jecStatusColors, jecStatusLabels } from "@/lib/jecStatus";

/** Enrobe un nom ou une photo pour qu'un clic ouvre le profil public du membre, partout dans l'application. */
export function ProfileLink({ userId, className = "", children }: { userId: number | null | undefined; className?: string; children: ReactNode }) {
  if (!userId) return <span className={className}>{children}</span>;
  return (
    <Link href={`/profil/${userId}`} className={className} onClick={(event) => event.stopPropagation()}>
      {children}
    </Link>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-[#E6E1D9] bg-white shadow-[0_4px_15px_rgba(10,32,63,0.045)] ${className}`}>{children}</section>;
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="max-w-2xl">
      {eyebrow && <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#294668]">{eyebrow}</p>}
      <h1 className="font-editorial text-[34px] font-semibold leading-[0.98] tracking-[-0.035em] text-[#07162E] sm:text-[43px]">{title}</h1>
      {description && <p className="mt-3 max-w-xl text-sm leading-6 text-[#687080]">{description}</p>}
    </div>
    {action}
  </div>;
}

export function Avatar({ src, alt, size = "md", className = "" }: { src?: string; alt: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const dimensions = size === "sm" ? "h-9 w-9 text-[11px]" : size === "lg" ? "h-16 w-16 text-lg" : "h-11 w-11 text-sm";
  if (!src) {
    const initials = alt
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return (
      <div aria-label={alt} className={`grid ${dimensions} shrink-0 place-items-center rounded-full border border-[#E5E0D9] bg-[#EFF2F5] font-bold text-[#435873] ${className}`}>
        {initials || "?"}
      </div>
    );
  }
  return <img src={src} alt={alt} className={`${dimensions} shrink-0 rounded-full border border-[#E5E0D9] object-cover ${className}`} />;
}

export function EventDate({ day, month, dark = false }: { day: string; month: string; dark?: boolean }) {
  return <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border ${dark ? "border-[#111] bg-black text-white" : "border-[#F0A366] bg-[#FBE0C8] text-[#8A3F10]"}`}><span className="text-[10px] font-extrabold tracking-[0.08em]">{month}</span><span className="font-editorial text-[24px] font-bold leading-5">{day}</span></div>;
}

export function JecStatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const colors = jecStatusColors[status as JecStatus] ?? jecStatusColors.supporter;
  const label = jecStatusLabels[status as JecStatus] ?? status;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.05em] ${className}`} style={{ backgroundColor: colors.bg, color: colors.text }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.dot }} />
      {label}
    </span>
  );
}
