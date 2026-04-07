// API Admin - Detail et mise a jour d'un template email

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { id } = await params;

  const template = await prisma.emailTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    return NextResponse.json({ error: 'Template non trouve' }, { status: 404 });
  }

  return NextResponse.json(template);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Template non trouve' }, { status: 404 });
  }

  const updated = await prisma.emailTemplate.update({
    where: { id },
    data: {
      subject: body.subject ?? existing.subject,
      html: body.html ?? existing.html,
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      updatedBy: session.user.id,
    },
  });

  return NextResponse.json(updated);
}
