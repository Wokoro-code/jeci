/** JECI — Registre des membres, branché sur server/routers/admin.ts. */
import { MoreVertical, Search, ShieldAlert, UserCog, UserRound, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminAvatar, AdminPageHeader, AdminPanel, StatusBadge } from "@/components/AdminPrimitives";
import { JecStatusBadge } from "@/components/UiPrimitives";
import { MobileFilterSheet, MobileQueryBar } from "@/components/MobileQueryControls";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";

const statusLabels: Record<string, string> = { verified: "Vérifié", pending_verification: "En attente", rejected: "Refusé", suspended: "Suspendu", deactivated: "Désactivé" };
type AssignableRole = "mentor" | "moderator" | "verification_officer" | "community_admin" | "local_admin" | "national_admin" | "regional_admin" | "international_admin" | "super_admin";

type Member = { id: number; name: string | null; email: string | null; accountStatus: string; role: string; jobTitle: string | null; organization: string | null; jecStatus: string | null; unitName: string | null };

export default function AdminMembers() {
  const utils = trpc.useUtils();
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState<string>("Tous");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<Member | null>(null);

  const statusFilter = status === "Tous" ? undefined : (Object.entries(statusLabels).find(([, label]) => label === status)?.[0] as Member["accountStatus"] | undefined);
  const membersQuery = trpc.admin.members.useQuery({ search: term || undefined, status: statusFilter as never });

  const assignRole = trpc.admin.assignRole.useMutation({
    onSuccess: () => {
      utils.admin.members.invalidate();
      toast.success("Rôle attribué.");
    },
    onError: (error) => toast.error(error.message),
  });

  const suspendMutation = trpc.admin.suspendMember.useMutation({
    onSuccess: () => {
      utils.admin.members.invalidate();
      setSuspendTarget(null);
      toast.success("Membre suspendu.");
    },
    onError: (error) => toast.error(error.message),
  });

  const reactivateMutation = trpc.admin.reactivateMember.useMutation({
    onSuccess: () => {
      utils.admin.members.invalidate();
      toast.success("Membre réactivé.");
    },
    onError: (error) => toast.error(error.message),
  });

  const rows = (membersQuery.data ?? []) as unknown as Member[];
  const activeFilters = status !== "Tous" ? 1 : 0;
  const resetFilters = () => setStatus("Tous");
  const statusOptions = ["Tous", ...Object.values(statusLabels)];

  return (
    <div>
      <AdminPageHeader eyebrow="Annuaire et droits membres" title="Gestion des membres" description="Gérez l'annuaire des Jécistes et anciens Jécistes, leurs statuts de vérification et leurs accès au réseau." />
      <MobileQueryBar value={term} onChange={setTerm} placeholder="Rechercher un membre…" onOpenFilters={() => setMobileFilterOpen(true)} filterCount={activeFilters} filterLabel="Filtrer les membres" />
      <AdminPanel className="hidden p-4 sm:p-5 lg:block">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_0.58fr]">
          <label className="relative">
            <span className="mb-1.5 block text-[11px] font-bold text-[#5C687A]">Rechercher</span>
            <Search size={18} className="absolute bottom-3 left-3 text-[#748095]" />
            <input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Nom ou e-mail…" className="h-11 w-full rounded-lg border border-[#D7DDE6] bg-[#FCFDFE] pl-10 pr-3 text-sm outline-none transition focus:border-[#14345D] focus:ring-4 focus:ring-[#E3EBF7]" />
          </label>
          <label>
            <span className="mb-1.5 block text-[11px] font-bold text-[#5C687A]">Statut</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 w-full rounded-lg border border-[#D7DDE6] bg-[#FCFDFE] px-3 text-sm outline-none focus:border-[#14345D]">
              {statusOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </AdminPanel>
      {mobileFilterOpen ? (
        <MobileFilterSheet title="Filtrer les membres" description="Affinez la liste selon le statut de vérification." onClose={() => setMobileFilterOpen(false)} onReset={resetFilters} resetDisabled={!activeFilters} applyLabel={`Afficher ${rows.length} membres`}>
          <div className="mt-5 grid gap-4">
            <label>
              <span className="mb-1.5 block text-[11px] font-bold text-[#5C687A]">Statut</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 w-full rounded-lg border border-[#D7DDE6] bg-white px-3 text-sm outline-none focus:border-[#14345D]">
                {statusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </MobileFilterSheet>
      ) : null}

      {membersQuery.isLoading && <p className="mt-4 text-sm text-[#707787]">Chargement des membres...</p>}

      <div className="mt-5 hidden overflow-hidden rounded-xl border border-[#D9DEE8] bg-white shadow-[0_4px_18px_rgba(22,39,68,0.045)] lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-[#F0F3F9] text-[11px] uppercase tracking-[0.08em] text-[#43516A]">
              <tr>
                <th className="px-5 py-4">Membre</th>
                <th className="px-4 py-4">Statut JEC</th>
                <th className="px-4 py-4">Structure</th>
                <th className="px-4 py-4">Profession</th>
                <th className="px-4 py-4">Compte</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {rows.map((person) => (
                <tr key={person.id} className="transition hover:bg-[#FBFCFE]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <AdminAvatar name={person.name ?? "Membre"} />
                      <div>
                        <p className="text-sm font-bold text-[#17253C]">{person.name}</p>
                        <p className="mt-1 text-[11px] text-[#6C7789]">{person.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <JecStatusBadge status={person.jecStatus ?? "alumni_jeciste"} />
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-[#46546A]">{person.unitName ?? "—"}</td>
                  <td className="px-4 py-4 text-sm text-[#46546A]">{[person.jobTitle, person.organization].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={statusLabels[person.accountStatus] ?? person.accountStatus} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <MemberActions person={person} onAssignRole={(roleCode) => assignRole.mutate({ userId: person.id, roleCode, reason: `Attribué depuis la gestion des membres` })} onSuspend={() => setSuspendTarget(person)} onReactivate={() => reactivateMutation.mutate({ userId: person.id })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 space-y-3 lg:hidden">
        {rows.map((person) => (
          <AdminPanel key={person.id} className="p-4">
            <div className="flex items-start gap-3">
              <AdminAvatar name={person.name ?? "Membre"} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-[#17253C]">{person.name}</p>
                  <StatusBadge status={statusLabels[person.accountStatus] ?? person.accountStatus} />
                </div>
                <p className="mt-1 text-xs text-[#687487]">{[person.jobTitle, person.organization].filter(Boolean).join(" · ") || "—"}</p>
                <div className="mt-1.5">
                  <JecStatusBadge status={person.jecStatus ?? "alumni_jeciste"} />
                </div>
                <p className="mt-1 text-[11px] text-[#8A94A2]">{person.email}</p>
              </div>
              <MemberActions person={person} onAssignRole={(roleCode) => assignRole.mutate({ userId: person.id, roleCode, reason: `Attribué depuis la gestion des membres` })} onSuspend={() => setSuspendTarget(person)} onReactivate={() => reactivateMutation.mutate({ userId: person.id })} />
            </div>
          </AdminPanel>
        ))}
      </div>

      {!membersQuery.isLoading && rows.length === 0 && (
        <AdminPanel className="mt-5 p-10 text-center">
          <UserRound className="mx-auto text-[#7A8799]" size={28} />
          <p className="mt-3 font-editorial text-2xl font-semibold text-[#14223A]">Aucun membre trouvé.</p>
        </AdminPanel>
      )}

      <AlertDialog open={suspendTarget !== null} onOpenChange={(open) => !open && setSuspendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspendre {suspendTarget?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>Le compte ne pourra plus se connecter ni interagir avec le réseau. Cette suspension est réversible et journalisée.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => suspendTarget && suspendMutation.mutate({ userId: suspendTarget.id, reason: "Suspension décidée depuis la gestion des membres." })} className="bg-[#9E323A] hover:bg-[#87262E]">
              Suspendre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MemberActions({ person, onAssignRole, onSuspend, onReactivate }: { person: Member; onAssignRole: (roleCode: AssignableRole) => void; onSuspend: () => void; onReactivate: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label={`Actions pour ${person.name}`} className="rounded-full p-2 text-[#667388] hover:bg-[#EEF2F7]">
          <MoreVertical size={19} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAssignRole("moderator")}>
          <ShieldAlert size={15} className="mr-2" /> Nommer modérateur
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAssignRole("national_admin")}>
          <UserCog size={15} className="mr-2" /> Nommer administrateur national
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAssignRole("super_admin")}>
          <UserCog size={15} className="mr-2" /> Nommer super administrateur
        </DropdownMenuItem>
        {person.accountStatus === "suspended" ? (
          <DropdownMenuItem onClick={onReactivate}>
            <UserRound size={15} className="mr-2" /> Réactiver le compte
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onSuspend} className="text-[#9E323A] focus:text-[#9E323A]">
            <UserX size={15} className="mr-2" /> Suspendre le compte
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
