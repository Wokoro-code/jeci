/** JECI admin opportunity form: création réelle, publiée immédiatement (admin.decideOpportunity). */
import { ArrowLeft, BriefcaseBusiness, Send } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { AdminPageHeader, AdminPanel } from "@/components/AdminPrimitives";
import { trpc } from "@/lib/trpc";

const typeLabels: Record<string, string> = { job: "CDI / Emploi", internship: "Stage", volunteering: "Bénévolat", scholarship: "Bourse", training: "Formation", call_for_projects: "Appel à projets", funding: "Financement", mission: "Mission", expertise: "Expertise", other: "Autre" };

export default function AdminOpportunityCreate() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [type, setType] = useState<"job" | "internship" | "volunteering" | "scholarship" | "training" | "call_for_projects" | "funding" | "mission" | "expertise" | "other">("job");
  const [location, setLocation2] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [description, setDescription] = useState("");

  const createOpportunity = trpc.opportunities.create.useMutation();
  const decideOpportunity = trpc.admin.decideOpportunity.useMutation();

  const isPending = createOpportunity.isPending || decideOpportunity.isPending;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || description.trim().length < 10) {
      toast.error("Titre et description (10 caractères minimum) sont requis.");
      return;
    }
    createOpportunity.mutate(
      { title: title.trim(), type, organization: organization.trim() || undefined, location: location.trim() || undefined, applyUrl: applyUrl.trim() || undefined, contactEmail: contactEmail.trim() || undefined, description: description.trim() },
      {
        onSuccess: (data) => {
          decideOpportunity.mutate(
            { opportunityId: data.opportunityId, decision: "published" },
            {
              onSuccess: () => {
                toast.success(`L'offre « ${title} » est publiée.`);
                setLocation("/admin/opportunities");
              },
              onError: (error) => toast.error(error.message),
            },
          );
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/opportunities" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#617084] hover:text-[#173A67]">
        <ArrowLeft size={16} /> Retour aux opportunités
      </Link>
      <AdminPageHeader eyebrow="Emploi et mobilité" title="Créer une opportunité" description="Publiée immédiatement (vous êtes administrateur)." />
      <form onSubmit={handleSubmit} className="space-y-5">
        <AdminPanel className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E5EFFB] text-[#235D98]">
              <BriefcaseBusiness size={19} />
            </span>
            <div>
              <h2 className="font-editorial text-[28px] font-semibold text-[#13223B]">Informations principales</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Intitulé du poste">
              <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Ex. Directeur·rice juridique" className="input-admin" />
            </Field>
            <Field label="Organisation">
              <input value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder="Ex. Groupe Aster" className="input-admin" />
            </Field>
            <Field label="Type">
              <select value={type} onChange={(event) => setType(event.target.value as typeof type)} className="input-admin">
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Localisation">
              <input value={location} onChange={(event) => setLocation2(event.target.value)} placeholder="Ex. Paris / hybride" className="input-admin" />
            </Field>
          </div>
          <Field label="Description de la mission" className="mt-4">
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} required placeholder="Décrivez le contexte, les responsabilités et ce qui rend cette opportunité pertinente pour le réseau…" className="input-admin min-h-36 resize-y py-3" />
          </Field>
        </AdminPanel>
        <AdminPanel className="p-5 sm:p-6">
          <h2 className="font-editorial text-[28px] font-semibold text-[#13223B]">Diffusion</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Lien de candidature (optionnel)">
              <input type="url" value={applyUrl} onChange={(event) => setApplyUrl(event.target.value)} placeholder="https://..." className="input-admin" />
            </Field>
            <Field label="Contact recruteur (optionnel)">
              <input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="contact@entreprise.fr" className="input-admin" />
            </Field>
          </div>
        </AdminPanel>
        <div className="flex flex-col justify-end gap-2 sm:flex-row">
          <Link href="/admin/opportunities" className="rounded-lg px-4 py-3 text-center text-xs font-bold text-[#617084] hover:bg-[#EEF2F7]">
            Annuler
          </Link>
          <button type="submit" disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#10294D] px-4 py-3 text-xs font-extrabold text-white hover:bg-[#17355E] disabled:opacity-50">
            <Send size={16} /> {isPending ? "Publication..." : "Publier l'offre"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-bold text-[#5D697B]">{label}</span>
      {children}
    </label>
  );
}
