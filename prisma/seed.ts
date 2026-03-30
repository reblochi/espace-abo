// Seed de donnees realistes pour tester l'admin back-office
// Usage : npx tsx prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Prenoms/noms francais realistes
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
  { zip: '75001', city: 'Paris' },
  { zip: '69001', city: 'Lyon' },
  { zip: '13001', city: 'Marseille' },
  { zip: '31000', city: 'Toulouse' },
  { zip: '33000', city: 'Bordeaux' },
  { zip: '44000', city: 'Nantes' },
  { zip: '59000', city: 'Lille' },
  { zip: '67000', city: 'Strasbourg' },
  { zip: '35000', city: 'Rennes' },
  { zip: '06000', city: 'Nice' },
  { zip: '34000', city: 'Montpellier' },
  { zip: '21000', city: 'Dijon' },
  { zip: '37000', city: 'Tours' },
  { zip: '29200', city: 'Brest' },
  { zip: '63000', city: 'Clermont-Ferrand' },
];

const streets = [
  'Rue de la Paix', 'Avenue des Champs-Elysees', 'Rue du Commerce',
  'Boulevard Victor Hugo', 'Rue de la Republique', 'Avenue Jean Jaures',
  'Rue des Lilas', 'Place de la Mairie', 'Impasse des Roses',
  'Allee des Tilleuls', 'Rue du Moulin', 'Chemin des Vignes',
];

const processTypes = [
  'CIVIL_STATUS_BIRTH', 'CIVIL_STATUS_MARRIAGE', 'CIVIL_STATUS_DEATH',
  'REGISTRATION_CERT', 'IDENTITY_CARD', 'PASSPORT', 'CRIMINAL_RECORD',
  'ADDRESS_CHANGE', 'DRIVING_LICENCE',
] as const;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgo));
  d.setHours(randomInt(8, 20), randomInt(0, 59));
  return d;
}

function generatePhone(): string {
  return `06${String(randomInt(10000000, 99999999))}`;
}

