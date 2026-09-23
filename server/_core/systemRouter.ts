import { getDb } from "../db";
import { publicProcedure, router } from "./trpc";

export const systemRouter = router({
  /** Simple sonde de disponibilité, utile pour vérifier que l'API répond. */
  ping: publicProcedure.query(() => ({ ok: true, time: new Date().toISOString() })),

  /** Indique si une base de données est configurée et joignable. */
  health: publicProcedure.query(async () => {
    const db = await getDb();
    return { database: db ? "connected" : "unavailable" } as const;
  }),
});
