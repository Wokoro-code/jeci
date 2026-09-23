/** Garde-fous de routage : redirige les visiteurs non connectés, et restreint l'espace admin au rôle administrateur. */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

function FullScreenLoader() {
  return <div className="flex min-h-screen items-center justify-center bg-[#FCF8EF] text-sm text-[#707787]">Chargement...</div>;
}

/** Toute page membre exige d'être connecté. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  if (loading) return <FullScreenLoader />;
  if (!user) return null;
  return <>{children}</>;
}

/** L'espace admin exige d'être connecté ET d'avoir le rôle administrateur. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "admin") {
      toast.error("Cet espace est réservé aux administrateurs.");
      navigate("/");
    }
  }, [loading, user, navigate]);

  if (loading || !user || user.role !== "admin") return <FullScreenLoader />;
  return <>{children}</>;
}
