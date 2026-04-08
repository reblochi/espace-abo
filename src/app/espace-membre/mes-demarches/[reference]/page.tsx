// Page Detail demarche

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProcess } from '@/hooks';
import { ProcessTimeline, ContactSupportModal } from '@/components/processes';
import { ProcessStatusBadge } from '@/components/processes/ProcessStatusBadge';
import { DocumentCard } from '@/components/documents';
import { DocumentUploadSection } from '@/components/documents/DocumentUploadSection';
import { getRequiredDocuments } from '@/lib/process-types';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert, Badge } from '@/components/ui';
import { SkeletonCard, Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { getProcessTypeConfig, formatPrice } from '@/lib/process-types';
import type { ProcessType } from '@/types';

export default function ProcessDetailPage() {
  const params = useParams();
  const reference = params.reference as string;
  const { data: processData, isLoading, error } = useProcess(reference);
  const [showContactModal, setShowContactModal] = useState(false);

  const processItem = processData;
  const files = processData?.files || [];
  const timeline = processData?.timeline || [];
  const statusHistory = processData?.statusHistory || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
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

  const processConfig = getProcessTypeConfig(processItem.type as ProcessType);
  const processDataContent = processItem.data as Record<string, unknown>;
  const isVehicleProcess = processItem.type === 'REGISTRATION_CERT';
  const isCivilStatus = ['CIVIL_STATUS_BIRTH', 'CIVIL_STATUS_MARRIAGE', 'CIVIL_STATUS_DEATH'].includes(processItem.type);

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
            <h1 className="text-2xl font-bold text-gray-900">
              {processConfig?.label || processItem.type}
            </h1>
            <p className="text-gray-500 mt-1">Référence: {processItem.reference}</p>
          </div>
          <ProcessStatusBadge status={processItem.status} isFree={processItem.amountCents === 0} />
        </div>
      </div>

      {/* Alerte si en attente de paiement */}
      {processItem.status === 'PENDING_PAYMENT' && (
        <Alert variant="warning" title="En attente de paiement">
          Votre demarche est en attente de paiement.
        </Alert>
      )}

      {/* Alerte si information manquante */}
      {processItem.status === 'AWAITING_INFO' && (
        <Alert variant="warning" title="Information requise">
          Des informations supplementaires sont necessaires pour traiter votre dossier.
          Veuillez verifier vos emails ou les documents ci-dessous.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details generaux */}
          <Card>
            <CardHeader>
              <CardTitle>Details de la demarche</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-gray-500">Type de démarche</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {processConfig?.label || processItem.type}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Date de creation</dt>
                  <dd className="mt-1 font-medium text-gray-900">{formatDate(processItem.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Derniere mise à jour</dt>
                  <dd className="mt-1 font-medium text-gray-900">{formatDate(processItem.updatedAt)}</dd>
                </div>
                {processItem.completedAt && (
                  <div>
                    <dt className="text-sm text-gray-500">Date de completion</dt>
                    <dd className="mt-1 font-medium text-gray-900">{formatDate(processItem.completedAt)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-500">Montant</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {processItem.amountCents === 0 ? (
                      <span className="text-green-600">Gratuit</span>
                    ) : processItem.isFromSubscription ? (
                      <span className="text-green-600">Inclus (abonnement)</span>
                    ) : processItem.pricePaid ? (
                      formatPrice(processItem.pricePaid)
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </dd>
                </div>
                {processItem.advercityRef && (
                  <div>
                    <dt className="text-sm text-gray-500">Référence Advercity</dt>
                    <dd className="mt-1 font-medium text-gray-900 font-mono text-sm">
                      {processItem.advercityRef}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Details specifiques selon le type */}
          {isCivilStatus && processDataContent && (
            <Card>
              <CardHeader>
                <CardTitle>Informations de la demande</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-gray-500">Beneficiaire</dt>
                    <dd className="mt-1 font-medium text-gray-900">
                      {processDataContent.beneficiaryFirstName as string} {processDataContent.beneficiaryLastName as string}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Date de naissance</dt>
                    <dd className="mt-1 font-medium text-gray-900">
                      {processDataContent.beneficiaryBirthDate as string}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Commune</dt>
                    <dd className="mt-1 font-medium text-gray-900">
                      {processDataContent.eventCityName as string}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Date de l'evenement</dt>
                    <dd className="mt-1 font-medium text-gray-900">
                      {processDataContent.eventDate as string}
                    </dd>
                  </div>
                  {processItem.type === 'CIVIL_STATUS_MARRIAGE' && processDataContent.spouseFirstName && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm text-gray-500">Conjoint</dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {processDataContent.spouseFirstName as string} {processDataContent.spouseLastName as string}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {isVehicleProcess && processDataContent && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Informations du vehicule</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-gray-500">Immatriculation</dt>
                      <dd className="mt-1 font-medium text-gray-900 font-mono">
                        {(processDataContent.vehicle as Record<string, unknown>)?.registrationNumber as string}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Marque / Modele</dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {(processDataContent.vehicle as Record<string, unknown>)?.make as string}{' '}
                        {(processDataContent.vehicle as Record<string, unknown>)?.model as string}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Puissance fiscale</dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {(processDataContent.vehicle as Record<string, unknown>)?.fiscalPower as number} CV
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Etat</dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {(processDataContent.vehicle as Record<string, unknown>)?.state === 1 ? 'Neuf' : 'Occasion'}
                      </dd>
                    </div>
                    {(processDataContent.vehicle as Record<string, unknown>)?.co2 && (
                      <div>
                        <dt className="text-sm text-gray-500">Emissions CO2</dt>
                        <dd className="mt-1 font-medium text-gray-900">
                          {(processDataContent.vehicle as Record<string, unknown>)?.co2 as number} g/km
                        </dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Titulaire</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {(processDataContent.holder as Record<string, unknown>)?.isCompany ? (
                      <>
                        <div>
                          <dt className="text-sm text-gray-500">Raison sociale</dt>
                          <dd className="mt-1 font-medium text-gray-900">
                            {(processDataContent.holder as Record<string, unknown>)?.companyName as string}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">SIRET</dt>
                          <dd className="mt-1 font-medium text-gray-900 font-mono">
                            {(processDataContent.holder as Record<string, unknown>)?.siret as string}
                          </dd>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <dt className="text-sm text-gray-500">Nom complet</dt>
                          <dd className="mt-1 font-medium text-gray-900">
                            {(processDataContent.holder as Record<string, unknown>)?.civility === 1 ? 'M.' : 'Mme'}{' '}
                            {(processDataContent.holder as Record<string, unknown>)?.firstName as string}{' '}
                            {(processDataContent.holder as Record<string, unknown>)?.lastName as string}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Date de naissance</dt>
                          <dd className="mt-1 font-medium text-gray-900">
                            {(processDataContent.holder as Record<string, unknown>)?.birthDate as string}
                          </dd>
                        </div>
                      </>
                    )}
                    <div className="sm:col-span-2">
                      <dt className="text-sm text-gray-500">Adresse</dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {(processDataContent.holder as Record<string, unknown>)?.address as string}<br />
                        {(processDataContent.holder as Record<string, unknown>)?.postalCode as string}{' '}
                        {(processDataContent.holder as Record<string, unknown>)?.city as string}
                      </dd>
                    </div>
                  </dl>

                  {processDataContent.coOwner && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Co-titulaire</h4>
                      <p className="font-medium text-gray-900">
                        {(processDataContent.coOwner as Record<string, unknown>)?.civility === 1 ? 'M.' : 'Mme'}{' '}
                        {(processDataContent.coOwner as Record<string, unknown>)?.firstName as string}{' '}
                        {(processDataContent.coOwner as Record<string, unknown>)?.lastName as string}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {processItem.pricePaid && processDataContent.taxesBreakdown && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detail du cout</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(processDataContent.taxesBreakdown as Record<string, number>).taxeRegionale > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Taxe regionale</span>
                          <span>{formatPrice((processDataContent.taxesBreakdown as Record<string, number>).taxeRegionale)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taxe de gestion</span>
                        <span>{formatPrice((processDataContent.taxesBreakdown as Record<string, number>).taxeGestion)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Redevance d'acheminement</span>
                        <span>{formatPrice((processDataContent.taxesBreakdown as Record<string, number>).taxeAcheminement)}</span>
                      </div>
                      {(processDataContent.taxesBreakdown as Record<string, number>).malus > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Malus ecologique</span>
                          <span>{formatPrice((processDataContent.taxesBreakdown as Record<string, number>).malus)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frais de service</span>
                        {processItem.isFromSubscription ? (
                          <span className="text-green-600">Inclus</span>
                        ) : (
                          <span>{formatPrice((processDataContent.taxesBreakdown as Record<string, number>).serviceFee)}</span>
                        )}
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                        <span>Total paye</span>
                        <span className="text-blue-600">{formatPrice(processItem.pricePaid)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Documents obligatoires + Upload */}
          {(() => {
            const requiredDocs = processItem ? getRequiredDocuments(
              processItem.type as ProcessType,
              processItem.data as Record<string, unknown>
            ) : [];
            const hasRequiredDocs = requiredDocs.length > 0;

            return (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Documents
                    {hasRequiredDocs && processItem?.status === 'PENDING_DOCUMENTS' && (
                      <Badge variant="warning" className="ml-2 text-xs">A completer</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasRequiredDocs ? (
                    <DocumentUploadSection
                      reference={reference}
                      requiredDocuments={requiredDocs}
                      uploadedFiles={files as Array<{ id: string; fileType: string; originalName: string }>}
                      processStatus={processItem?.status || ''}
                      onAllUploaded={async () => {
                        try {
                          const res = await fetch(`/api/processes/${reference}/submit`, { method: 'POST' });
                          if (!res.ok) {
                            const err = await res.json();
                            alert(err.error || 'Erreur lors de la soumission');
                          } else {
                            window.location.reload();
                          }
                        } catch {
                          alert('Erreur lors de la soumission');
                        }
                      }}
                    />
                  ) : files && files.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {files.map((file: { id: string }) => (
                        <DocumentCard key={file.id} document={file} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Aucun document requis pour cette demarche.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>

        {/* Sidebar: Timeline et Actions */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Suivi de la demarche</CardTitle>
            </CardHeader>
            <CardContent>
              {statusHistory && statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {statusHistory.map((item: { id: string; status: string; notes: string | null; createdAt: string }, index: number) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                        }`} />
                        {index < statusHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium text-gray-900">
                          {item.status === 'PENDING_PAYMENT' && 'En attente de paiement'}
                          {item.status === 'PAID' && (processItem.amountCents === 0 ? 'Demande validee' : 'Paiement recu')}
                          {item.status === 'SENT_TO_ADVERCITY' && 'Envoye pour traitement'}
                          {item.status === 'IN_PROGRESS' && 'Dossier en cours'}
                          {item.status === 'AWAITING_INFO' && 'Information requise'}
                          {item.status === 'COMPLETED' && 'Demarche terminee'}
                          {item.status === 'CANCELLED' && 'Demarche annulee'}
                          {item.status === 'REFUNDED' && 'Remboursement effectue'}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : timeline && timeline.length > 0 ? (
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
            <Card>
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

          {/* Information delai */}
          {processItem.status === 'IN_PROGRESS' && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delai estime</p>
                    <p className="text-sm text-gray-500">
                      {processConfig?.estimatedDelay || '5-10 jours ouvres'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact support */}
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-gray-500 mb-3">
                Une question sur votre demarche ?
              </p>
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => setShowContactModal(true)}
              >
                Contacter le support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal contact support */}
      <ContactSupportModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        processRéférence={reference}
      />
    </div>
  );
}
