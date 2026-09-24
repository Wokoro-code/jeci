import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

/**
 * Création de la connexion MySQL/TiDB.
 *
 * En production sur TiDB Cloud, DATABASE_SSL=true active TLS.
 * Les options TLS sont transmises directement à mysql2 plutôt
 * que d'être encodées dans DATABASE_URL.
 *
 * TiDB Serverless (endpoint public, sur AWS) coupe les connexions
 * inactives au bout d'environ 340 secondes au niveau réseau (limitation
 * d'AWS Global Accelerator), et le TCP keep-alive ne permet PAS d'éviter
 * cette coupure (documenté par TiDB elle-même). Sans précaution, le pool
 * mysql2 continue de croire qu'une connexion coupée est valide et tente
 * de l'utiliser, ce qui provoque "write EPROTO ... handshake failure".
 * On configure donc `idleTimeout` pour que le pool ferme lui-même une
 * connexion restée inactive, avant que le réseau ne le fasse à sa place.
 */

function createDb(databaseUrl: string) {
  const useSsl = process.env.DATABASE_SSL === "true";

  const pool = mysql.createPool({
    uri: databaseUrl,

    // Recycle une connexion du pool après 4 min d'inactivité (240 000 ms),
    // nettement sous la limite réseau de ~340s de TiDB Serverless sur AWS.
    idleTimeout: 240_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,

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