import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

/**
 * DATABASE_SSL=true active une connexion chiffrée (TLS), requise par la
 * plupart des bases MySQL hébergées dans le cloud (TiDB Serverless,
 * PlanetScale, Aiven, Clever Cloud...). Laisser à false pour une base locale
 * (MariaDB/MySQL sur votre machine ou en développement) qui n'exige pas TLS.
 *
 * L'option SSL est encodée directement dans l'URL (paramètre ?ssl=...), que
 * mysql2 sait nativement interpréter (JSON.parse automatique de la valeur).
 * C'est plus fiable que de la passer comme champ séparé à createPool/
 * drizzle-kit, dont la validation interne peut mal la retransmettre.
 */
export function withSsl(databaseUrl: string): string {
  if (process.env.DATABASE_SSL !== "true") return databaseUrl;
  const parsed = new URL(databaseUrl);
  parsed.searchParams.set("ssl", JSON.stringify({ minVersion: "TLSv1.2", rejectUnauthorized: true }));
  return parsed.toString();
}

function createDb(databaseUrl: string) {
  const pool = mysql.createPool(withSsl(databaseUrl));
  return drizzle(pool);
}

let _db: ReturnType<typeof createDb> | null = null;

// Instance drizzle créée paresseusement pour permettre à l'outillage local
// (build, lint) de fonctionner sans base de données configurée.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = createDb(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
