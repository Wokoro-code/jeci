/**
 * JECI administration: mock-only operational records, isolated from the future data adapters.
 * The visual system remains institutional: midnight ink, ivory, data blue, and meaningful promotion gold.
 */
import { avatars, assets } from "@/data/mockData";

export const adminUser = { name: "Catherine Martin", role: "Administratrice réseau", avatar: avatars.claire };
export const adminAssets = { mark: assets.mark };

export const adminNav = [
  { label: "Tableau de bord", href: "/admin", icon: "LayoutDashboard" },
  { label: "Gestion des membres", href: "/admin/membres", icon: "UsersRound" },
  { label: "Vérifications", href: "/admin/verifications", icon: "ShieldCheck", badge: "24" },
  { label: "Promotions", href: "/admin/promotions", icon: "GraduationCap" },
  { label: "Publications", href: "/admin/publications", icon: "Newspaper" },
  { label: "Opportunités", href: "/admin/opportunities", icon: "BriefcaseBusiness" },
  { label: "Mentorat", href: "/admin/mentoring", icon: "Handshake" },
  { label: "Projets", href: "/admin/projects", icon: "FolderKanban" },
  { label: "Événements", href: "/admin/events", icon: "CalendarDays", badge: "3" },
  { label: "Signalements", href: "/admin/reports", icon: "Flag", badge: "5" },
  { label: "Communications", href: "/admin/communications", icon: "Send" },
];

export const adminStats = [
  { label: "Jécistes vérifiés", value: "850", delta: "+12 % ce mois", icon: "BadgeCheck", tone: "blue" as const },
  { label: "Jécistes en attente", value: "24", delta: "Action requise", icon: "UserRoundCheck", tone: "gold" as const },
  { label: "Publications signalées", value: "5", delta: "À modérer", icon: "Flag", tone: "red" as const },
  { label: "Événements à valider", value: "3", delta: "Cette semaine", icon: "CalendarCheck2", tone: "slate" as const },
];

export const adminMembers = [
  { id: 1, name: "Marie Laurent", email: "marie.laurent@helios-conseil.fr", phone: "+33 6 00 00 00 01", promotion: "2018", role: "Directrice Marketing", status: "Vérifié" as const, avatar: avatars.marie, joined: "12 sept. 2026" },
  { id: 2, name: "Thomas Dubois", email: "thomas.dubois@atelier-strategie.fr", phone: "+33 6 00 00 00 02", promotion: "2023", role: "Consultant junior", status: "En attente" as const, avatar: "", joined: "10 sept. 2026" },
  { id: 3, name: "Sophie Martin", email: "s.martin@dumas-avocats.fr", phone: "+33 6 00 00 00 03", promotion: "2010", role: "Avocate associée", status: "Vérifié" as const, avatar: avatars.sophie, joined: "09 sept. 2026" },
  { id: 4, name: "Marc Lefebvre", email: "marc.lefebvre@atlas-growth.fr", phone: "+33 6 12 34 56 78", promotion: "2015", role: "Consultant senior", status: "Vérifié" as const, avatar: "", joined: "07 sept. 2026" },
  { id: 5, name: "Lucie Bernard", email: "lucie.bernard@kalya-data.fr", phone: "+33 7 98 76 54 32", promotion: "2020", role: "Analyste data", status: "En attente" as const, avatar: "", joined: "05 sept. 2026" },
  { id: 6, name: "Antoine Morel", email: "antoine.morel@meridien-legal.fr", phone: "+33 6 45 32 11 00", promotion: "2012", role: "Directeur juridique", status: "Vérifié" as const, avatar: "", joined: "03 sept. 2026" },
];

export const pendingVerifications = [
  { id: 1, name: "Thomas Dubois", promotion: "Promotion 2023", email: "thomas.dubois@atelier-strategie.fr", submitted: "Il y a 3 heures", document: "Attestation JEC · 2023", avatar: "", confidence: "Correspondance élevée" },
  { id: 2, name: "Lucie Bernard", promotion: "Promotion 2020", email: "lucie.bernard@kalya-data.fr", submitted: "Hier à 16:20", document: "Attestation de formation · 2020", avatar: "", confidence: "Correspondance à confirmer" },
  { id: 3, name: "Nicolas Petit", promotion: "Promotion 2021", email: "nicolas.petit@studio-parallele.fr", submitted: "Hier à 10:45", document: "Attestation JEC · 2021", avatar: avatars.lucas, confidence: "Correspondance élevée" },
  { id: 4, name: "Camille Roux", promotion: "Promotion 2017", email: "camille.roux@maison-artefact.fr", submitted: "Le 08 sept.", document: "Certificat de scolarité · 2017", avatar: "", confidence: "Document incomplet" },
];

