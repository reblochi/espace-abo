// Service d'envoi d'emails (Resend)

import { Resend } from 'resend';
import { prisma } from './db';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@franceguichet.fr';
const FROM_NAME = process.env.FROM_NAME || 'France Guichet';

interface EmailOptions {
  to: string;
  subject?: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
  attachments?: { filename: string; content: Buffer }[];
  userId?: string; // Si fourni, les liens espace-membre utilisent l'auto-login
}

type EmailTemplate =
  | 'welcome'
  | 'subscription-confirmation'
  | 'subscription-canceled'
  | 'process-confirmation'
  | 'process-completed'
  | 'invoice'
  | 'password-reset'
  | 'password-changed'
  | 'unsubscribe-request'
  | 'signalement-mairie'
  | 'signalement-confirmation'
  | 'contact-confirmation'
  | 'contact-admin-reply';

// Remplace les {{variable}} dans une chaine par les valeurs de data
function interpolate(text: string, data: Record<string, unknown>): string {
  // Handle {{#var}}...{{/var}} conditional blocks
  let result = text.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, content) => {
    return data[key] ? content : '';
  });
  // Handle simple {{var}} replacements
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return data[key] != null ? String(data[key]) : '';
  });
  return result;
}

// Templates HTML de fallback (simplifie - en production, utiliser les templates BDD)
const fallbackTemplates: Record<EmailTemplate, (data: Record<string, unknown>) => { subject: string; html: string }> = {
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

  'password-changed': () => ({
    subject: 'Votre mot de passe a ete modifie',
    html: `
      <h1>Mot de passe modifie</h1>
      <p>Votre mot de passe a ete modifie avec succes.</p>
      <p>Si vous n'etes pas a l'origine de cette modification, contactez-nous immediatement.</p>
    `,
  }),

  'unsubscribe-request': (data) => ({
    subject: 'Demande de resiliation de votre abonnement',
    html: `
      <h1>Resiliation de votre abonnement</h1>
      <p>Bonjour ${data.firstName},</p>
      <p>Vous avez demande la resiliation de votre abonnement <strong>${data.reference}</strong>.</p>
      <p>Cliquez sur le lien ci-dessous pour confirmer votre demande:</p>
      <p><a href="${data.unsubscribeUrl}">${data.unsubscribeUrl}</a></p>
      <p>Si vous n'avez pas fait cette demande, ignorez simplement cet email.</p>
    `,
  }),

  'signalement-mairie': (data) => ({
    subject: `[Signalement] ${data.category} - ${data.lieu}`,
    html: `
      <h2>Signalement citoyen</h2>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb;width:140px;">Categorie</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${data.category}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb;">Localisation</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${data.lieu}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb;">Description</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${data.description}</td></tr>
        ${data.nbPiecesJointes ? `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb;">Pieces jointes</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${data.nbPiecesJointes} fichier(s) en piece jointe</td></tr>` : ''}
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb;">Signale par</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${data.userName} (${data.userEmail})</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb;">Date</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${data.date}</td></tr>
      </table>
      <p style="color:#6b7280;font-size:12px;">Ce signalement a ete envoye via franceguichet.fr - Service d'Aide aux Formalites</p>
    `,
  }),

  'contact-confirmation': (data) => ({
    subject: `Votre demande a bien été reçue (${data.reference})`,
    html: `
      <h2>Merci de nous avoir contactés</h2>
      <p>Bonjour ${data.firstName},</p>
      <p>Nous avons bien reçu votre message (réf. <strong>${data.reference}</strong>).</p>
      <p>Notre équipe vous répondra sous 48 heures ouvrées.</p>
      <p>Cordialement,<br/>L'équipe FranceGuichet</p>
    `,
  }),

  'contact-admin-reply': (data) => ({
    subject: `Re: [${data.reference}] Votre demande`,
    html: `
      <p>Bonjour ${data.firstName},</p>
      <p>${data.message}</p>
      <p>--<br/>L'équipe FranceGuichet<br/><em>Réf: ${data.reference}</em></p>
    `,
  }),

  'signalement-confirmation': (data) => ({
    subject: `Votre signalement : ${data.category}`,
    html: `
      <h2>Votre signalement a ete enregistre</h2>
      <p>Bonjour ${data.userName},</p>
      <p>Votre signalement a bien ete ${data.sentToMairie === 'true' ? `transmis a <strong>${data.mairieName}</strong>` : 'enregistre'}.</p>
      ${data.sentToMairie !== 'true' && data.mairieFormulaire ? `<p>Nous n'avons pas pu joindre votre mairie par email. Vous pouvez aussi les contacter directement via leur <a href="${data.mairieFormulaire}">formulaire en ligne</a>.</p>` : ''}
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb;width:140px;">Categorie</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${data.category}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb;">Localisation</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${data.lieu}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb;">Description</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${data.description}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb;">Date</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${data.date}</td></tr>
      </table>
    `,
  }),
};

// Envoyer un email - cherche d'abord en BDD, puis fallback sur templates hardcodes
export async function sendEmail({ to, subject, template, data, attachments, userId }: EmailOptions): Promise<void> {
  const siteUrl = process.env.NEXTAUTH_URL || 'https://franceguichet.fr';

  // Injecter siteUrl dans les data si pas present
  const enrichedData = {
    siteUrl,
    ...data,
  };

  let finalSubject: string;
  let finalHtml: string;
  let finalFromEmail = FROM_EMAIL;
  let finalFromName = FROM_NAME;

  // Essayer de charger le template depuis la BDD
  try {
    const dbTemplate = await prisma.emailTemplate.findUnique({
      where: { slug: template },
    });

    if (dbTemplate) {
      finalSubject = subject || interpolate(dbTemplate.subject, enrichedData);
      finalHtml = interpolate(dbTemplate.html, enrichedData);
      if (dbTemplate.fromEmail) finalFromEmail = dbTemplate.fromEmail;
      if (dbTemplate.fromName) finalFromName = dbTemplate.fromName;
    } else {
      // Fallback sur les templates hardcodes
      const fallbackFn = fallbackTemplates[template];
      if (!fallbackFn) {
        throw new Error(`Template email "${template}" non trouve`);
      }
      const result = fallbackFn(enrichedData);
      finalSubject = subject || result.subject;
      finalHtml = result.html;
    }
  } catch (e) {
    // Si erreur BDD, fallback sur les templates hardcodes
    const fallbackFn = fallbackTemplates[template];
    if (!fallbackFn) {
      throw new Error(`Template email "${template}" non trouve`);
    }
    const result = fallbackFn(enrichedData);
    finalSubject = subject || result.subject;
    finalHtml = result.html;
  }

  // Si userId fourni, remplacer les liens espace-membre par des liens auto-login
  if (userId) {
    try {
      const { generateAutoLoginToken } = await import('@/lib/auto-login');
      const token = generateAutoLoginToken(userId);
      // Remplacer href="{{siteUrl}}/espace-membre/..." par auto-login avec callbackUrl
      finalHtml = finalHtml.replace(
        /href="([^"]*\/espace-membre[^"]*)"/g,
        (_, url) => {
          const path = url.replace(siteUrl, '');
          return `href="${siteUrl}/api/auth/auto-login?token=${encodeURIComponent(token)}&callbackUrl=${encodeURIComponent(path)}"`;
        },
      );
    } catch {
      // Si auto-login non disponible, laisser les liens directs
    }
  }

  await getResend().emails.send({
    from: `${finalFromName} <${finalFromEmail}>`,
    to,
    subject: finalSubject,
    html: finalHtml,
    ...(attachments?.length ? { attachments } : {}),
  });
}

// Envoyer un email brut
export async function sendRawEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: { filename: string; content: Buffer }[]
): Promise<void> {
  await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject,
    html,
    ...(attachments?.length ? { attachments } : {}),
  });
}
