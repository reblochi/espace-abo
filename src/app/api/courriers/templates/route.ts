// API - Liste des templates de courriers

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { COURRIER_TEMPLATES, COURRIER_CATEGORIES } from '@/lib/courrier-templates';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  return NextResponse.json({ templates: COURRIER_TEMPLATES, categories: COURRIER_CATEGORIES });
}
