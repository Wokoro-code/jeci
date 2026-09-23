/** JECI admin content: modération réelle des publications et signalements, branchée sur server/routers/admin.ts. */
import { Check, Eye, Flag, MoreVertical, Search, ShieldAlert, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MobileFilterSheet, MobileFilterTrigger, MobileQueryBar } from "@/components/MobileQueryControls";
import { AdminAvatar, AdminPageHeader, AdminPanel, StatusBadge } from "@/components/AdminPrimitives";
import { trpc } from "@/lib/trpc";

export function AdminPublications() {
  const utils = trpc.useUtils();
  const [term, setTerm] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: number; authorName: string | null } | null>(null);
  const postsQuery = trpc.admin.recentPosts.useQuery();

  const moderatePost = trpc.admin.moderatePost.useMutation({
    onSuccess: () => {
      utils.admin.recentPosts.invalidate();
      setPendingDelete(null);
      toast.success("Publication mise à jour.");
    },
    onError: (error) => toast.error(error.message),
  });

  const items = useMemo(() => (postsQuery.data ?? []).filter((post) => `${post.authorName ?? ""} ${post.body}`.toLowerCase().includes(term.toLowerCase())), [postsQuery.data, term]);

  return (
    <div>
      <AdminPageHeader eyebrow="Régulation éditoriale" title="Gestion des publications" description="Consultez l'activité éditoriale du réseau et intervenez lorsque la charte le nécessite." />
      <MobileQueryBar value={term} onChange={setTerm} placeholder="Rechercher une publication…" />
      <AdminPanel className="hidden p-4 lg:block">
        <label className="relative block max-w-lg">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#738095]" />
          <input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Rechercher une publication ou un auteur…" className="h-11 w-full rounded-lg border border-[#D8DEE7] bg-[#FCFDFE] pl-10 pr-3 text-sm outline-none focus:border-[#17355E] focus:ring-4 focus:ring-[#E3EBF7]" />
        </label>
      </AdminPanel>
      {postsQuery.isLoading && <p className="mt-4 text-sm text-[#707787]">Chargement...</p>}
      <div className="mt-5 space-y-4">
        {items.map((post) => (
          <AdminPanel key={post.id} className="overflow-hidden">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <AdminAvatar name={post.authorName ?? "Jéciste"} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#17253C]">{post.authorName}</p>
                    {post.hiddenAt && <StatusBadge status="Critique" />}
                  </div>
                  <p className="mt-1 text-[11px] text-[#748094]">{new Date(post.createdAt).toLocaleDateString("fr-FR")}</p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[#4D5B70]">{post.body}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="Actions" className="self-start rounded-full p-2 text-[#667388] hover:bg-[#EEF2F7]">
                    <MoreVertical size={19} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toast.info("Ouverture de la publication dans le fil membre à venir.")}>
                    <Eye size={15} className="mr-2" /> Voir dans le fil
                  </DropdownMenuItem>
                  {!post.hiddenAt && (
                    <DropdownMenuItem onClick={() => moderatePost.mutate({ postId: post.id, action: "hide", reason: "Contenu masqué pour examen." })}>
                      <ShieldAlert size={15} className="mr-2" /> Masquer temporairement
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setPendingDelete({ id: post.id, authorName: post.authorName })} className="text-[#9E323A] focus:text-[#9E323A]">
                    <Trash2 size={15} className="mr-2" /> Retirer définitivement
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E6EB] bg-[#FBFCFD] px-5 py-3">
              <p className="text-[11px] font-bold text-[#6A7587]">
                {post.reactionCount} réactions · {post.commentCount} commentaires
              </p>
            </div>
          </AdminPanel>
        ))}
      </div>
      {!postsQuery.isLoading && items.length === 0 && <Empty title="Aucune publication trouvée." action={() => setTerm("")} />}
      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer définitivement cette publication ?</AlertDialogTitle>
            <AlertDialogDescription>Le contenu de {pendingDelete?.authorName ?? "ce membre"} sera retiré du réseau. Cette action est journalisée et irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingDelete && moderatePost.mutate({ postId: pendingDelete.id, action: "delete", reason: "Contenu non conforme à la charte." })} className="bg-[#9E323A] hover:bg-[#87262E]">
              Retirer le contenu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const reasonLabels: Record<string, string> = { under_review: "À examiner", escalated: "Critique", resolved: "Résolu", dismissed: "Classé", open: "À examiner" };

export function AdminReports() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState("Tous");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{ id: number; reporterName: string } | null>(null);
  const reportsQuery = trpc.admin.reportQueue.useQuery();

  const decideReport = trpc.admin.decideReport.useMutation({
    onSuccess: () => {
      utils.admin.reportQueue.invalidate();
      setPendingRemoval(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const filters = ["Tous", "À examiner", "Critique"];
  const openRows = (reportsQuery.data ?? []).filter((item) => item.status === "open" || item.status === "under_review" || item.status === "escalated");
  const rows = openRows.filter((item) => filter === "Tous" || reasonLabels[item.status] === filter);
  const activeFilters = filter === "Tous" ? 0 : 1;
  const criticalCount = openRows.filter((r) => r.status === "escalated").length;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Sécurité et charte"
        title="Signalements à examiner"
        description="Traitez les remontées membres avec traçabilité, discernement et une réponse proportionnée."
        action={
          criticalCount > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#FCE8E8] px-3 py-2 text-xs font-extrabold text-[#9D323B]">
              <ShieldAlert size={15} /> {criticalCount} critique{criticalCount > 1 ? "s" : ""}
            </span>
          ) : undefined
        }
      />
      <MobileFilterTrigger label="Filtrer les signalements" onOpenFilters={() => setMobileFilterOpen(true)} filterCount={activeFilters} />
      <div className="mb-5 hidden gap-2 overflow-x-auto pb-1 lg:flex">
        {filters.map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold transition ${filter === item ? "bg-[#10294D] text-white" : "border border-[#D8DEE7] bg-white text-[#5D697B] hover:border-[#8593A6]"}`}>
            {item}
          </button>
        ))}
      </div>
      {reportsQuery.isLoading && <p className="text-sm text-[#707787]">Chargement...</p>}
      <div className="space-y-4">
        {rows.map((item) => (
          <AdminPanel key={item.id} className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-3">
                <AdminAvatar name={item.reporterName ?? "Jéciste"} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#17253C]">Signalé par {item.reporterName}</p>
                    <StatusBadge status={reasonLabels[item.status] ?? item.status} />
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-[#748094]">
                    {item.targetType} #{item.targetId} · {item.reason}
                  </p>
                  {item.details && <blockquote className="mt-3 border-l-2 border-[#7A6FE0] pl-3 text-sm italic leading-6 text-[#556277]">« {item.details} »</blockquote>}
                  <p className="mt-3 text-[11px] text-[#788396]">{new Date(item.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button onClick={() => decideReport.mutate({ reportId: item.id, decision: "dismissed", reason: "Contenu conservé après examen." })} className="inline-flex items-center gap-1 rounded-lg border border-[#D7DEE7] px-3 py-2 text-[11px] font-bold text-[#536174] hover:bg-[#F5F7FA]">
                  <Check size={14} /> Conserver
                </button>
                <button onClick={() => decideReport.mutate({ reportId: item.id, decision: "escalated" })} className="inline-flex items-center gap-1 rounded-lg border border-[#F0A366] px-3 py-2 text-[11px] font-bold text-[#8A3F10] hover:bg-[#FFF8EA]">
                  <Flag size={14} /> Escalader
                </button>
                <button onClick={() => setPendingRemoval({ id: item.id, reporterName: item.reporterName ?? "ce membre" })} className="inline-flex items-center gap-1 rounded-lg bg-[#9E323A] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#87262E]">
                  <X size={14} /> Résoudre
                </button>
              </div>
            </div>
          </AdminPanel>
        ))}
      </div>
      {!reportsQuery.isLoading && rows.length === 0 && <Empty title="Tous les signalements sont traités." action={() => setFilter("Tous")} />}
      {mobileFilterOpen ? (
        <MobileFilterSheet title="Filtrer les signalements" description="Organisez la file de modération selon la gravité des contenus." onClose={() => setMobileFilterOpen(false)} onReset={() => setFilter("Tous")} resetDisabled={!activeFilters} applyLabel={`Afficher ${rows.length} signalements`}>
          <div className="mt-5 space-y-2">
            {filters.map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={`block w-full rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${filter === item ? "border-[#7A6FE0] bg-[#FFF6DF] text-[#2A2270]" : "border-[#E1E5EB] bg-white text-[#566378]"}`}>
                {item}
              </button>
            ))}
          </div>
        </MobileFilterSheet>
      ) : null}
      <AlertDialog open={pendingRemoval !== null} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Résoudre ce signalement ?</AlertDialogTitle>
            <AlertDialogDescription>Le signalement sera classé comme résolu. Pensez à retirer le contenu concerné séparément si nécessaire (onglet Publications).</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingRemoval && decideReport.mutate({ reportId: pendingRemoval.id, decision: "resolved", reason: "Signalement traité et clôturé." })} className="bg-[#9E323A] hover:bg-[#87262E]">
              Résoudre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Empty({ title, action }: { title: string; action: () => void }) {
  return (
    <AdminPanel className="mt-5 p-10 text-center">
      <Flag className="mx-auto text-[#728095]" size={27} />
      <p className="mt-3 font-editorial text-2xl font-semibold text-[#14233B]">{title}</p>
      <button onClick={action} className="mt-2 text-xs font-bold text-[#1A3E6B] underline">
        Réinitialiser la vue
      </button>
    </AdminPanel>
  );
}
