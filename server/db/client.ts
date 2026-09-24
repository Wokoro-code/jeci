import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

/**
 * Crée la connexion MySQL/TiDB.
 *
 * La connexion est construite explicitement à partir de DATABASE_URL
 * afin de séparer clairement les paramètres MySQL et la configuration TLS.
 *
 * TiDB Cloud Serverless utilise TLS sur son endpoint public.
 * Les connexions inactives peuvent être coupées au niveau réseau après
 * plusieurs minutes. Le pool est donc configuré pour recycler les
 * connexions inactives avant cette coupure.
 */
function createDb(databaseUrl: string) {
  const parsed = new URL(databaseUrl);

  const useSsl = process.env.DATABASE_SSL === "true";

  const pool = mysql.createPool({
    host: parsed.hostname,
    port: Number(parsed.port || 4000),

    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),

    database: decodeURIComponent(
      parsed.pathname.replace(/^\/+/, "")
    ),

    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,

    // TiDB Cloud Serverless peut couper une connexion inactive
    // avant que le pool ne la réutilise.
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

  /**
   * Diagnostic temporaire :
   * permet de savoir quand mysql2 crée réellement
   * une nouvelle connexion vers TiDB.
   */
  pool.on("connection", () => {
    console.log("[Database] New MySQL/TiDB connection established");
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