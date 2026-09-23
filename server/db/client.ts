import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

/**
 * Création de la connexion MySQL/TiDB.
 *
 * En production sur TiDB Cloud, DATABASE_SSL=true active TLS.
 * Les options TLS sont transmises directement à mysql2 plutôt
 * que d'être encodées dans DATABASE_URL.
 */

function createDb(databaseUrl: string) {
  const useSsl = process.env.DATABASE_SSL === "true";

  const pool = mysql.createPool({
    uri: databaseUrl,

    ...(useSsl
      ? {
          ssl: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true,
          },
        }
      : {}),
  });

  return drizzle(pool);
}

let _db: ReturnType<typeof createDb> | null = null;

/**
 * Retourne l'instance Drizzle.
 *
 * L'initialisation est volontairement paresseuse afin que le build
 * et les outils locaux puissent fonctionner sans DATABASE_URL.
 */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = createDb(process.env.DATABASE_URL);
    } catch (error) {
      console.error("[Database] Failed to initialize:", error);
      _db = null;
    }
  }

  if (!process.env.DATABASE_URL) {
    console.error("[Database] DATABASE_URL is not defined");
  }

  return _db;
}
