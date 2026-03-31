// Seed avec vrais clients/abonnements Stripe test
// Usage : STRIPE_SECRET_KEY=sk_test_... DATABASE_URL=... npx tsx prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });
const PRICE_ID = process.env.STRIPE_SUBSCRIPTION_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || '';

// Donnees realistes
const firstNames = [
  'Marie', 'Jean', 'Pierre', 'Isabelle', 'Nicolas', 'Sophie', 'Thomas', 'Camille',
  'Julien', 'Emilie', 'Antoine', 'Charlotte', 'Maxime', 'Alice', 'Alexandre',
  'Lucie', 'Romain', 'Sarah', 'Damien', 'Lea', 'Sebastien', 'Manon', 'Florian',
  'Chloe', 'Olivier', 'Marine', 'Hugo', 'Pauline', 'Clement', 'Clara',
];
const lastNames = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand',
  'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia',
  'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard',
  'Andre', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'Francois', 'Martinez', 'Legrand',
];
const cities = [
  { zip: '75001', city: 'Paris' }, { zip: '69001', city: 'Lyon' },
  { zip: '13001', city: 'Marseille' }, { zip: '31000', city: 'Toulouse' },
  { zip: '33000', city: 'Bordeaux' }, { zip: '44000', city: 'Nantes' },
  { zip: '59000', city: 'Lille' }, { zip: '67000', city: 'Strasbourg' },
  { zip: '35000', city: 'Rennes' }, { zip: '06000', city: 'Nice' },
  { zip: '34000', city: 'Montpellier' }, { zip: '21000', city: 'Dijon' },
  { zip: '37000', city: 'Tours' }, { zip: '29200', city: 'Brest' },
  { zip: '63000', city: 'Clermont-Ferrand' },
];
const streets = [
  'Rue de la Paix', 'Avenue des Champs-Elysees', 'Rue du Commerce',
  'Boulevard Victor Hugo', 'Rue de la Republique', 'Avenue Jean Jaures',
  'Rue des Lilas', 'Place de la Mairie', 'Impasse des Roses',
];
const processTypes = [
  'CIVIL_STATUS_BIRTH', 'CIVIL_STATUS_MARRIAGE', 'CIVIL_STATUS_DEATH',
  'REGISTRATION_CERT', 'IDENTITY_CARD', 'PASSPORT', 'CRIMINAL_RECORD',
] as const;

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgo));
  d.setHours(randomInt(8, 20), randomInt(0, 59));
  return d;
}
function generatePhone(): string { return `06${String(randomInt(10000000, 99999999))}`; }


