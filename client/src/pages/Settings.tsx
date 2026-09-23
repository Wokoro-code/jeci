/** JECI settings: visibilité du profil et mot de passe branchés sur le backend réel. */
import { BellRing, ChevronRight, Eye, FileCheck2, LockKeyhole, ShieldCheck, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageIntro, Panel } from "@/components/UiPrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { uploadFile, type UploadResult } from "@/lib/upload";

function Toggle({ on, setOn }: { on: boolean; setOn: (value: boolean) => void }) {
  return (
    <button onClick={() => setOn(!on)} className={`relative h-6 w-11 rounded-full transition ${on ? "bg-[#152C4C]" : "bg-[#CAC8C3]"}`}>
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const overviewQuery = trpc.account.overview.useQuery();
  const myVerificationQuery = trpc.account.myVerification.useQuery();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [eventNotifs, setEventNotifs] = useState(true);

  const profileVisible = overviewQuery.data?.profile?.directoryVisibility !== "private";
  const updateProfile = trpc.account.updateProfile.useMutation({
    onSuccess: () => {
      utils.account.overview.invalidate();
      toast.success("Visibilité mise à jour.");
    },
    onError: (error) => toast.error(error.message),
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Mot de passe mis à jour.");
    },
    onError: (error) => toast.error(error.message),
  });

  const handlePasswordChange = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentPassword || !newPassword) return;
    changePassword.mutate({ currentPassword, newPassword });
  };

  const [pendingDocuments, setPendingDocuments] = useState<UploadResult[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const submitVerification = trpc.account.submitVerification.useMutation({
    onSuccess: () => {
      utils.account.myVerification.invalidate();
      setPendingDocuments([]);
      toast.success("Vos justificatifs ont été transmis à l'administration.");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleDocumentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingDocument(true);
    try {
      const result = await uploadFile(file, "verification_document");
      setPendingDocuments((state) => [...state, result]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'envoi du document.");
    } finally {
      setUploadingDocument(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageIntro eyebrow="Préférences du compte" title="Paramètres" description="Vous gardez le contrôle sur votre présence, vos données et le rythme de vos notifications." />
      <div className="space-y-5">
        {user?.accountStatus !== "verified" && (
          <Panel className="p-5 sm:p-6">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#FFF4DB] text-[#8D681B]">
                <FileCheck2 size={19} />
              </span>
              <div>
                <h2 className="font-editorial text-[28px] font-semibold leading-6 text-[#0D1D35]">Vérification de mon compte</h2>
                <p className="mt-2 text-xs leading-5 text-[#687281]">
                  {user?.accountStatus === "rejected" ? "Votre demande précédente a été refusée. Vous pouvez soumettre de nouveaux justificatifs." : "Déposez un justificatif de votre parcours JEC (attestation, carte de membre, témoignage d'un responsable...) pour activer le badge bleu et les interactions."}
                </p>
              </div>
            </div>
            <div className="mt-5 border-t border-[#EEEAE3] pt-4">
              {myVerificationQuery.data?.request?.status === "submitted" ? (
                <p className="rounded-lg bg-[#EAF3FC] px-3 py-2.5 text-xs font-bold text-[#235D98]">Votre dossier a été transmis et est en cours d'examen par l'administration.</p>
              ) : (
                <>
                  {myVerificationQuery.data?.request?.decisionReason && <p className="mb-3 rounded-lg bg-[#FFF7E5] px-3 py-2.5 text-xs leading-5 text-[#705421]">{myVerificationQuery.data.request.decisionReason}</p>}
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#D9D4CC] py-4 text-xs font-bold text-[#536174] hover:bg-[#F7F4EE]">
                    <Upload size={16} /> {uploadingDocument ? "Envoi..." : "Ajouter un justificatif (image ou PDF)"}
                    <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={handleDocumentChange} disabled={uploadingDocument} />
                  </label>
                  {pendingDocuments.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {pendingDocuments.map((document) => (
                        <li key={document.storageKey} className="flex items-center gap-2 rounded-lg bg-[#F1F3F8] px-3 py-2 text-[11px] font-bold text-[#3D495B]">
                          <FileCheck2 size={14} /> {document.originalName}
                          <button onClick={() => setPendingDocuments((state) => state.filter((d) => d.storageKey !== document.storageKey))} className="ml-auto text-[#8A9099]">
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    className="mt-4 w-full"
                    disabled={pendingDocuments.length === 0 || submitVerification.isPending}
                    onClick={() => submitVerification.mutate({ documents: pendingDocuments.map(({ storageKey, originalName, mimeType }) => ({ storageKey, originalName, mimeType })) })}
                  >
                    {submitVerification.isPending ? "Envoi..." : "Soumettre pour vérification"}
                  </Button>
                </>
              )}
            </div>
          </Panel>
        )}

        <Panel className="p-5 sm:p-6">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#EEF1F5] text-[#183353]">
              <Eye size={19} />
            </span>
            <div>
              <h2 className="font-editorial text-[28px] font-semibold leading-6 text-[#0D1D35]">Visibilité du profil</h2>
              <p className="mt-2 text-xs leading-5 text-[#687281]">Rendez votre profil disponible dans l'annuaire du réseau JEC.</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-[#EEEAE3] pt-4">
            <span className="text-xs font-bold text-[#4B586A]">Visible dans l'annuaire</span>
            <Toggle on={profileVisible} setOn={(value) => updateProfile.mutate({ directoryVisibility: value ? "network" : "private" })} />
          </div>
        </Panel>

        {/* Confidentialité détaillée par champ (cahier §31) */}
        <Panel className="p-5 sm:p-6">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E3E0FA] text-[#3B32A0]">
              <ShieldCheck size={19} />
            </span>
            <div>
              <h2 className="font-editorial text-[28px] font-semibold leading-6 text-[#0D1D35]">Confidentialité détaillée</h2>
              <p className="mt-2 text-xs leading-5 text-[#687281]">Choisissez qui peut voir chacune de vos informations.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 border-t border-[#EEEAE3] pt-4">
            <PrivacyRow label="E-mail" value={overviewQuery.data?.profile?.privacyEmail} onChange={(value) => updateProfile.mutate({ privacyEmail: value })} />
            <PrivacyRow label="Téléphone" value={overviewQuery.data?.profile?.privacyPhone} onChange={(value) => updateProfile.mutate({ privacyPhone: value })} />
            <PrivacyRow label="Ville" value={overviewQuery.data?.profile?.privacyCity} onChange={(value) => updateProfile.mutate({ privacyCity: value })} />
            <PrivacyRow label="Parcours JEC" value={overviewQuery.data?.profile?.privacyJecPath} onChange={(value) => updateProfile.mutate({ privacyJecPath: value })} />
            <PrivacyRow label="Parcours professionnel" value={overviewQuery.data?.profile?.privacyProfessionalPath} onChange={(value) => updateProfile.mutate({ privacyProfessionalPath: value })} />
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F0EC] text-[#28624E]">
              <LockKeyhole size={19} />
            </span>
            <div>
              <h2 className="font-editorial text-[28px] font-semibold leading-6 text-[#0D1D35]">Mot de passe</h2>
              <p className="mt-2 text-xs leading-5 text-[#687281]">Changez votre mot de passe de connexion.</p>
            </div>
          </div>
          <form onSubmit={handlePasswordChange} className="mt-5 space-y-3 border-t border-[#EEEAE3] pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <Input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input id="new-password" type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </div>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </Button>
          </form>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#F5E8C9] text-[#7D5C1C]">
              <BellRing size={19} />
            </span>
            <div>
              <h2 className="font-editorial text-[28px] font-semibold leading-6 text-[#0D1D35]">Notifications</h2>
              <p className="mt-2 text-xs leading-5 text-[#687281]">Choisissez les informations qui méritent votre attention.</p>
            </div>
          </div>
          <div className="mt-5 divide-y divide-[#EEEAE3] border-t border-[#EEEAE3]">
            <SettingRow label="Recevoir les emails du réseau" detail="Actualités, rencontres et opportunités pertinentes." on={emailNotifs} setOn={setEmailNotifs} />
            <SettingRow label="Rappels d'événements" detail="Un rappel avant les rendez-vous auxquels vous êtes inscrit." on={eventNotifs} setOn={setEventNotifs} />
          </div>
          <p className="mt-3 text-[11px] text-[#9AA1AA]">Les préférences de notification par e-mail seront synchronisées avec un service d'envoi dans une prochaine itération ; les notifications internes sont déjà actives.</p>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F0EC] text-[#28624E]">
              <ShieldCheck size={19} />
            </span>
            <div>
              <h2 className="font-editorial text-[28px] font-semibold leading-6 text-[#0D1D35]">Confidentialité et données</h2>
              <p className="mt-2 text-xs leading-5 text-[#687281]">Le détail de vos droits et paramètres de partage sera synchronisé avec votre compte.</p>
            </div>
          </div>
          <button onClick={() => toast.info("La gestion fine des données personnelles arrive dans une prochaine itération.")} className="mt-5 flex w-full items-center justify-between border-t border-[#EEEAE3] pt-4 text-left text-xs font-bold text-[#34445A] hover:text-[#987123]">
            <span className="flex items-center gap-2">
              <LockKeyhole size={16} /> Gérer mes données personnelles
            </span>
            <ChevronRight size={17} />
          </button>
        </Panel>
      </div>
    </div>
  );
}

function SettingRow({ label, detail, on, setOn }: { label: string; detail: string; on: boolean; setOn: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-xs font-bold text-[#3D4B5E]">{label}</p>
        <p className="mt-1 text-[11px] text-[#737D8A]">{detail}</p>
      </div>
      <Toggle on={on} setOn={setOn} />
    </div>
  );
}

const privacyLabels: Record<string, string> = { public: "Public", members: "Membres uniquement", connections: "Mes connexions", private: "Privé" };

function PrivacyRow({ label, value, onChange }: { label: string; value?: string | null; onChange: (value: "public" | "members" | "connections" | "private") => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold text-[#4B586A]">{label}</span>
      <select value={value ?? "members"} onChange={(event) => onChange(event.target.value as "public" | "members" | "connections" | "private")} className="h-9 rounded-lg border border-[#DDD8D0] bg-white px-2.5 text-xs outline-none focus:border-[#5B4FE0]">
        {Object.entries(privacyLabels).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
