/** JECI — statuts JEC : libellés et couleurs de badge partagés entre les pages membres et l'administration. */
export type JecStatus = "active_jeciste" | "alumni_jeciste" | "former_leader" | "current_leader" | "chaplain" | "facilitator" | "volunteer" | "supporter";

export const jecStatusLabels: Record<JecStatus, string> = {
  active_jeciste: "Jéciste actif",
  alumni_jeciste: "Ancien Jéciste",
  former_leader: "Ancien responsable",
  current_leader: "Responsable actuel",
  chaplain: "Aumônier",
  facilitator: "Animateur / accompagnateur",
  volunteer: "Volontaire",
  supporter: "Ami / sympathisant",
};

// Couleurs demandées : Jéciste actif = bleu, Ancien Jéciste = vert, Ancien responsable = or,
// Responsable actuel = café. Couleurs choisies pour les statuts restants (non précisés) :
// Aumônier = violet (symbolique du ministère), Animateur = sarcelle, Volontaire = orange, Ami/sympathisant = gris neutre.
export const jecStatusColors: Record<JecStatus, { bg: string; text: string; dot: string }> = {
  active_jeciste: { bg: "#DCEAFB", text: "#1B4C8C", dot: "#2E6BC7" },
  alumni_jeciste: { bg: "#E1F3E5", text: "#1F6A3D", dot: "#2F9155" },
  former_leader: { bg: "#FBEFCF", text: "#8B6914", dot: "#C79A1F" },
  current_leader: { bg: "#EFE0D2", text: "#6B4423", dot: "#8A5A32" },
  chaplain: { bg: "#EDE4F7", text: "#5B3A8E", dot: "#7C51B8" },
  facilitator: { bg: "#DCF3F0", text: "#146D64", dot: "#1B9384" },
  volunteer: { bg: "#FCE7D6", text: "#9A4E12", dot: "#D06A1B" },
  supporter: { bg: "#EEF0F3", text: "#57606F", dot: "#8892A0" },
};

export const jecStatusOptions = Object.keys(jecStatusLabels) as JecStatus[];
