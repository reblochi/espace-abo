// Page Mes Factures

'use client';

import { InvoiceList } from '@/components/invoices';

export default function MesFacturesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes factures</h1>
        <p className="text-gray-500 mt-1">
          Consultez et telechargez vos factures d'abonnement
        </p>
      </div>

      {/* Liste des factures */}
      <InvoiceList />
    </div>
  );
}
