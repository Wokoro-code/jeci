/**
 * Point d'entrée unique du module data-access, désormais organisé par
 * domaine métier sous server/db/*. Ce fichier ne fait que réexporter, pour
 * limiter le nombre d'imports à modifier ailleurs dans le code.
 */
export * from "./db/client";
export * from "./db/audit";
export * from "./db/users";
export * from "./db/roles";
export * from "./db/jecProfiles";
export * from "./db/organization";
export * from "./db/vja";
export * from "./db/memory";
export * from "./db/verification";
export * from "./db/notifications";
export * from "./db/connections";
export * from "./db/messaging";
export * from "./db/feed";
export * from "./db/reports";
export * from "./db/opportunities";
export * from "./db/events";
export * from "./db/mentorship";
export * from "./db/projects";
export * from "./db/campaigns";
export * from "./db/saved";
export * from "./db/dashboard";
