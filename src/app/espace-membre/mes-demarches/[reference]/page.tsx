// Page Detail demarche

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProcess } from '@/hooks';
import { ProcessTimeline } from '@/components/processes';
import { ProcessStatusBadge } from '@/components/processes/ProcessStatusBadge';
import { DocumentCard } from '@/components/documents';
import { Card, CardHeader, CardTitle, CardContent, Button, Spinner, Alert } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export default function ProcessDetailPage() {
  const params = useParams();
  const reference = params.reference as string;
  const { data: processData, isLoading, error } = useProcess(reference);

  const processItem = processData;
  const files = processData?.files || [];
  const timeline = processData?.timeline || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !processItem) {
    return (
      <div className="space-y-6">
        <Link href="/espace-membre/mes-demarches">
          <Button variant="ghost">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux demarches
          </Button>
        </Link>
        <Alert variant="error">
          Demarche introuvable ou erreur de chargement.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/espace-membre/mes-demarches">
          <Button variant="ghost" className="mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux demarches
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{processItem.type}</h1>
            <p className="text-gray-500 mt-1">Reference: {processItem.reference}</p>
          </div>
          <ProcessStatusBadge status={processItem.status} />
        </div>
      </div>

      {/* Alerte si en attente de paiement */}
      {processItem.status === 'PENDING_PAYMENT' && (
        <Alert variant="warning" title="En attente de paiement">
          Votre demarche est en attente de paiement.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details de la demarche</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-gray-500">Type de demarche</dt>
                  <dd className="mt-1 font-medium text-gray-900">{processItem.type}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Date de creation</dt>
                  <dd className="mt-1 font-medium text-gray-900">{formatDate(processItem.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Derniere mise a jour</dt>
                  <dd className="mt-1 font-medium text-gray-900">{formatDate(processItem.updatedAt)}</dd>
                </div>
                {processItem.advercityRef && (
                  <div>
                    <dt className="text-sm text-gray-500">Reference Advercity</dt>
                    <dd className="mt-1 font-medium text-gray-900">{processItem.advercityRef}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {files && files.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {files.map((file) => (
                    <DocumentCard key={file.id} document={file} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Aucun document disponible pour cette demarche.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Suivi de la demarche</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline && timeline.length > 0 ? (
                <ProcessTimeline timeline={timeline} />
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Aucune etape disponible.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {processItem.status === 'PENDING_PAYMENT' && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Payer ma demarche
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
