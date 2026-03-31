// API Admin - Telechargement PDF facture

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';
import { generateInvoicePdf } from '@/lib/invoice';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      user: true,
      process: true,
      deadline: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Facture non trouvee' }, { status: 404 });
  }

  // Si PDF deja genere, valider le domaine avant de rediriger
  if (invoice.pdfUrl) {
    const r2Domain = process.env.R2_PUBLIC_URL || process.env.R2_BUCKET_NAME || '';
    if (r2Domain && invoice.pdfUrl.includes(r2Domain)) {
      return NextResponse.redirect(invoice.pdfUrl);
    }
    // URL non fiable : regenerer le PDF plutot que rediriger
  }

  // Sinon generer a la volee
  const pdfBuffer = await generateInvoicePdf(invoice);
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.number}.pdf"`,
    },
  });
}
