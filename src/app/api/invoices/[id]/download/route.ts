// API Route - Telechargement facture PDF

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { generateInvoicePdf } from '@/lib/invoice';

// GET /api/invoices/:id/download - Telecharger facture PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            address: true,
            zipCode: true,
            city: true,
          },
        },
        process: true,
        deadline: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Facture non trouvee' }, { status: 404 });
    }

    // Si le PDF existe deja en cache
    if (invoice.pdfUrl) {
      try {
        const response = await fetch(invoice.pdfUrl);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="facture-${invoice.number}.pdf"`,
            },
          });
        }
      } catch {
        // Si erreur, regenerer le PDF
      }
    }

    // Generer le PDF a la volee
    const pdfBuffer = await generateInvoicePdf(invoice);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${invoice.number}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Erreur telechargement facture:', error);
    return NextResponse.json(
      { error: 'Erreur lors du telechargement' },
      { status: 500 }
    );
  }
}
