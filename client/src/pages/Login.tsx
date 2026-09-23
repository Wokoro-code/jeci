/**
 * Connexion / inscription réelles (mot de passe + hash côté serveur).
 *
 * Le compte créé démarre au statut "pending_verification" : lecture
 * complète du réseau immédiatement, interactions ouvertes après validation
 * administrative (voir server/db/verification.ts).
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return "Une erreur est survenue.";
}

export default function Login() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const onAuthSuccess = async () => {
    await utils.auth.me.invalidate();
    toast.success("Connexion réussie.");
    setLocation("/");
  };

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: onAuthSuccess,
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: onAuthSuccess,
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (!loginEmail || !loginPassword) return;
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !registerEmail || !registerPassword) return;
    registerMutation.mutate({ name, email: registerEmail, password: registerPassword });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FCF8EF] p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <img src="/favicon.png" alt="Logo JECI-IYCS" className="mx-auto mb-2 h-16 w-16 object-contain" />
          <CardTitle className="text-center">JECI</CardTitle>
          <CardDescription className="text-center">Connectez-vous ou créez votre compte JEC.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Créer un compte</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input id="login-email" type="email" required placeholder="vous@exemple.com" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <Input id="login-password" type="password" required value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nom complet</Label>
                  <Input id="register-name" required placeholder="Jean Dupont" value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">E-mail</Label>
                  <Input id="register-email" type="email" required placeholder="vous@exemple.com" value={registerEmail} onChange={(event) => setRegisterEmail(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Mot de passe</Label>
                  <Input id="register-password" type="password" required minLength={8} value={registerPassword} onChange={(event) => setRegisterPassword(event.target.value)} />
                  <p className="text-xs text-muted-foreground">Au moins 8 caractères.</p>
                </div>
                <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Création..." : "Créer mon compte"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
