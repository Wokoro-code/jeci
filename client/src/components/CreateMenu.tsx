/** JECI quick-create: menu global de création (publication, opportunité, événement, projet), accessible depuis n'importe quelle page. */
import { useState } from "react";
import { BriefcaseBusiness, CalendarDays, MessageSquarePlus, Users2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CreateOpportunityModal } from "@/pages/Opportunities";
import { CreateEventModal } from "@/pages/Events";
import { CreateProjectModal } from "@/pages/Projects";

type CreateType = "post" | "opportunity" | "event" | "project";

export function CreateMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const isVerified = user?.accountStatus === "verified";
  const utils = trpc.useUtils();
  const [type, setType] = useState<CreateType | null>(null);

  const close = () => {
    setType(null);
    onClose();
  };

  const createPost = trpc.feed.create.useMutation({
    onSuccess: () => {
      utils.feed.list.invalidate();
      toast.success("Publication partagée avec le réseau.");
      close();
    },
    onError: (error) => toast.error(error.message),
  });

  const createOpportunity = trpc.opportunities.create.useMutation({
    onSuccess: () => {
      toast.success("Votre offre a été soumise pour validation par l'administration.");
      close();
    },
    onError: (error) => toast.error(error.message),
  });

  const createEvent = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success("Votre événement a été soumis pour validation par l'administration.");
      close();
    },
    onError: (error) => toast.error(error.message),
  });

  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      toast.success("Espace créé.");
      close();
    },
    onError: (error) => toast.error(error.message),
  });

  if (!open) return null;

  const pick = (value: CreateType) => {
    if (!isVerified) {
      toast.info("Vérifiez votre compte pour créer du contenu sur le réseau.");
      return;
    }
    setType(value);
  };

  if (type === "opportunity") return <CreateOpportunityModal onClose={close} isPending={createOpportunity.isPending} onSubmit={(input) => createOpportunity.mutate(input)} />;
  if (type === "event") return <CreateEventModal onClose={close} isPending={createEvent.isPending} onSubmit={(input) => createEvent.mutate(input)} />;
  if (type === "project") return <CreateProjectModal onClose={close} isPending={createProject.isPending} onSubmit={(input) => createProject.mutate(input)} />;
  if (type === "post") return <QuickPostModal onClose={close} isPending={createPost.isPending} onSubmit={(body) => createPost.mutate({ body })} />;

  const options: { value: CreateType; label: string; description: string; icon: React.ReactNode }[] = [
    { value: "post", label: "Publication", description: "Partager une nouvelle avec le réseau", icon: <MessageSquarePlus size={19} /> },
    { value: "opportunity", label: "Opportunité", description: "Proposer un emploi, un stage, une mission", icon: <BriefcaseBusiness size={19} /> },
    { value: "event", label: "Événement", description: "Organiser une rencontre JEC", icon: <CalendarDays size={19} /> },
    { value: "project", label: "Projet", description: "Créer un espace collaboratif", icon: <Users2 size={19} /> },
  ];

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-[#091830]/40 backdrop-blur-sm sm:items-center" onClick={close}>
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#0B1931]">Créer</h2>
          <button onClick={close} className="rounded-full p-1 text-[#7E8490] hover:bg-[#F3F0EA]">
            <X size={20} />
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {options.map((option) => (
            <button key={option.value} onClick={() => pick(option.value)} className="flex w-full items-center gap-3 rounded-xl border border-[#E6E1D9] p-3.5 text-left transition hover:border-[#C7C0B6] hover:bg-[#FAF8F3]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EEF1F5] text-[#183353]">{option.icon}</span>
              <span>
                <span className="block text-sm font-bold text-[#18263E]">{option.label}</span>
                <span className="block text-[11px] text-[#6D7787]">{option.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickPostModal({ onClose, onSubmit, isPending }: { onClose: () => void; isPending: boolean; onSubmit: (body: string) => void }) {
  const [body, setBody] = useState("");
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[#091830]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-editorial text-2xl font-semibold text-[#0B1931]">Nouvelle publication</h2>
          <button onClick={onClose} className="rounded-full p-1 text-[#7E8490] hover:bg-[#F3F0EA]">
            <X size={20} />
          </button>
        </div>
        <Textarea autoFocus rows={5} value={body} onChange={(event) => setBody(event.target.value)} placeholder="À quoi pensez-vous ?" className="mt-4" />
        <Button className="mt-4 w-full" disabled={!body.trim() || isPending} onClick={() => onSubmit(body.trim())}>
          {isPending ? "Publication..." : "Publier"}
        </Button>
      </div>
    </div>
  );
}
