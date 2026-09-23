// E-mails transactionnels indépendants de tout fournisseur.
//
// Si SMTP_HOST + SMTP_USER + SMTP_PASSWORD sont fournis dans l'environnement
// (.env), les e-mails sont réellement envoyés via SMTP (Gmail, SendGrid,
// Mailgun, OVH, etc. fonctionnent tous en SMTP standard). Sinon, l'e-mail est
// simplement journalisé dans la console — utile pour développer sans service
// d'envoi configuré, sans jamais faire échouer l'action métier associée.

import nodemailer, { type Transporter } from "nodemailer";
import { ENV } from "./_core/env";

function isSmtpConfigured(): boolean {
  return Boolean(ENV.smtpHost && ENV.smtpUser && ENV.smtpPassword);
}

let _transporter: Transporter | null = null;
function getTransporter(): Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: ENV.smtpPort,
      secure: ENV.smtpPort === 465,
      auth: { user: ENV.smtpUser, pass: ENV.smtpPassword },
    });
  }
  return _transporter;
}

export type EmailInput = { to: string; subject: string; text: string; html?: string };

/** Envoie un e-mail transactionnel. N'interrompt jamais l'appelant en cas d'échec (log seulement). */
export async function sendEmail(input: EmailInput): Promise<void> {
  if (!isSmtpConfigured()) {
    console.log(`[Email:non configuré] À ${input.to} — ${input.subject}\n${input.text}`);
    return;
  }
  try {
    await getTransporter().sendMail({
      from: ENV.smtpFrom,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? `<p>${input.text.replace(/\n/g, "<br/>")}</p>`,
    });
  } catch (error) {
    console.error("[Email] Échec de l'envoi:", error);
  }
}

const FOOTER = "\n\n— JECI\nCeci est un e-mail automatique, merci de ne pas y répondre directement.";

export const emailTemplates = {
  verificationApproved: (name: string) => ({
    subject: "Votre compte JECI est vérifié",
    text: `Bonjour ${name},\n\nBonne nouvelle : votre compte a été vérifié par l'administration. Le badge bleu de certification est désormais actif sur votre profil, et vous pouvez publier, vous connecter à d'autres Jécistes, échanger des messages et vous inscrire aux événements et opportunités.\n\nRendez-vous sur ${ENV.appBaseUrl} pour découvrir le réseau.${FOOTER}`,
  }),
  verificationRejected: (name: string, reason?: string) => ({
    subject: "Votre demande de vérification JECI",
    text: `Bonjour ${name},\n\nVotre demande de vérification n'a pas pu être validée en l'état.${reason ? `\n\nMotif : ${reason}` : ""}\n\nVous pouvez soumettre de nouveaux justificatifs depuis vos paramètres de compte sur ${ENV.appBaseUrl}/parametres.${FOOTER}`,
  }),
  verificationNeedsInfo: (name: string, reason?: string) => ({
    subject: "Complément requis pour votre vérification JECI",
    text: `Bonjour ${name},\n\nL'administration a besoin d'un complément pour traiter votre demande de vérification.${reason ? `\n\nDétail : ${reason}` : ""}\n\nMerci de compléter votre dossier depuis ${ENV.appBaseUrl}/parametres.${FOOTER}`,
  }),
  connectionAccepted: (name: string, otherName: string) => ({
    subject: `${otherName} a accepté votre demande de connexion`,
    text: `Bonjour ${name},\n\n${otherName} a accepté votre demande de connexion sur JECI. Vous pouvez désormais échanger des messages.\n\n${ENV.appBaseUrl}/messages${FOOTER}`,
  }),
  memberSuspended: (name: string, reason: string) => ({
    subject: "Votre compte JECI a été suspendu",
    text: `Bonjour ${name},\n\nVotre compte a été suspendu par l'administration.\n\nMotif : ${reason}\n\nCette suspension est réversible ; contactez l'administration pour plus d'informations.${FOOTER}`,
  }),
  eventCancelled: (name: string, eventTitle: string, reason?: string) => ({
    subject: `Événement annulé : ${eventTitle}`,
    text: `Bonjour ${name},\n\nL'événement « ${eventTitle} » auquel vous étiez inscrit·e a été annulé.${reason ? `\n\nMotif : ${reason}` : ""}\n\n${ENV.appBaseUrl}/evenements${FOOTER}`,
  }),
};