export const moderationItems = [
  { id: 1, author: "Romain Garcia", avatar: avatars.lucas, type: "Commentaire", context: "Publication · Gala annuel 2026", excerpt: "Je trouve cette organisation totalement inutile…", reports: 4, time: "Il y a 2 h", severity: "Critique" as const },
  { id: 2, author: "Sophie Lambert", avatar: avatars.sophie, type: "Publication", context: "Fil d’actualité", excerpt: "Une opportunité à saisir — contactez-moi directement pour en savoir plus.", reports: 2, time: "Il y a 5 h", severity: "À examiner" as const },
  { id: 3, author: "Jean Moreau", avatar: "", type: "Message de groupe", context: "Promo 2012", excerpt: "Lien externe signalé par plusieurs membres du groupe.", reports: 1, time: "Hier", severity: "À examiner" as const },
];

export const adminEvents = [
  { id: 1, title: "Rencontre Tech Jécistes", date: "18 OCT", type: "Afterwork", venue: "Le Shack, Paris", attendees: 63, owner: "Sophie Laurent", status: "À valider" as const, image: assets.events },
  { id: 2, title: "L’avenir de la Finance Durable", date: "15 OCT", type: "Conférence", venue: "Campus Paris", attendees: 84, owner: "Bureau JEC", status: "Publié" as const, image: assets.hero },
  { id: 3, title: "Atelier CV & mobilité", date: "05 NOV", type: "Atelier", venue: "Campus Lyon", attendees: 28, owner: "Claire Bernard", status: "Brouillon" as const, image: assets.mentorship },
];

export const adminOpportunities = [
  { id: 1, title: "Directeur·rice juridique", company: "Groupe Aster", type: "CDI", submittedBy: "Thomas Legrand", date: "Aujourd’hui", views: 87, applicants: 6, status: "Publié" as const },
  { id: 2, title: "Senior Product Manager", company: "Luma Studio", type: "CDI", submittedBy: "Sophie Laurent", date: "Hier", views: 64, applicants: 4, status: "Publié" as const },
  { id: 3, title: "Consultant·e Impact & RSE", company: "Numa Conseil", type: "Mission", submittedBy: "Amina Khelifi", date: "Il y a 3 jours", views: 52, applicants: 3, status: "À valider" as const },
  { id: 4, title: "Stage Business Development", company: "Hexa Partners", type: "Stage", submittedBy: "Laurent Ménard", date: "Il y a 4 jours", views: 31, applicants: 1, status: "Expiré" as const },
];

export const adminProjects = [
  { id: 1, name: "Cercle Impact", owner: "Claire Bernard", category: "RSE & transition", members: 18, activity: "12 contributions cette semaine", status: "Actif" as const },
  { id: 2, name: "JEC Tech Founders", owner: "Amina Khelifi", category: "Entrepreneuriat", members: 42, activity: "6 nouvelles demandes", status: "Actif" as const },
  { id: 3, name: "Mentorat Première Carrière", owner: "Bureau JEC", category: "Mentorat", members: 27, activity: "En attente de validation", status: "À examiner" as const },
];

export const communications = [
  { id: 1, subject: "Le programme des rendez-vous d’octobre", audience: "Tous les Jécistes", channel: "Email", status: "Envoyée" as const, date: "12 oct. · 09:00", rate: "68 % d’ouverture" },
  { id: 2, subject: "Votre promotion se retrouve bientôt", audience: "Promotion 2022", channel: "Email", status: "Planifiée" as const, date: "14 oct. · 08:30", rate: "En attente" },
  { id: 3, subject: "Nouvelles opportunités du réseau", audience: "Jécistes ouverts à l’emploi", channel: "Notification", status: "Brouillon" as const, date: "Modifiée il y a 2 h", rate: "—" },
];

export const adminActions = [
  { kind: "critical", title: "Signalement critique", detail: "Commentaire inapproprié sur la publication « Gala 2026 ».", time: "Il y a 2 h", href: "/admin/reports" },
  { kind: "gold", title: "Vérification groupée", detail: "15 demandes d’inscription de la promotion 2023 sont en attente.", time: "Aujourd’hui", href: "/admin/verifications" },
  { kind: "blue", title: "Validation d’événement", detail: "« Rencontre Tech Jécistes » nécessite votre approbation.", time: "Hier", href: "/admin/events" },
];
