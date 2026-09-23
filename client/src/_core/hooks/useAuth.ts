import { trpc } from "@/lib/trpc";

/**
 * Hook d'authentification côté client, branché sur le serveur tRPC local
 * (server/routers/auth.ts: `auth.me` / `auth.login` / `auth.register` / `auth.logout`).
 */
export function useAuth() {
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
  });

  return {
    user: meQuery.data ?? null,
    loading: meQuery.isLoading,
    error: meQuery.error ?? null,
    isAuthenticated: Boolean(meQuery.data),
    logout: () => logoutMutation.mutate(),
  };
}