async function main() {
  if (!PRICE_ID) {
    console.error('❌ STRIPE_SUBSCRIPTION_PRICE_ID ou NEXT_PUBLIC_STRIPE_PRICE_ID requis');
    process.exit(1);
  }

  console.log('Nettoyage BDD...');
  await prisma.consent.deleteMany();
  await prisma.adminAuditLog.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.subscriptionProcessUsage.deleteMany();
  await prisma.processStatusHistory.deleteMany();
  await prisma.processFile.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscriptionDeadline.deleteMany();
  await prisma.process.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();

  // Nettoyer aussi les clients/abos Stripe test
  console.log('Nettoyage Stripe test...');
  const stripeSubs = await stripe.subscriptions.list({ limit: 100, status: 'all' });
  for (const sub of stripeSubs.data) {
    if (sub.status === 'active' || sub.status === 'past_due' || sub.status === 'trialing') {
      await stripe.subscriptions.cancel(sub.id).catch(() => {});
    }
  }
  const stripeCusts = await stripe.customers.list({ limit: 100 });
  for (const cust of stripeCusts.data) {
    await stripe.customers.del(cust.id).catch(() => {});
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  const users: Array<{ id: string; email: string; firstName: string; lastName: string }> = [];

  // --- 20 utilisateurs ---
  console.log('Création de 20 utilisateurs...');
  for (let i = 0; i < 20; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const c = pick(cities);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.fr`;

    const user = await prisma.user.create({
      data: {
        reference: `CLI-${String(i + 1).padStart(5, '0')}`,
        email,
        passwordHash,
        role: i === 0 ? 'ADMIN' : 'USER',
        firstName, lastName,
        gender: Math.random() > 0.5 ? 'M' : 'F',
        phone: generatePhone(),
        birthDate: new Date(randomInt(1960, 2000), randomInt(0, 11), randomInt(1, 28)),
        address: `${randomInt(1, 120)} ${pick(streets)}`,
        zipCode: c.zip, city: c.city,
        createdAt: randomDate(365),
      },
    });
    users.push(user);
  }
  console.log(`  Admin: ${users[0].email} / password123`);

  // --- 10 abonnements Stripe réels ---
  console.log('Création de 10 abonnements Stripe...');
  const subscribedUsers = users.slice(0, 10);
  const subscriptions: Array<{ id: string; stripeSubId: string; userId: string }> = [];

  for (let i = 0; i < subscribedUsers.length; i++) {
    const user = subscribedUsers[i];
    const cardBrand = i % 2 === 0 ? 'visa' : 'mastercard';
    const tokenId = i % 2 === 0 ? 'tok_visa' : 'tok_mastercard';

    // 1. Créer client Stripe avec carte test
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      source: tokenId,
    });

    // 2. Créer abonnement Stripe (paiement immédiat avec carte test)
    const stripeSub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: PRICE_ID }],
    });

    const confirmedSub = stripeSub;

    // Récupérer l'invoice Stripe du premier paiement
    const stripeInvoices = await stripe.invoices.list({ subscription: stripeSub.id, limit: 1 });
    const firstInvoice = stripeInvoices.data[0];

    // Déterminer statut en BDD
    let status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'ENDED' = 'ACTIVE';
    if (i === 8) status = 'CANCELED';
    if (i === 9) status = 'PAST_DUE';

    // 3. Créer en BDD
    const sub = await prisma.subscription.create({
      data: {
        reference: `SUB-2026-${String(i + 1).padStart(6, '0')}`,
        userId: user.id,
        status,
        amountCents: 990,
        startDate: new Date(confirmedSub.created * 1000),
        currentPeriodStart: new Date(confirmedSub.current_period_start * 1000),
        currentPeriodEnd: new Date(confirmedSub.current_period_end * 1000),
        canceledAt: status === 'CANCELED' ? new Date() : null,
        pspProvider: 'stripe',
        pspCustomerId: customer.id,
        pspSubscriptionId: stripeSub.id,
        cardBrand,
        cardLast4: i % 2 === 0 ? '4242' : '5556',
        cardExpMonth: 12,
        cardExpYear: 2028,
      },
    });
    subscriptions.push({ id: sub.id, stripeSubId: stripeSub.id, userId: user.id });

    // 4. Créer l'échéance + facture pour le premier mois (payé)
    const deadline = await prisma.subscriptionDeadline.create({
      data: {
        subscriptionId: sub.id,
        deadlineNumber: 1,
        amountCents: 990,
        dueDate: new Date(confirmedSub.current_period_start * 1000),
        status: 'PERFORMED',
        paymentStatus: 'PAID',
        paidAt: new Date(),
        pspInvoiceId: firstInvoice?.id || null,
      },
    });

    await prisma.invoice.create({
      data: {
        number: `FAC-2026-${String(i + 1).padStart(6, '0')}`,
        userId: user.id,
        type: 'SUBSCRIPTION',
        subtotalCents: 825,
        taxCents: 165,
        totalCents: 990,
        taxRate: 20.0,
        status: 'PAID',
        paidAt: new Date(),
        deadlineId: deadline.id,
      },
    });

    // Consentement CGV
    const cgvText = 'CONDITIONS GÉNÉRALES DE VENTE — France Guichet (SAF) ...';
    await prisma.consent.create({
      data: {
        userId: user.id,
        type: 'SUBSCRIPTION_CGV',
        version: '2026-03-31',
        textHash: crypto.createHash('sha256').update(cgvText).digest('hex'),
        ipAddress: `82.${randomInt(1, 254)}.${randomInt(1, 254)}.${randomInt(1, 254)}`,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        strongAuth: Math.random() > 0.3 ? '3ds_authenticated' : '3ds_attempted',
        consentedAt: new Date(confirmedSub.created * 1000),
      },
    });

    // Annuler sur Stripe si statut CANCELED
    if (status === 'CANCELED') {
      await stripe.subscriptions.cancel(stripeSub.id);
    }

    console.log(`  ${i + 1}/10 ${user.email} → ${customer.id} (${status})`);
  }

  // --- 20 démarches ---
  console.log('Création de 20 démarches...');
  const processStatuses = ['PAID', 'SENT_TO_ADVERCITY', 'IN_PROGRESS', 'COMPLETED', 'PENDING_PAYMENT'] as const;

  for (let i = 0; i < 20; i++) {
    const user = pick(users);
    const type = pick([...processTypes]);
    const status = pick([...processStatuses]);
    const amountCents = pick([1990, 2490, 2990, 3490]);
    const isFromSub = subscribedUsers.includes(user) && Math.random() > 0.5;
    const createdAt = randomDate(200);

    const process = await prisma.process.create({
      data: {
        reference: `DEM-2026-${String(i + 1).padStart(6, '0')}`,
        userId: user.id,
        type, status,
        amountCents: isFromSub ? 0 : amountCents,
        data: { commune: pick(cities).city, nom: user.lastName, prenom: user.firstName },
        isFromSubscription: isFromSub,
        paidAt: ['PAID', 'SENT_TO_ADVERCITY', 'IN_PROGRESS', 'COMPLETED'].includes(status) ? createdAt : null,
        submittedAt: ['SENT_TO_ADVERCITY', 'IN_PROGRESS', 'COMPLETED'].includes(status) ? createdAt : null,
        completedAt: status === 'COMPLETED' ? randomDate(30) : null,
        createdAt,
      },
    });

    // Facture pour les démarches payées (hors abo)
    if (!isFromSub && ['PAID', 'SENT_TO_ADVERCITY', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      const subtotal = Math.round(amountCents / 1.2);
      await prisma.invoice.create({
        data: {
          number: `FAC-2026-${String(100 + i).padStart(6, '0')}`,
          userId: user.id,
          type: 'PROCESS',
          subtotalCents: subtotal,
          taxCents: amountCents - subtotal,
          totalCents: amountCents,
          taxRate: 20.0,
          status: 'PAID',
          paidAt: createdAt,
          processId: process.id,
        },
      });
    }
  }

  // --- Audit logs ---
  await prisma.adminAuditLog.createMany({
    data: [
      {
        adminId: users[0].id,
        action: 'cancel_subscription',
        targetType: 'Subscription',
        targetId: subscriptions[8]?.id || 'unknown',
        metadata: { reason: 'Demande client par email', performedBy: users[0].email },
        createdAt: randomDate(30),
      },
    ],
  });

  // --- Compte admin pa@advercity.fr ---
  const adminHash = await bcrypt.hash('Advercity2026!', 10);
  await prisma.user.create({
    data: {
      reference: `CLI-${String(users.length + 1).padStart(5, '0')}`,
      email: 'pa@advercity.fr',
      passwordHash: adminHash,
      role: 'ADMIN',
      firstName: 'Pierre-Antoine',
      lastName: 'Moulin',
    },
  });
  console.log('Compte admin: pa@advercity.fr / Advercity2026!');

  console.log('\n✅ Seed terminé !');
  console.log('---');
  console.log(`20 utilisateurs (1 admin + 19 clients)`);
  console.log(`10 abonnements Stripe réels (8 actifs, 1 annulé, 1 impayé)`);
  console.log(`20 démarches`);
  console.log(`~20 factures`);
  console.log('---');
  console.log(`Admin: ${users[0].email} / password123`);
  console.log(`\nLes remboursements/annulations passeront par Stripe.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
