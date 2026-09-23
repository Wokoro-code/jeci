/** JECI admin settings: rôles RBAC et structures organisationnelles, branchés sur server/routers/admin.ts. */
import { Plus, ShieldCheck, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader, AdminPanel } from "@/components/AdminPrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

const roleLabels: Record<string, string> = {
  member: "Membre",
  mentor: "Mentor",
  moderator: "Modérateur",
  verification_officer: "Chargé de vérification",
  community_admin: "Administrateur de communauté",
  local_admin: "Administrateur local",
  national_admin: "Administrateur national",
  regional_admin: "Administrateur régional",
  international_admin: "Administrateur international",
  super_admin: "Super administrateur",
};
type AssignableRole = "mentor" | "moderator" | "verification_officer" | "community_admin" | "local_admin" | "national_admin" | "regional_admin" | "international_admin" | "super_admin";

export default function AdminSettings() {
  const utils = trpc.useUtils();
  const [showAddUnit, setShowAddUnit] = useState(false);

  const roleAssignmentsQuery = trpc.admin.roleAssignments.useQuery();
  const unitsQuery = trpc.admin.organizationalUnits.useQuery({});

  const revokeRole = trpc.admin.revokeRole.useMutation({
    onSuccess: () => {
      utils.admin.roleAssignments.invalidate();
      toast.success("Rôle retiré.");
    },
    onError: (error) => toast.error(error.message),
  });

  const createUnit = trpc.admin.createOrganizationalUnit.useMutation({
    onSuccess: () => {
      utils.admin.organizationalUnits.invalidate();
      setShowAddUnit(false);
      toast.success("Structure créée.");
    },
    onError: (error) => toast.error(error.message),
  });

  const elevatedRoles = (roleAssignmentsQuery.data ?? []).filter((row) => row.roleCode !== "member");

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader eyebrow="Configuration du portail" title="Paramètres d'administration" description="Gérez les rôles RBAC (mentor, modérateur, administrateurs scopés) et les structures organisationnelles." />
      <div className="space-y-5">
        <SettingsPanel icon={<ShieldCheck size={19} />} title="Rôles et permissions">
          {roleAssignmentsQuery.isLoading && <p className="py-4 text-xs text-[#728094]">Chargement...</p>}
          {elevatedRoles.map((row) => (
            <div key={`${row.userId}-${row.roleCode}-${row.scopeType}-${row.scopeId}`} className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="text-sm font-bold text-[#36445A]">{row.name}</p>
                <p className="mt-1 text-xs text-[#728094]">
                  {row.email} · <span className="font-bold text-[#8E742E]">{roleLabels[row.roleCode] ?? row.roleCode}</span>
                  {row.scopeType !== "global" && row.scopeId ? ` · périmètre #${row.scopeId}` : ""}
                </p>
              </div>
              <button
                onClick={() => revokeRole.mutate({ userId: row.userId, roleCode: row.roleCode as AssignableRole, reason: "Retrait décidé depuis les paramètres d'administration.", scope: { scopeType: row.scopeType, scopeId: row.scopeId ?? undefined } })}
                className="rounded-lg border border-[#D8DEE7] px-3 py-1.5 text-[11px] font-bold text-[#536174] hover:bg-[#F5F7FA]"
              >
                Retirer
              </button>
            </div>
          ))}
          {!roleAssignmentsQuery.isLoading && elevatedRoles.length === 0 && <p className="py-4 text-xs text-[#728094]">Aucun rôle élevé attribué pour l'instant.</p>}
          <p className="pt-4 text-[11px] text-[#8A94A2]">Pour attribuer un nouveau rôle, rendez-vous sur la fiche du membre dans la gestion des membres.</p>
        </SettingsPanel>

        <SettingsPanel
          icon={<UsersRound size={19} />}
          title="Structures organisationnelles"
          action={
            <button onClick={() => setShowAddUnit(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#10294D] px-3 py-2 text-[11px] font-extrabold text-white hover:bg-[#17355E]">
              <Plus size={14} /> Ajouter
            </button>
          }
        >
          {(unitsQuery.data ?? []).map((unit) => (
            <div key={unit.id} className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="text-sm font-bold text-[#36445A]">{unit.name}</p>
                <p className="mt-1 text-xs text-[#728094]">{unit.memberCount} membre(s)</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${unit.isActive ? "bg-[#EAF4EE] text-[#286146]" : "bg-[#EEF0F4] text-[#5D6878]"}`}>{unit.isActive ? "Active" : "Inactive"}</span>
            </div>
          ))}
          {(unitsQuery.data ?? []).length === 0 && <p className="py-4 text-xs text-[#728094]">Aucune structure créée pour l'instant.</p>}
        </SettingsPanel>
      </div>

      {showAddUnit && (
        <AddUnitModal onClose={() => setShowAddUnit(false)} isPending={createUnit.isPending} onSubmit={(input) => createUnit.mutate(input)} />
      )}
    </div>
  );
}

function SettingsPanel({ icon, title, action, children }: { icon: React.ReactNode; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <AdminPanel className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E8EDF5] text-[#344D75]">{icon}</span>
          <h2 className="pt-1 font-editorial text-[28px] font-semibold leading-6 text-[#15233B]">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-4 divide-y divide-[#E7EAF0] border-t border-[#E7EAF0]">{children}</div>
    </AdminPanel>
  );
}

function AddUnitModal({ onClose, onSubmit, isPending }: { onClose: () => void; isPending: boolean; onSubmit: (input: { name: string; level: "international" | "regional" | "national" | "local" | "group" }) => void }) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<"international" | "regional" | "national" | "local" | "group">("national");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom est requis.");
      return;
    }
    onSubmit({ name: name.trim(), level });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#091830]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#0B1931]">Ajouter une structure</h2>
          <button onClick={onClose} className="rounded-full p-1 text-[#7E8490] hover:bg-[#F3F0EA]">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="unit-name">Nom</Label>
            <Input id="unit-name" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit-level">Niveau</Label>
            <select id="unit-level" value={level} onChange={(event) => setLevel(event.target.value as typeof level)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="international">International</option>
              <option value="regional">Régional</option>
              <option value="national">Mouvement national</option>
              <option value="local">Structure locale</option>
              <option value="group">Groupe / équipe</option>
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Création..." : "Créer la structure"}
          </Button>
        </form>
      </div>
    </div>
  );
}
