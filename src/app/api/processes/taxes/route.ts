// API Route - Calcul des taxes carte grise

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  calculateRegistrationTaxes,
  getRegionalRate,
  formatTaxBreakdown,
  getAllRegionalRates,
} from '@/lib/taxes/registration-certificate';
import { PROCESS_TYPES_CONFIG } from '@/lib/process-types';
import { z } from 'zod';

// Schema de validation pour le calcul des taxes
const taxCalculationSchema = z.object({
  vehicle: z.object({
    fiscalPower: z.number().int().min(1).max(100),
    co2: z.number().int().min(0).max(500).optional(),
    energyId: z.number().int().min(1).max(10),
    state: z.number().int().min(1).max(2), // 1 = neuf, 2 = occasion
    registrationDate: z.string().optional(),
  }),
  departmentCode: z.string().min(2).max(3),
  operationType: z.string().optional(),
});

// GET /api/processes/taxes - Recuperer les taux regionaux
export async function GET() {
  try {
    const rates = getAllRegionalRates();
    return NextResponse.json({ rates });
  } catch (error) {
    console.error('Erreur recuperation taux regionaux:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des taux' },
      { status: 500 }
    );
  }
}

// POST /api/processes/taxes - Calculer les taxes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const result = taxCalculationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation echouee', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { vehicle, departmentCode, operationType } = result.data;

    // Determiner les frais de service selon le type d'operation
    const baseConfig = PROCESS_TYPES_CONFIG.REGISTRATION_CERT;
    let serviceFee = baseConfig.basePrice;

    // Verifier si l'utilisateur a un abonnement actif
    const { checkProcessEligibility } = await import('@/lib/subscription/process-eligibility');
    const eligibility = await checkProcessEligibility(session.user.id, 'REGISTRATION_CERT');

    if (eligibility.eligible) {
      serviceFee = 0; // Inclus dans l'abonnement
    }

    // Calculer les taxes
    const taxes = calculateRegistrationTaxes(
      {
        vehicle: {
          fiscalPower: vehicle.fiscalPower,
          co2: vehicle.co2,
          energyId: vehicle.energyId,
          state: vehicle.state,
          registrationNumber: '',
          registrationDate: vehicle.registrationDate || new Date().toISOString(),
          make: '',
          model: '',
          typeId: 1,
        },
        departmentCode,
      },
      serviceFee
    );

    // Taux regional applicable
    const regionalRate = getRegionalRate(departmentCode);

    // Detail formate
    const breakdown = formatTaxBreakdown(taxes);

    return NextResponse.json({
      taxes,
      breakdown,
      regionalRate,
      isFromSubscription: eligibility.eligible,
      remainingQuota: eligibility.remainingQuota,
    });
  } catch (error) {
    console.error('Erreur calcul taxes:', error);
    return NextResponse.json(
      { error: 'Erreur lors du calcul des taxes' },
      { status: 500 }
    );
  }
}
