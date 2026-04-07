// Generation de reference client (CLI-00001, CLI-00002, etc.)

import { prisma } from '@/lib/db';

export async function generateClientReference(): Promise<string> {
  const count = await prisma.user.count();
  let nextNum = count + 1;

  // Retry en cas de collision (appels concurrents)
  for (let attempt = 0; attempt < 5; attempt++) {
    const ref = `CLI-${String(nextNum).padStart(5, '0')}`;
    const exists = await prisma.user.findFirst({ where: { reference: ref } });
    if (!exists) return ref;
    nextNum++;
  }

  // Fallback avec timestamp pour garantir l'unicite
  return `CLI-${Date.now()}`;
}
