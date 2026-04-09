// API Admin - Seed des templates email depuis les templates hardcodes

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';

const DEFAULT_TEMPLATES = [
  {
    slug: 'welcome',
    name: 'Bienvenue',
    description: 'Email envoye apres la creation d\'un compte',
    subject: 'Bienvenue sur votre espace abonnement',
    variables: ['firstName'],
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#1e40af;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">France Guichet</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:20px;">Bienvenue {{firstName}} !</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 16px;">Votre compte a ete cree avec succes.</p>
    <p style="color:#475569;line-height:1.6;margin:0 0 24px;">Vous pouvez maintenant acceder a votre espace membre pour gerer vos demarches administratives.</p>
    <a href="{{siteUrl}}/espace-membre" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;">Acceder a mon espace</a>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">France Guichet - Service d'Aide aux Formalites</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  },
  {
    slug: 'subscription-confirmation',
    name: 'Confirmation abonnement',
    description: 'Email envoye apres la souscription d\'un abonnement',
    subject: 'Confirmation de votre abonnement {{reference}}',
    variables: ['firstName', 'reference', 'amount', 'nextBillingDate', 'invoiceUrl'],
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#1e40af;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">France Guichet</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:20px;">Merci pour votre abonnement !</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 16px;">Votre abonnement <strong>{{reference}}</strong> est maintenant actif.</p>
    <table width="100%" style="background:#f8fafc;border-radius:6px;margin:0 0 24px;" cellpadding="16" cellspacing="0">
      <tr><td style="color:#475569;border-bottom:1px solid #e2e8f0;">Montant mensuel</td><td style="color:#1e293b;font-weight:600;text-align:right;border-bottom:1px solid #e2e8f0;">{{amount}}</td></tr>
      <tr><td style="color:#475569;">Prochaine echeance</td><td style="color:#1e293b;font-weight:600;text-align:right;">{{nextBillingDate}}</td></tr>
    </table>
    {{#invoiceUrl}}<a href="{{invoiceUrl}}" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;">Telecharger la facture</a>{{/invoiceUrl}}
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">France Guichet - Service d'Aide aux Formalites</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  },
  {
    slug: 'subscription-canceled',
    name: 'Annulation abonnement',
    description: 'Email envoye apres annulation d\'un abonnement',
    subject: 'Confirmation d\'annulation de votre abonnement',
    variables: ['firstName', 'endDate'],
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#1e40af;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">France Guichet</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:20px;">Votre abonnement a ete annule</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 16px;">Nous avons bien pris en compte votre demande d'annulation.</p>
    <p style="color:#475569;line-height:1.6;margin:0 0 24px;">Vos droits restent actifs jusqu'au <strong>{{endDate}}</strong>.</p>
    <p style="color:#475569;line-height:1.6;margin:0;">Vous pouvez reactiver votre abonnement a tout moment depuis votre espace membre.</p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">France Guichet - Service d'Aide aux Formalites</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  },
  {
    slug: 'process-confirmation',
    name: 'Confirmation demarche',
    description: 'Email envoye apres l\'enregistrement d\'une demarche',
    subject: 'Confirmation de votre demarche {{reference}}',
    variables: ['firstName', 'reference', 'type', 'amount', 'isFromSubscription', 'invoiceUrl'],
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#1e40af;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">France Guichet</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:20px;">Votre demarche a ete enregistree</h2>
    <table width="100%" style="background:#f8fafc;border-radius:6px;margin:0 0 24px;" cellpadding="16" cellspacing="0">
      <tr><td style="color:#475569;border-bottom:1px solid #e2e8f0;">Reference</td><td style="color:#1e293b;font-weight:600;text-align:right;border-bottom:1px solid #e2e8f0;">{{reference}}</td></tr>
      <tr><td style="color:#475569;border-bottom:1px solid #e2e8f0;">Type</td><td style="color:#1e293b;text-align:right;border-bottom:1px solid #e2e8f0;">{{type}}</td></tr>
      <tr><td style="color:#475569;">Montant</td><td style="color:#1e293b;font-weight:600;text-align:right;">{{amount}}</td></tr>
    </table>
    {{#invoiceUrl}}<a href="{{invoiceUrl}}" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;">Telecharger la facture</a>{{/invoiceUrl}}
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">France Guichet - Service d'Aide aux Formalites</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  },
  {
    slug: 'process-completed',
    name: 'Demarche terminee',
    description: 'Email envoye quand une demarche est terminee',
    subject: 'Votre demarche {{reference}} est terminee',
    variables: ['firstName', 'reference'],
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#1e40af;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">France Guichet</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#16a34a;margin:0 0 16px;font-size:20px;">Bonne nouvelle !</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 16px;">Votre demarche <strong>{{reference}}</strong> est maintenant terminee.</p>
    <p style="color:#475569;line-height:1.6;margin:0 0 24px;">Vous pouvez consulter le resultat dans votre espace membre.</p>
    <a href="{{siteUrl}}/espace-membre/mes-demarches" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;">Voir mes demarches</a>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">France Guichet - Service d'Aide aux Formalites</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  },
  {
    slug: 'invoice',
    name: 'Facture',
    description: 'Email avec lien vers la facture PDF',
    subject: 'Facture {{number}}',
    variables: ['firstName', 'number', 'amount', 'pdfUrl'],
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#1e40af;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">France Guichet</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:20px;">Votre facture {{number}}</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 16px;">Montant : <strong>{{amount}}</strong></p>
    <a href="{{pdfUrl}}" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;">Telecharger la facture PDF</a>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">France Guichet - Service d'Aide aux Formalites</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  },
  {
    slug: 'password-reset',
    name: 'Reinitialisation mot de passe',
    description: 'Email avec lien de reinitialisation du mot de passe',
    subject: 'Reinitialisation de votre mot de passe',
    variables: ['firstName', 'resetUrl'],
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#1e40af;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">France Guichet</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:20px;">Reinitialisation de mot de passe</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 16px;">Vous avez demande la reinitialisation de votre mot de passe.</p>
    <p style="color:#475569;line-height:1.6;margin:0 0 24px;">Cliquez sur le bouton ci-dessous pour definir un nouveau mot de passe :</p>
    <a href="{{resetUrl}}" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;">Reinitialiser mon mot de passe</a>
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:16px 0 0;">Ce lien expire dans 1 heure. Si vous n'avez pas demande cette reinitialisation, ignorez cet email.</p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">France Guichet - Service d'Aide aux Formalites</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  },
  {
    slug: 'password-changed',
    name: 'Mot de passe modifie',
    description: 'Email de confirmation apres changement de mot de passe',
    subject: 'Votre mot de passe a ete modifie',
    variables: ['firstName'],
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#1e40af;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">France Guichet</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:20px;">Mot de passe modifie</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 16px;">Votre mot de passe a ete modifie avec succes.</p>
    <p style="color:#dc2626;line-height:1.6;margin:0;">Si vous n'etes pas a l'origine de cette modification, contactez-nous immediatement.</p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">France Guichet - Service d'Aide aux Formalites</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  },
  {
    slug: 'unsubscribe-request',
    name: 'Demande de resiliation',
    description: 'Email avec lien de confirmation de resiliation',
    subject: 'Demande de resiliation de votre abonnement',
    variables: ['firstName', 'reference', 'unsubscribeUrl'],
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#1e40af;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">France Guichet</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:20px;">Resiliation de votre abonnement</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 16px;">Bonjour {{firstName}},</p>
    <p style="color:#475569;line-height:1.6;margin:0 0 16px;">Vous avez demande la resiliation de votre abonnement <strong>{{reference}}</strong>.</p>
    <p style="color:#475569;line-height:1.6;margin:0 0 24px;">Cliquez sur le bouton ci-dessous pour confirmer votre demande :</p>
    <a href="{{unsubscribeUrl}}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;">Confirmer la resiliation</a>
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:16px 0 0;">Si vous n'avez pas fait cette demande, ignorez simplement cet email.</p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">France Guichet - Service d'Aide aux Formalites</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  },
  {
    slug: 'signalement-mairie',
    name: 'Signalement - Email mairie',
    description: 'Email envoye a la mairie lors d\'un signalement citoyen',
    subject: '[Signalement] {{category}} - {{lieu}}',
    variables: ['category', 'lieu', 'description', 'userName', 'userEmail', 'date', 'nbPiecesJointes'],
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#1e40af;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">Signalement citoyen</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <table width="100%" style="border-collapse:collapse;margin:0 0 24px;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;width:140px;color:#475569;">Categorie</td><td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b;">{{category}}</td></tr>
      <tr><td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;color:#475569;">Localisation</td><td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b;">{{lieu}}</td></tr>
      <tr><td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;color:#475569;">Description</td><td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b;">{{description}}</td></tr>
      {{#nbPiecesJointes}}<tr><td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;color:#475569;">Pieces jointes</td><td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b;">{{nbPiecesJointes}} fichier(s) en piece jointe</td></tr>{{/nbPiecesJointes}}
      <tr><td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;color:#475569;">Signale par</td><td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b;">{{userName}} ({{userEmail}})</td></tr>
      <tr><td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;color:#475569;">Date</td><td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b;">{{date}}</td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">Ce signalement a ete envoye via franceguichet.fr - Service d'Aide aux Formalites</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  },
  {
    slug: 'signalement-confirmation',
    name: 'Signalement - Confirmation citoyen',
    description: 'Email de confirmation envoye au citoyen apres un signalement',
    subject: 'Votre signalement : {{category}}',
    variables: ['category', 'lieu', 'description', 'userName', 'date', 'sentToMairie', 'mairieName', 'mairieFormulaire'],
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#1e40af;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">France Guichet</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:20px;">Votre signalement a ete enregistre</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 16px;">Bonjour {{userName}},</p>
    {{#sentToMairie}}<p style="color:#475569;line-height:1.6;margin:0 0 16px;">Votre signalement a bien ete transmis a <strong>{{mairieName}}</strong>.</p>{{/sentToMairie}}
    {{#mairieFormulaire}}<p style="color:#475569;line-height:1.6;margin:0 0 16px;">Nous n'avons pas pu joindre votre mairie par email. Vous pouvez aussi les contacter directement via leur <a href="{{mairieFormulaire}}" style="color:#1e40af;">formulaire en ligne</a>.</p>{{/mairieFormulaire}}
    <table width="100%" style="border-collapse:collapse;margin:0 0 24px;" cellpadding="0" cellspacing="0">
      <tr><td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;width:140px;color:#475569;">Categorie</td><td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b;">{{category}}</td></tr>
      <tr><td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;color:#475569;">Localisation</td><td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b;">{{lieu}}</td></tr>
      <tr><td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;color:#475569;">Description</td><td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b;">{{description}}</td></tr>
      <tr><td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;color:#475569;">Date</td><td style="padding:10px 14px;border:1px solid #e2e8f0;color:#1e293b;">{{date}}</td></tr>
    </table>
    <a href="{{siteUrl}}/espace-membre/signalements" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;">Voir mes signalements</a>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">France Guichet - Service d'Aide aux Formalites</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  },
  {
    slug: 'contact-confirmation',
    name: 'Contact - Confirmation',
    description: 'Email envoye au client apres soumission du formulaire de contact',
    subject: 'Votre demande a bien ete recue ({{reference}})',
    variables: ['firstName', 'reference'],
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#1e40af;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">France Guichet</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="color:#1e293b;margin:0 0 16px;font-size:20px;">Merci de nous avoir contactes</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 16px;">Bonjour {{firstName}},</p>
    <p style="color:#475569;line-height:1.6;margin:0 0 16px;">Nous avons bien recu votre message (ref. <strong>{{reference}}</strong>).</p>
    <p style="color:#475569;line-height:1.6;margin:0 0 24px;">Notre equipe vous repondra sous 48 heures ouvrees.</p>
    <a href="{{siteUrl}}/espace-membre/messagerie" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;">Voir ma messagerie</a>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">France Guichet - Service d'Aide aux Formalites</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  },
  {
    slug: 'contact-admin-reply',
    name: 'Contact - Reponse agent',
    description: 'Email envoye au client quand un agent repond a sa demande de contact',
    subject: 'Re: [{{reference}}] Votre demande',
    variables: ['firstName', 'lastName', 'reference', 'message'],
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#1e40af;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">France Guichet</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#475569;line-height:1.6;margin:0 0 16px;">Bonjour {{firstName}},</p>
    <div style="color:#1e293b;line-height:1.6;margin:0 0 24px;padding:16px;background:#f8fafc;border-radius:6px;border-left:4px solid #1e40af;">{{message}}</div>
    <p style="color:#475569;line-height:1.6;margin:0 0 24px;">Vous pouvez repondre directement depuis votre espace membre :</p>
    <a href="{{siteUrl}}/espace-membre/messagerie" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;">Voir la conversation</a>
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:16px 0 0;">Ref : {{reference}}</p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:13px;margin:0;">France Guichet - Service d'Aide aux Formalites</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  },
];

export async function POST() {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  try {
    const results = [];

    for (const tpl of DEFAULT_TEMPLATES) {
      const existing = await prisma.emailTemplate.findUnique({
        where: { slug: tpl.slug },
      });

      if (existing) {
        results.push({ slug: tpl.slug, action: 'skipped' });
      } else {
        await prisma.emailTemplate.create({ data: tpl });
        results.push({ slug: tpl.slug, action: 'created' });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Seed email templates error:', error);
    return NextResponse.json(
      { error: 'Erreur seed', details: String(error) },
      { status: 500 }
    );
  }
}
