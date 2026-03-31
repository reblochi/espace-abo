// Generation de reference client (CLI-00001, CLI-00002, etc.)

import { prisma } from '@/lib/db';

export async function generateClientReference(): Promise<string> {
  const last = await prisma.user.findFirst({
    where: { reference: { not: null } },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });

  let nextNum = 1;
  if (last?.reference) {
    const parsed = parseInt(last.reference.replace('CLI-', ''), 10);
    if (!isNaN(parsed)) nextNum = parsed + 1;
  }

  return `CLI-${String(nextNum).padStart(5, '0')}`;
}
