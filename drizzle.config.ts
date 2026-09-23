import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

/**
 * DATABASE_SSL=true active TLS pour drizzle-kit aussi (nécessaire pour les
 * bases MySQL hébergées dans le cloud : TiDB Serverless, PlanetScale,
 * Aiven...). L'option est encodée directement dans l'URL (paramètre
 * ?ssl=...), que mysql2 sait nativement interpréter — plus fiable que de la
 * passer comme champ séparé, que la validation interne de drizzle-kit peut
 * mal retransmettre. Voir server/db/client.ts pour la même logique côté
 * application (fonction withSsl, dupliquée ici pour rester indépendant du
 * reste du code serveur).
 */
function withSsl(url: string): string {
  if (process.env.DATABASE_SSL !== "true") return url;
  const parsed = new URL(url);
  parsed.searchParams.set("ssl", JSON.stringify({ minVersion: "TLSv1.2", rejectUnauthorized: true }));
  return parsed.toString();
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: withSsl(connectionString),
  },
});