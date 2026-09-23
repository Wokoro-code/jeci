/**
 * JECI visual system: editorial serif, warm parchment surfaces, black actions, gold selection.
 * Frontend mock data only — replace these exports with API adapters during the backend phase.
 */
export const assets = {
  mark: "/favicon.png",
  hero: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80",
  events: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80",
  mentorship: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=80",
};

export const avatars = {
  jean: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=240&q=82",
  marie: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=240&q=82",
  sophie: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=82",
  marc: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=240&q=82",
  claire: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=240&q=82",
  thomas: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=82",
  amina: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=240&q=82",
  lucas: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=240&q=82",
};

export const currentUser = {
  name: "Jean Dupont",
  initials: "JD",
  promotion: "Promotion 2022",
  role: "Consultant en stratégie",
  avatar: avatars.jean,
};

export const navItems = [
  { label: "Accueil", href: "/", icon: "House" },
  { label: "Annuaire", href: "/annuaire", icon: "UsersRound" },
  { label: "Réseau", href: "/network", icon: "Contact" },
  { label: "Organisation", href: "/organisation", icon: "Network" },
  { label: "Communautés", href: "/communautes", icon: "Users" },
  { label: "Opportunités", href: "/opportunites", icon: "BriefcaseBusiness" },
  { label: "Mentorat", href: "/mentorat", icon: "Handshake" },
  { label: "Projets", href: "/projets", icon: "FolderKanban" },
  { label: "Événements", href: "/evenements", icon: "CalendarDays" },
  { label: "Voir-Juger-Agir", href: "/voir-juger-agir", icon: "Compass" },
  { label: "Mémoire JEC", href: "/memoire", icon: "Landmark" },
  { label: "Messages", href: "/messages", icon: "MessagesSquare" },
  { label: "Enregistrés", href: "/enregistres", icon: "Bookmark" },
  { label: "Paramètres", href: "/parametres", icon: "Settings2" },
];

export const suggestions = [
  { id: 1, name: "Sophie Laurent", promotion: "Promo 2022", role: "Product Manager", avatar: avatars.sophie },
  { id: 2, name: "Marc Vidal", promotion: "Promo 2010", role: "Directeur général", avatar: avatars.thomas },
  { id: 3, name: "Amina Khelifi", promotion: "Promo 2018", role: "Fondatrice, Numa Conseil", avatar: avatars.amina },
];

export const posts = [
  {
    id: 1,
    author: "Marie Dubois",
    promotion: "Promo 2015",
    role: "Directrice Marketing",
    avatar: avatars.marie,
    time: "Il y a 2 heures",
    text: "Ravie d’annoncer que notre équipe s’agrandit ! La formation JEC m’a toujours poussée à chercher l’excellence, et c’est exactement ce que nous recherchons aujourd’hui. N’hésitez pas à me contacter si vous êtes intéressés par les nouveaux défis du digital.",
    likes: 24,
    comments: 5,
  },
  {
    id: 2,
    author: "Bureau JECI",
    promotion: "L’Héritage JEC",
    role: "Bureau",
    avatar: assets.mark,
    time: "Hier à 18:30",
    text: "Retour sur le Grand Rassemblement JECI ! Merci aux plus de 300 Jécistes et anciens Jécistes présents hier soir pour célébrer notre réseau. Une soirée exceptionnelle sous le signe des retrouvailles et de l’excellence.",
    image: assets.hero,
    likes: 156,
    comments: 23,
  },
  {
    id: 3,
    author: "Claire Bernard",
    promotion: "Promo 2019",
    role: "Responsable RSE",
    avatar: avatars.claire,
    time: "Lundi à 09:12",
    text: "Je recherche deux regards externes sur notre programme d’impact. Si vous travaillez sur la mesure extra-financière, échangeons autour d’un café cette semaine.",
    likes: 18,
    comments: 7,
  },
];

export const events = [
  {
    id: "finance-durable",
    day: "15",
    month: "OCT",
    category: "Conférence",
    title: "L’avenir de la Finance Durable",
    location: "Campus Paris, Grand Amphithéâtre",
    time: "18h30 – 21h00",
    participants: 84,
    image: assets.events,
    description: "Décryptages, retours d’expérience et perspectives sur les nouveaux équilibres de la finance durable. Une rencontre pensée pour les Jécistes qui transforment les organisations.",
  },
  {
    id: "promo-2010-2015",
    day: "22",
    month: "OCT",
    category: "Afterwork",
    title: "Rencontre Promo 2010–2015",
    location: "Le Rooftop, Paris 8ème",
    time: "19h00 – 22h30",
    participants: 47,
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=85",
    description: "Un temps informel pour renouer avec votre promotion, élargir votre réseau et partager vos trajectoires autour d’un verre.",
  },
  {
    id: "masterclass-leadership",
    day: "05",
    month: "NOV",
    category: "Atelier",
    title: "Masterclass : Leadership & Innovation",
    location: "Siège JEC, Lomé",
    time: "18h45 – 20h30",
    participants: 56,
    image: assets.mentorship,
    description: "Une masterclass interactive pour développer une posture de leader, faire émerger les idées et donner un cadre concret à l’innovation.",
  },
];

