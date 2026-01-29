// Composant Card Abonnement Dashboard

'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { useSubscription } from '@/hooks';
import { formatDate, formatCurrency } from '@/lib/utils';

export function SubscriptionCard() {
  const { subscription, isActive, remainingDays, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mon abonnement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-gray-100 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mon abonnement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 mb-4">
            Vous n'avez pas d'abonnement actif. Souscrivez pour beneficier de demarches illimitees.
          </p>
          <Link href="/abonnement">
            <Button>S'abonner</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Mon abonnement</CardTitle>
          <Badge variant={isActive ? 'success' : 'secondary'}>
            {subscription.status === 'ACTIVE' && 'Actif'}
            {subscription.status === 'CANCELED' && isActive && `Actif (${remainingDays}j restants)`}
            {subscription.status === 'CANCELED' && !isActive && 'Termine'}
            {subscription.status === 'PAST_DUE' && 'Paiement en retard'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Reference</span>
            <span className="font-medium">{subscription.reference}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Montant mensuel</span>
            <span className="font-medium">{formatCurrency(subscription.amountCents)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Prochaine echeance</span>
            <span>{formatDate(subscription.currentPeriodEnd)}</span>
          </div>
          {subscription.status === 'CANCELED' && subscription.endDate && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Fin des droits</span>
              <span className="text-red-600">{formatDate(subscription.endDate)}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Link href="/espace-membre/mon-abonnement">
            <Button variant="outline" className="w-full">
              Gerer mon abonnement
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
