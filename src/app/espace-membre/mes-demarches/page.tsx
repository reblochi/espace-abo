// Page Liste des demarches

'use client';

import { ProcessList } from '@/components/processes';
import { Button } from '@/components/ui';
import Link from 'next/link';

export default function MesDemarchesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes demarches</h1>
          <p className="text-gray-500 mt-1">
            Suivez l'avancement de vos procedures administratives
          </p>
        </div>
        <Link href="/nouvelle-demarche">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouvelle demarche
          </Button>
        </Link>
      </div>

      {/* Liste des demarches */}
      <ProcessList />
    </div>
  );
}