export const members = [
  { id: 1, name: "Sophie Laurent", promotion: "2022", role: "Product Manager", company: "Luma Studio", city: "Paris", expertise: ["Produit", "SaaS"], avatar: avatars.sophie },
  { id: 2, name: "Marc Vidal", promotion: "2010", role: "Directeur général", company: "Matière Vive", city: "Lyon", expertise: ["Direction", "Industrie"], avatar: avatars.thomas },
  { id: 3, name: "Amina Khelifi", promotion: "2018", role: "Fondatrice", company: "Numa Conseil", city: "Paris", expertise: ["Stratégie", "Impact"], avatar: avatars.amina },
  { id: 4, name: "Thomas Legrand", promotion: "2016", role: "Responsable juridique", company: "Axiom", city: "Bordeaux", expertise: ["Droit", "Conformité"], avatar: avatars.lucas },
  { id: 5, name: "Claire Bernard", promotion: "2019", role: "Responsable RSE", company: "Virevolte", city: "Nantes", expertise: ["RSE", "Finance"], avatar: avatars.claire },
  { id: 6, name: "Lina Moreau", promotion: "2021", role: "Data Analyst", company: "Kernos", city: "Lille", expertise: ["Data", "IA"], avatar: avatars.marie },
];

export const promotions = [
  { year: "2022", members: 112, activity: "Très active", next: "Café promotion · 02 nov.", color: "bg-[#E3E0FA]" },
  { year: "2019", members: 96, activity: "Active", next: "Visio retrouvailles · 16 oct.", color: "bg-[#C9D9E8]" },
  { year: "2015", members: 88, activity: "Active", next: "Dîner de promotion · 08 nov.", color: "bg-[#D9C8B8]" },
  { year: "2010", members: 74, activity: "En reprise", next: "Afterwork · 22 oct.", color: "bg-[#CAD7CA]" },
];

export const opportunities = [
  { id: "directeur-juridique", type: "CDI", title: "Directeur·rice juridique", company: "Groupe Aster", city: "Paris", posted: "Publié aujourd’hui", salary: "Selon profil", author: "Thomas Legrand", description: "Pilotez la stratégie juridique d’un groupe en croissance, au croisement du conseil aux directions et de la transformation réglementaire." },
  { id: "product-manager", type: "CDI", title: "Senior Product Manager", company: "Luma Studio", city: "Paris / hybride", posted: "Publié il y a 2 jours", salary: "70–82 k€", author: "Sophie Laurent", description: "Construisez une offre produit responsable pour une communauté de professionnels exigeants." },
  { id: "consultant-impact", type: "Mission", title: "Consultant·e Impact & RSE", company: "Numa Conseil", city: "À distance", posted: "Publié il y a 4 jours", salary: "Mission 6 mois", author: "Amina Khelifi", description: "Accompagnez des dirigeants dans la structuration d’indicateurs d’impact utiles et ambitieux." },
];

export const mentorMatches = [
  { name: "Marc Vidal", role: "Directeur général · Matière Vive", promotion: "Promo 2010", expertise: "Leadership & développement d’activité", availability: "2 créneaux cette semaine", avatar: avatars.thomas },
  { name: "Claire Bernard", role: "Responsable RSE · Virevolte", promotion: "Promo 2019", expertise: "Transition durable & stratégie d’impact", availability: "Disponible le jeudi", avatar: avatars.claire },
  { name: "Thomas Legrand", role: "Responsable juridique · Axiom", promotion: "Promo 2016", expertise: "Mobilité, carrière et management", availability: "Nouvelles demandes ouvertes", avatar: avatars.lucas },
];

export const conversations = [
  { id: 1, name: "Sophie Laurent", message: "Avec plaisir. Quel créneau te convient ?", time: "09:42", unread: 0, avatar: avatars.sophie },
  { id: 2, name: "Marc Vidal", message: "Je t’envoie la présentation ce soir.", time: "Hier", unread: 2, avatar: avatars.thomas },
  { id: 3, name: "Bureau JECI", message: "Votre inscription est confirmée.", time: "Lun.", unread: 0, avatar: assets.mark },
  { id: 4, name: "Claire Bernard", message: "Merci pour votre retour !", time: "Lun.", unread: 0, avatar: avatars.claire },
];

export const projects = [
  { title: "Cercle Impact", status: "Ouvert", members: 18, label: "RSE & transition", image: assets.mentorship, description: "Un groupe de travail JECI pour partager outils, pratiques et collaborations autour de l’impact." },
  { title: "JEC Tech Founders", status: "Ouvert", members: 42, label: "Entrepreneuriat", image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80", description: "Un cercle d’entraide entre fondateurs, investisseurs et experts du réseau." },
  { title: "Mentorat Première Carrière", status: "Sur invitation", members: 27, label: "Mentorat", image: assets.events, description: "Un parcours collectif pour faire grandir les jeunes Jécistes au contact des anciens responsables." },
];
