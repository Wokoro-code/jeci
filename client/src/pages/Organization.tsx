/** JECI — Organisation : parcourt la hiérarchie JECI configurable (international → régional → national → local → groupe). */
import { useState } from "react";
import { ArrowUpRight, ChevronRight, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { PageIntro, Panel } from "@/components/UiPrimitives";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const palette = ["bg-[#10294D]", "bg-[#8E681B]", "bg-[#286146]", "bg-[#9E323A]", "bg-[#4B5568]"];
const levelLabels: Record<string, string> = { international: "International", regional: "Régional", national: "Mouvement national", local: "Structure locale", group: "Groupe / équipe" };

export default function Organization() {
  const { user } = useAuth();
  const overviewQuery = trpc.account.overview.useQuery(undefined, { enabled: Boolean(user) });
  // La racine (JECI International) n'a pas de parent : parentId = null.
  const [parentId, setParentId] = useState<number | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: number | null; name: string }[]>([{ id: null, name: "JECI International" }]);

  const unitsQuery = trpc.account.organizationalUnits.useQuery({ parentId: parentId ?? undefined });
  const units = unitsQuery.data ?? [];
  const myUnitId = overviewQuery.data?.profile?.unitId;

  function openUnit(unit: { id: number; name: string }) {
    setParentId(unit.id);
    setBreadcrumb((prev) => [...prev, { id: unit.id, name: unit.name }]);
  }
  function goToBreadcrumb(index: number) {
    setBreadcrumb((prev) => prev.slice(0, index + 1));
    setParentId(breadcrumb[index].id);
  }

  return (
    <div>
      <PageIntro
        eyebrow="Architecture JECI"
        title="Une organisation mondiale, des racines locales."
        description="De JECI International jusqu'à votre groupe, retrouvez chaque niveau de l'organisation et son espace vivant : membres, discussions, projets."
      />

      <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs font-semibold text-[#657085]">
        {breadcrumb.map((crumb, index) => (
          <span key={`${crumb.id}-${index}`} className="flex items-center gap-1">
            {index > 0 && <ChevronRight size={12} />}
            <button onClick={() => goToBreadcrumb(index)} className={index === breadcrumb.length - 1 ? "text-[#10203A]" : "hover:text-[#10203A]"}>{crumb.name}</button>
          </span>
        ))}
      </nav>

      {unitsQuery.isLoading && <p className="text-sm text-[#707787]">Chargement de la structure...</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {units.map((unit, index) => (
          <Panel key={unit.id} className="overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(10,32,63,0.1)]">
            <div className={`h-2 ${palette[index % palette.length]}`} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#3B32A0]">{unit.localTypeLabel || levelLabels[unit.level] || unit.level}</span>
                  <h3 className="mt-1 font-editorial text-2xl font-semibold leading-tight text-[#10203A]">{unit.name}</h3>
                </div>
                {unit.id === myUnitId && <span className="shrink-0 rounded-full bg-[#E3E0FA] px-2 py-0.5 text-[10px] font-extrabold text-[#2A2270]">Ma structure</span>}
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs font-bold text-[#536070]">
                <UsersRound size={16} />
                {unit.memberCount} membre{Number(unit.memberCount) > 1 ? "s" : ""}
              </p>
              {!unit.isActive && <span className="mt-2 inline-flex rounded-full bg-[#F2F3F5] px-2.5 py-1 text-[10px] font-extrabold text-[#596372]">Inactive</span>}
              <div className="mt-5 flex items-center justify-between border-t border-[#EEEAE3] pt-4">
                <button onClick={() => openUnit(unit)} className="flex items-center gap-1 text-xs font-extrabold text-[#172842] transition hover:gap-2">
                  Voir les structures rattachées <ChevronRight size={14} />
                </button>
                <Link href={`/organisation/${unit.id}`} className="flex items-center gap-1 text-xs font-semibold text-[#657085] transition hover:text-[#10203A]">
                  Espace <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {!unitsQuery.isLoading && units.length === 0 && (
        <Panel className="mt-4 p-10 text-center">
          <p className="font-editorial text-2xl font-semibold text-[#10213D]">Aucune structure à ce niveau pour l'instant.</p>
          <p className="mt-2 text-xs text-[#707787]">Un administrateur habilité peut créer une structure depuis l'administration.</p>
        </Panel>
      )}
    </div>
  );
}
