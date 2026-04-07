// API Admin - Liste des templates email

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';

export async function GET() {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      subject: true,
      variables: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(templates);
}
