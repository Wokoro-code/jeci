/** JECI event detail: inscription réelle, branchée sur server/routers/events.ts. */
import { ArrowLeft, CalendarDays, Clock3, MapPin, Share2, UsersRound } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { Panel } from "@/components/UiPrimitives";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";

  const eventsQuery = trpc.events.listPublished.useQuery();
  const event = eventsQuery.data?.find((item) => item.id === eventId);

  const registerMutation = trpc.events.register.useMutation({
    onSuccess: (data) => toast.success(data.waitlisted ? "Événement complet : vous êtes sur liste d'attente." : "Votre inscription est enregistrée."),
    onError: (error) => toast.error(error.message),
  });

  if (eventsQuery.isLoading) {
    return <p className="text-sm text-[#707787]">Chargement de l'événement...</p>;
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-5xl">
        <Link href="/evenements" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#5F6978] transition hover:text-[#0E1D36]">
          <ArrowLeft size={16} /> Retour aux événements
        </Link>
        <Panel className="p-10 text-center">
          <p className="font-editorial text-2xl font-semibold text-[#10213D]">Cet événement n'est plus disponible.</p>
        </Panel>
      </div>
    );
  }

  const startsAt = new Date(event.startsAt);

  const handleRegister = () => {
    if (!isVerified) {
      toast.info("Vérifiez votre compte pour vous inscrire à un événement.");
      return;
    }
    registerMutation.mutate({ eventId: event.id });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/evenements" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#5F6978] transition hover:text-[#0E1D36]">
        <ArrowLeft size={16} /> Retour aux événements
      </Link>
      <div className="overflow-hidden rounded-2xl border border-[#E1DDD6] bg-white shadow-[0_8px_30px_rgba(10,32,63,0.07)]">
        <div className="relative flex h-40 items-center bg-[#102846] px-8 sm:h-56">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#D7E1ED]">Rencontre JEC {event.isOnline ? "· en ligne" : ""}</p>
            <h1 className="mt-2 font-editorial text-[32px] font-semibold leading-[0.95] tracking-[-0.03em] text-white sm:text-[44px]">{event.title}</h1>
          </div>
        </div>
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_275px]">
          <div>
            <h2 className="font-editorial text-3xl font-semibold text-[#101E36]">À propos</h2>
            <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-[#596473]">{event.description}</p>
          </div>
          <aside className="space-y-4">
            <Panel className="p-5">
              <div className="space-y-4 text-sm text-[#4F5C6C]">
                <p className="flex gap-3">
                  <CalendarDays className="text-[#967020]" size={19} />
                  <span>
                    <strong className="block text-[#142039]">{startsAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</strong>À inscrire à votre agenda
                  </span>
                </p>
                <p className="flex gap-3">
                  <Clock3 className="text-[#967020]" size={19} />
                  <span>{startsAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                </p>
                <p className="flex gap-3">
                  <MapPin className="text-[#967020]" size={19} />
                  <span>{event.location ?? (event.isOnline ? "En ligne" : "Lieu à confirmer")}</span>
                </p>
                <p className="flex gap-3">
                  <UsersRound className="text-[#967020]" size={19} />
                  <span>{event.registeredCount} inscrits à ce jour{event.capacity ? ` sur ${event.capacity} places` : ""}</span>
                </p>
              </div>
              <button onClick={handleRegister} disabled={registerMutation.isPending} className="mt-6 w-full rounded-lg bg-black py-3 text-xs font-extrabold text-white transition hover:bg-[#17233B] disabled:opacity-50">
                {registerMutation.isPending ? "Inscription..." : "S'inscrire à l'événement"}
              </button>
              <button onClick={() => toast.success("Lien d'événement copié.")} className="mt-2 flex w-full items-center justify-center gap-2 py-2 text-xs font-bold text-[#526070] hover:text-[#0E1D36]">
                <Share2 size={15} /> Partager
              </button>
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
}
