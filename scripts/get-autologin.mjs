import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) {
      let v = m[2];
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  }
}
loadEnv('.env');
loadEnv('.env.local');

const prisma = new PrismaClient();
const SECRET = process.env.NEXTAUTH_SECRET;

function generateAutoLoginToken(userId) {
  const payload = JSON.stringify({
    uid: userId,
    exp: Date.now() + 72 * 60 * 60 * 1000,
    nonce: crypto.randomBytes(8).toString('hex'),
  });
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    crypto.createHash('sha256').update(SECRET).digest(),
    Buffer.alloc(12, 0)
  );
  let encrypted = cipher.update(payload, 'utf8', 'base64url');
  encrypted += cipher.final('base64url');
  const tag = cipher.getAuthTag().toString('base64url');
  return `${encrypted}.${tag}`;
}

const processes = await prisma.process.findMany({
  where: { type: 'SIGNALEMENT_MAIRIE', source: 'embed', partner: 'annuaire-mairie' },
  orderBy: { createdAt: 'desc' },
  take: 5,
  include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
});

console.log('\n=== Dernieres demandes signalement embed annuaire-mairie ===');
for (const p of processes) {
  console.log(`- ${p.reference} | ${p.user.email} | ${p.user.firstName} ${p.user.lastName} | ${p.createdAt.toISOString()}`);
}

if (processes.length > 0) {
  const u = processes[0].user;
  const token = generateAutoLoginToken(u.id);
  const url = `http://localhost:3002/api/auth/auto-login?token=${encodeURIComponent(token)}&callbackUrl=${encodeURIComponent('/espace-membre/signalements')}`;
  console.log(`\n=== Lien auto-login pour ${u.email} (valide 72h) ===`);
  console.log(url);
}

await prisma.$disconnect();
