/** JECI saved: éléments réellement enregistrés, branchés sur server/routers/saved.ts. */
import { Bookmark, CalendarDays, MapPin } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { PageIntro, Panel } from "@/components/UiPrimitives";
import { trpc } from "@/lib/trpc";

const typeLabels: Record<string, string> = { job: "Emploi", internship: "Stage", freelance: "Freelance", volunteering: "Bénévolat", other: "Autre" };

export default function Saved() {
  const utils = trpc.useUtils();
  const savedQuery = trpc.saved.list.useQuery();

  const toggleSaved = trpc.saved.toggle.useMutation({
    onSuccess: () => {
      utils.saved.list.invalidate();
      utils.saved.ids.invalidate();
      toast.success("Élément retiré des enregistrés.");
    },
    onError: (error) => toast.error(error.message),
  });

  const items = savedQuery.data ?? [];
  const savedEvents = items.filter((item) => item.event);
  const savedOpportunities = items.filter((item) => item.opportunity);
  const savedPosts = items.filter((item) => item.post);

  return (
    <div>
      <PageIntro eyebrow="Ma bibliothèque" title="Éléments enregistrés" description="Retrouvez les rendez-vous, opportunités et publications que vous avez mis de côté." />
      {savedQuery.isLoading && <p className="text-sm text-[#707787]">Chargement...</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-editorial text-[29px] font-semibold text-[#10203A]">Événements</h2>
          <div className="space-y-3">
            {savedEvents.map(({ saved, event }) => {
              if (!event) return null;
              const startsAt = new Date(event.startsAt);
              return (
                <Link key={saved.id} href={`/evenements/${event.id}`}>
                  <Panel className="flex gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(10,32,63,0.08)]">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-[#F0A366] bg-[#FBE0C8] text-[#8A3F10]">
                      <span className="text-[10px] font-extrabold tracking-[0.08em]">{startsAt.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()}</span>
                      <span className="font-editorial text-[24px] font-bold leading-5">{startsAt.getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <h3 className="font-editorial text-[24px] font-semibold leading-5 text-[#10203A]">{event.title}</h3>
                        <button onClick={(e) => { e.preventDefault(); toggleSaved.mutate({ itemType: "event", itemId: event.id }); }} aria-label="Retirer des enregistrés">
                          <Bookmark size={17} fill="currentColor" className="shrink-0 text-[#A47B2A]" />
                        </button>
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-[#707A86]">
                        <MapPin size={14} />
                        {event.location ?? "Lieu à confirmer"}
                      </p>
                    </div>
                  </Panel>
                </Link>
              );
            })}
            {savedEvents.length === 0 && !savedQuery.isLoading && <p className="text-xs text-[#9A9A98]">Aucun événement enregistré.</p>}
          </div>
        </section>
        <section>
          <h2 className="mb-4 font-editorial text-[29px] font-semibold text-[#10203A]">Opportunités</h2>
          <div className="space-y-3">
            {savedOpportunities.map(({ saved, opportunity }) => {
              if (!opportunity) return null;
              return (
                <Link key={saved.id} href={`/opportunites?id=${opportunity.id}`}>
                  <Panel className="p-4 transition hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(10,32,63,0.08)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="rounded-full bg-[#EEF1F5] px-2 py-1 text-[10px] font-extrabold text-[#536071]">{typeLabels[opportunity.type] ?? opportunity.type}</span>
                        <h3 className="mt-3 font-editorial text-[25px] font-semibold leading-5 text-[#10203A]">{opportunity.title}</h3>
                        <p className="mt-1 text-xs font-bold text-[#5D6877]">{opportunity.organization ?? "—"}</p>
                      </div>
                      <button onClick={(e) => { e.preventDefault(); toggleSaved.mutate({ itemType: "opportunity", itemId: opportunity.id }); }} aria-label="Retirer des enregistrés">
                        <Bookmark size={17} fill="currentColor" className="text-[#A47B2A]" />
                      </button>
                    </div>
                  </Panel>
                </Link>
              );
            })}
            {savedOpportunities.length === 0 && !savedQuery.isLoading && <p className="text-xs text-[#9A9A98]">Aucune opportunité enregistrée.</p>}
          </div>
          {savedPosts.length > 0 && (
            <>
              <h2 className="mb-4 mt-6 font-editorial text-[29px] font-semibold text-[#10203A]">Publications</h2>
              <div className="space-y-3">
                {savedPosts.map(({ saved, post }) => {
                  if (!post) return null;
                  return (
                    <Link key={saved.id} href={`/publications/${post.id}`}>
                      <Panel className="p-4 transition hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(10,32,63,0.08)]">
                        <div className="flex items-start justify-between gap-3">
                          <p className="line-clamp-3 text-sm leading-6 text-[#485568]">{post.body}</p>
                          <button onClick={(e) => { e.preventDefault(); toggleSaved.mutate({ itemType: "post", itemId: post.id }); }} aria-label="Retirer des enregistrés">
                            <Bookmark size={17} fill="currentColor" className="shrink-0 text-[#A47B2A]" />
                          </button>
                        </div>
                      </Panel>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
      {!savedQuery.isLoading && items.length === 0 && (
        <Panel className="mt-6 flex items-center gap-3 p-5">
          <CalendarDays className="text-[#3B32A0]" />
          <p className="text-sm text-[#647080]">Vous n'avez encore rien enregistré. Utilisez l'icône enregistrer sur une opportunité, un événement ou une publication.</p>
        </Panel>
      )}
    </div>
  );
}
