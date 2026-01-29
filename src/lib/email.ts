// Service d'envoi d'emails (Resend)

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@example.com';
const FROM_NAME = process.env.FROM_NAME || 'Espace Abonnement';

interface EmailOptions {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}

type EmailTemplate =
  | 'welcome'
  | 'subscription-confirmation'
  | 'subscription-canceled'
  | 'process-confirmation'
  | 'process-completed'
  | 'invoice'
  | 'password-reset'
  | 'password-changed';

// Templates HTML (simplifie - en production, utiliser React Email ou MJML)
const templates: Record<EmailTemplate, (data: Record<string, unknown>) => { subject: string; html: string }> = {
  welcome: (data) => ({
    subject: 'Bienvenue sur votre espace abonnement',
    html: `
      <h1>Bienvenue ${data.firstName} !</h1>
      <p>Votre compte a ete cree avec succes.</p>
      <p>Vous pouvez maintenant acceder a votre espace membre.</p>
    `,
  }),

  'subscription-confirmation': (data) => ({
    subject: `Confirmation de votre abonnement ${data.reference}`,
    html: `
      <h1>Merci pour votre abonnement !</h1>
      <p>Votre abonnement <strong>${data.reference}</strong> est maintenant actif.</p>
      <p>Montant: ${data.amount}</p>
      <p>Prochaine echeance: ${data.nextBillingDate}</p>
      ${data.invoiceUrl ? `<p><a href="${data.invoiceUrl}">Telecharger votre facture</a></p>` : ''}
    `,
  }),

  'subscription-canceled': (data) => ({
    subject: 'Confirmation d\'annulation de votre abonnement',
    html: `
      <h1>Votre abonnement a ete annule</h1>
      <p>Nous avons bien pris en compte votre demande d'annulation.</p>
      <p>Vos droits restent actifs jusqu'au ${data.endDate}.</p>
    `,
  }),

  'process-confirmation': (data) => ({
    subject: `Confirmation de votre demarche ${data.reference}`,
    html: `
      <h1>Votre demarche a ete enregistree</h1>
      <p>Reference: <strong>${data.reference}</strong></p>
      <p>Type: ${data.type}</p>
      ${data.isFromSubscription
        ? '<p>Cette demarche est incluse dans votre abonnement.</p>'
        : `<p>Montant: ${data.amount}</p>`
      }
      ${data.invoiceUrl ? `<p><a href="${data.invoiceUrl}">Telecharger votre facture</a></p>` : ''}
    `,
  }),

  'process-completed': (data) => ({
    subject: `Votre demarche ${data.reference} est terminee`,
    html: `
      <h1>Bonne nouvelle !</h1>
      <p>Votre demarche <strong>${data.reference}</strong> est maintenant terminee.</p>
      <p>Vous pouvez consulter le resultat dans votre espace membre.</p>
    `,
  }),

  invoice: (data) => ({
    subject: `Facture ${data.number}`,
    html: `
      <h1>Votre facture ${data.number}</h1>
      <p>Montant: ${data.amount}</p>
      <p><a href="${data.pdfUrl}">Telecharger la facture PDF</a></p>
    `,
  }),

  'password-reset': (data) => ({
    subject: 'Reinitialisation de votre mot de passe',
    html: `
      <h1>Reinitialisation de mot de passe</h1>
      <p>Vous avez demande la reinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour definir un nouveau mot de passe:</p>
      <p><a href="${data.resetUrl}">${data.resetUrl}</a></p>
      <p>Ce lien expire dans 1 heure.</p>
      <p>Si vous n'avez pas demande cette reinitialisation, ignorez cet email.</p>
    `,
  }),

  'password-changed': (data) => ({
    subject: 'Votre mot de passe a ete modifie',
    html: `
      <h1>Mot de passe modifie</h1>
      <p>Votre mot de passe a ete modifie avec succes.</p>
      <p>Si vous n'etes pas a l'origine de cette modification, contactez-nous immediatement.</p>
    `,
  }),
};

// Envoyer un email
export async function sendEmail({ to, subject, template, data }: EmailOptions): Promise<void> {
  const templateFn = templates[template];
  if (!templateFn) {
    throw new Error(`Template email "${template}" non trouve`);
  }

  const { subject: templateSubject, html } = templateFn(data);

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject: subject || templateSubject,
    html,
  });
}

// Envoyer un email brut
export async function sendRawEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
}
