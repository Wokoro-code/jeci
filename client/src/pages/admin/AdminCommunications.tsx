/** JECI admin communications: campagnes réelles, branchées sur server/routers/admin.ts. */
import { BarChart3, Mail, Plus, Send, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader, AdminPanel, StatusBadge } from "@/components/AdminPrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const segmentLabels: Record<string, string> = { all: "Tous les membres", verified: "Membres vérifiés", mentors: "Mentors actifs", unit: "Structure spécifique" };

export default function AdminCommunications() {
  const utils = trpc.useUtils();
  const [composerOpen, setComposerOpen] = useState(false);

  const campaignsQuery = trpc.admin.campaigns.useQuery();

  const createCampaign = trpc.admin.createCampaign.useMutation({
    onSuccess: (data) => {
      utils.admin.campaigns.invalidate();
      setComposerOpen(false);
      toast.success("Communication enregistrée en brouillon. Vous pouvez l'envoyer depuis la liste.");
      void data;
    },
    onError: (error) => toast.error(error.message),
  });

  const sendCampaign = trpc.admin.sendCampaign.useMutation({
    onSuccess: (data) => {
      utils.admin.campaigns.invalidate();
      toast.success(`Envoyée à ${data.recipientCount} destinataire(s).`);
    },
    onError: (error) => toast.error(error.message),
  });

  const campaigns = campaignsQuery.data ?? [];
  const sentCount = campaigns.filter((campaign) => campaign.status === "sent").length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Voix de la communauté"
        title="Communications"
        description="Préparez les messages du réseau, ciblez les bons segments et suivez leur diffusion."
        action={
          <button onClick={() => setComposerOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#10294D] px-4 py-3 text-xs font-extrabold text-white hover:bg-[#17355E]">
            <Plus size={17} /> Nouvelle communication
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Metric icon={<Mail size={19} />} label="Communications envoyées" value={String(sentCount)} />
        <Metric icon={<BarChart3 size={19} />} label="Communications totales" value={String(campaigns.length)} />
      </div>
      <AdminPanel className="mt-6 overflow-hidden">
        <div className="border-b border-[#E1E5EB] px-5 py-4">
          <h2 className="font-editorial text-[29px] font-semibold text-[#10213A]">Historique des campagnes</h2>
        </div>
        <div className="divide-y divide-[#E5E8ED]">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#EEF2F7] text-[#254C79]">
                  <Send size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#1D2B42]">{campaign.title}</p>
                  <p className="mt-1 text-[11px] text-[#6C7788]">
                    {segmentLabels[campaign.segment] ?? campaign.segment} · {new Date(campaign.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={campaign.status === "sent" ? "Envoyée" : "Brouillon"} />
                {campaign.status !== "sent" && (
                  <button onClick={() => sendCampaign.mutate({ campaignId: campaign.id })} disabled={sendCampaign.isPending} className="text-xs font-extrabold text-[#173D6C] hover:underline disabled:opacity-50">
                    Envoyer maintenant
                  </button>
                )}
              </div>
            </div>
          ))}
          {campaigns.length === 0 && <p className="p-5 text-xs text-[#728094]">Aucune communication pour l'instant.</p>}
        </div>
      </AdminPanel>
      {composerOpen && <ComposerModal onClose={() => setComposerOpen(false)} isPending={createCampaign.isPending} onSubmit={(input) => createCampaign.mutate(input)} />}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <AdminPanel className="p-5">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E5EFFB] text-[#235D98]">{icon}</span>
      <p className="mt-4 text-xs font-bold text-[#617084]">{label}</p>
      <p className="mt-1 font-editorial text-[40px] font-semibold leading-8 text-[#10213A]">{value}</p>
    </AdminPanel>
  );
}

function ComposerModal({ onClose, onSubmit, isPending }: { onClose: () => void; isPending: boolean; onSubmit: (input: { title: string; body: string; segment: "all" | "verified" | "mentors" | "unit" }) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState<"all" | "verified" | "mentors" | "unit">("all");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;
    onSubmit({ title: title.trim(), body: body.trim(), segment });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#0A1932]/35 p-3 backdrop-blur-[2px] sm:items-center" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E1E5EB] px-5 py-4">
          <div>
            <p className="font-editorial text-[28px] font-semibold text-[#10213A]">Nouvelle communication</p>
            <p className="mt-1 text-xs text-[#708095]">Elle apparaîtra comme notification pour chaque destinataire du segment choisi.</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#F2F4F7]">
            <X size={19} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-title">Objet</Label>
            <Input id="campaign-title" value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Ex. Votre programme d'octobre" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="campaign-segment">Audience</Label>
            <select id="campaign-segment" value={segment} onChange={(event) => setSegment(event.target.value as typeof segment)} className="h-11 w-full rounded-lg border border-[#D7DEE7] bg-white px-3 text-sm outline-none">
              {Object.entries(segmentLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="campaign-body">Message</Label>
            <Textarea id="campaign-body" rows={5} value={body} onChange={(event) => setBody(event.target.value)} required placeholder="Rédigez un message clair, utile et fidèle au ton JEC…" />
          </div>
          <div className="flex justify-end gap-2 border-t border-[#E7EAF0] pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-xs font-bold text-[#5F6D80] hover:bg-[#F3F5F8]">
              Annuler
            </button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement..." : "Enregistrer le brouillon"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