async function main() {
  console.log('Nettoyage des donnees existantes...');
  // Ordre de suppression pour respecter les FK
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

  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('Creation de 30 utilisateurs...');
  const users = [];
  for (let i = 0; i < 30; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const city = pick(cities);
    const user = await prisma.user.create({
      data: {
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.fr`,
        passwordHash,
        role: i === 0 ? 'ADMIN' : 'USER', // Le premier user est admin
        firstName,
        lastName,
        gender: Math.random() > 0.5 ? 'M' : 'F',
        phone: generatePhone(),
        birthDate: new Date(randomInt(1960, 2000), randomInt(0, 11), randomInt(1, 28)),
        address: `${randomInt(1, 120)} ${pick(streets)}`,
        zipCode: city.zip,
        city: city.city,
        createdAt: randomDate(365),
      },
    });
    users.push(user);
  }
  console.log(`  Admin: ${users[0].email} / password123`);

  // 15 utilisateurs avec abonnement
  console.log('Creation de 15 abonnements...');
  const subscribedUsers = users.slice(0, 15);
  const subscriptions = [];

  for (let i = 0; i < subscribedUsers.length; i++) {
    const user = subscribedUsers[i];
    const startDate = randomDate(300);
    const now = new Date();
    const monthsActive = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));

    // Statuts varies
    let status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'ENDED' = 'ACTIVE';
    if (i === 10) status = 'CANCELED';
    if (i === 11) status = 'PAST_DUE';
    if (i === 12) status = 'ENDED';

    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - randomInt(1, 28));
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Cartes avec quelques-unes qui expirent bientot
    const cardBrands = ['visa', 'mastercard', 'visa', 'visa', 'mastercard'];
    let cardExpMonth = randomInt(1, 12);
    let cardExpYear = randomInt(2026, 2029);
    // 3 cartes qui expirent dans les 2 mois
    if (i < 3) {
      cardExpMonth = now.getMonth() + 2; // expire dans ~1 mois
      if (cardExpMonth > 12) { cardExpMonth -= 12; cardExpYear = now.getFullYear() + 1; }
      else cardExpYear = now.getFullYear();
    }

    const sub = await prisma.subscription.create({
      data: {
        reference: `SUB-2026-${String(i + 1).padStart(6, '0')}`,
        userId: user.id,
        status,
        amountCents: 990,
        startDate,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        canceledAt: status === 'CANCELED' ? randomDate(30) : null,
        endDate: status === 'ENDED' ? randomDate(10) : null,
        pspProvider: 'stripe',
        pspCustomerId: `cus_fake_${user.id.slice(0, 8)}`,
        pspSubscriptionId: `sub_fake_${user.id.slice(0, 8)}`,
        cardBrand: pick(cardBrands),
        cardLast4: String(randomInt(1000, 9999)),
        cardExpMonth,
        cardExpYear,
      },
    });
    subscriptions.push(sub);

    // Echeances (entre 1 et monthsActive)
    const numDeadlines = Math.min(monthsActive, randomInt(1, 12));
    for (let d = 1; d <= numDeadlines; d++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + d - 1);

      let paymentStatus: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED' = 'PAID';
      let deadlineStatus: 'PERFORMED' | 'UPCOMING' | 'CANCELED' = 'PERFORMED';
      let paidAt: Date | null = new Date(dueDate);
      paidAt.setDate(paidAt.getDate() + randomInt(0, 2));
      let refundedAt: Date | null = null;
      let refundedAmount: number | null = null;

      // Derniere echeance = UPCOMING si abo actif
      if (d === numDeadlines && status === 'ACTIVE') {
        paymentStatus = 'PENDING';
        deadlineStatus = 'UPCOMING';
        paidAt = null;
      }

      // 2 echeances remboursees sur les abos annules
      if (status === 'CANCELED' && d >= numDeadlines - 1) {
        paymentStatus = 'REFUNDED';
        refundedAt = randomDate(15);
        refundedAmount = 990;
      }

      // 1 echeance echouee sur l'abo PAST_DUE
      if (status === 'PAST_DUE' && d === numDeadlines) {
        paymentStatus = 'FAILED';
        deadlineStatus = 'PERFORMED';
        paidAt = null;
      }

      const deadline = await prisma.subscriptionDeadline.create({
        data: {
          subscriptionId: sub.id,
          deadlineNumber: d,
          amountCents: 990,
          dueDate,
          status: deadlineStatus,
          paymentStatus,
          paidAt,
          refundedAt,
          refundedAmount,
          pspInvoiceId: paymentStatus === 'PAID' || paymentStatus === 'REFUNDED' ? `in_fake_${sub.id.slice(0, 6)}_${d}` : null,
        },
      });

      // Facture pour chaque echeance payee
      if (paymentStatus === 'PAID' || paymentStatus === 'REFUNDED') {
        await prisma.invoice.create({
          data: {
            number: `FAC-2026-${String((i * 12) + d).padStart(6, '0')}`,
            userId: user.id,
            type: 'SUBSCRIPTION',
            subtotalCents: 825, // 9.90 TTC / 1.20
            taxCents: 165,
            totalCents: 990,
            taxRate: 20.0,
            status: 'PAID',
            paidAt: paidAt || new Date(),
            deadlineId: deadline.id,
          },
        });
      }
    }
  }

  // Demarches (40 demarches reparties sur les users)
  console.log('Creation de 40 demarches...');
  const processStatuses = [
    'PAID', 'SENT_TO_ADVERCITY', 'IN_PROGRESS', 'COMPLETED', 'PENDING_PAYMENT', 'DRAFT',
  ] as const;

  for (let i = 0; i < 40; i++) {
    const user = pick(users);
    const type = pick([...processTypes]);
    const status = pick([...processStatuses]);
    const amountCents = pick([1990, 2490, 2990, 3490, 4990]);
    const isFromSub = subscribedUsers.includes(user) && Math.random() > 0.5;
    const createdAt = randomDate(200);

    const process = await prisma.process.create({
      data: {
        reference: `DEM-2026-${String(i + 1).padStart(6, '0')}`,
        userId: user.id,
        type,
        status,
        amountCents: isFromSub ? 0 : amountCents,
        data: {
          commune: pick(cities).city,
          nom: user.lastName,
          prenom: user.firstName,
        },
        isFromSubscription: isFromSub,
        paidAt: ['PAID', 'SENT_TO_ADVERCITY', 'IN_PROGRESS', 'COMPLETED'].includes(status) ? createdAt : null,
        pspPaymentId: ['PAID', 'SENT_TO_ADVERCITY', 'IN_PROGRESS', 'COMPLETED'].includes(status)
          ? `pi_fake_${user.id.slice(0, 6)}_${i}`
          : null,
        submittedAt: ['SENT_TO_ADVERCITY', 'IN_PROGRESS', 'COMPLETED'].includes(status) ? createdAt : null,
        completedAt: status === 'COMPLETED' ? randomDate(30) : null,
        createdAt,
      },
    });

    // Facture pour les demarches payees (hors abo)
    if (!isFromSub && ['PAID', 'SENT_TO_ADVERCITY', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      const subtotal = Math.round(amountCents / 1.2);
      await prisma.invoice.create({
        data: {
          number: `FAC-2026-${String(200 + i).padStart(6, '0')}`,
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

  // 3 avoirs
  console.log('Creation de 3 avoirs...');
  for (let i = 0; i < 3; i++) {
    const user = pick(users);
    const amount = pick([990, 1990, 2490]);
    const subtotal = Math.round(amount / 1.2);
    await prisma.invoice.create({
      data: {
        number: `AVO-2026-${String(i + 1).padStart(6, '0')}`,
        userId: user.id,
        type: 'CREDIT_NOTE',
        subtotalCents: -subtotal,
        taxCents: -(amount - subtotal),
        totalCents: -amount,
        taxRate: 20.0,
        status: 'PAID',
        paidAt: randomDate(60),
      },
    });
  }

  // 4 litiges
  console.log('Creation de 4 litiges...');
  const disputeStatuses: Array<'NEEDS_RESPONSE' | 'UNDER_REVIEW' | 'WON' | 'LOST'> = [
    'NEEDS_RESPONSE', 'UNDER_REVIEW', 'WON', 'LOST',
  ];
  const disputeReasons = ['fraudulent', 'product_not_received', 'duplicate', 'subscription_canceled'];

  for (let i = 0; i < 4; i++) {
    const sub = subscriptions[i];
    const status = disputeStatuses[i];
    const disputedAt = randomDate(90);

    await prisma.dispute.create({
      data: {
        subscriptionId: sub.id,
        pspProvider: 'stripe',
        pspDisputeId: `dp_fake_${String(i + 1).padStart(4, '0')}`,
        pspPaymentId: `pi_fake_dispute_${i}`,
        amountCents: 990,
        status,
        reason: disputeReasons[i],
        disputedAt,
        resolvedAt: ['WON', 'LOST'].includes(status) ? randomDate(30) : null,
        adminNotes: status === 'LOST' ? 'Client confirme la fraude, avoir emis automatiquement.' : null,
      },
    });
  }

  // Quelques audit logs
  console.log('Creation de logs audit...');
  await prisma.adminAuditLog.createMany({
    data: [
      {
        adminId: users[0].id,
        action: 'cancel_subscription',
        targetType: 'Subscription',
        targetId: subscriptions[10]?.id || 'unknown',
        metadata: { reason: 'Demande client par email', immediate: false },
        createdAt: randomDate(30),
      },
      {
        adminId: users[0].id,
        action: 'refund_deadlines',
        targetType: 'Subscription',
        targetId: subscriptions[10]?.id || 'unknown',
        metadata: { deadlineIds: ['fake-1', 'fake-2'], reason: 'Remboursement suite annulation' },
        createdAt: randomDate(28),
      },
      {
        adminId: users[0].id,
        action: 'create_credit_note',
        targetType: 'Invoice',
        targetId: 'fake-invoice-id',
        metadata: { originalInvoiceId: 'fake', amountCents: 990, reason: 'Geste commercial' },
        createdAt: randomDate(15),
      },
    ],
  });

  console.log('\nSeed termine !');
  console.log('---');
  console.log(`30 utilisateurs crees (1 admin + 29 users)`);
  console.log(`15 abonnements (12 actifs, 1 annule, 1 impaye, 1 termine)`);
  console.log(`40 demarches`);
  console.log(`~60 factures + 3 avoirs`);
  console.log(`4 litiges (1 a traiter, 1 en cours, 1 gagne, 1 perdu)`);
  console.log(`3 cartes expirant bientot`);
  console.log(`---`);
  console.log(`Admin: ${users[0].email} / password123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
