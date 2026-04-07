// Composant recapitulatif partage — consentements, souscription, delai
// Chaque formulaire passe son propre contenu recap en children

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { formatPrice, type PricingProfile } from '@/lib/process-types';

export type PaymentMode = 'subscription' | 'one_time';

export interface SharedStepSummaryProps {
  isSubscriber: boolean;
  basePrice: number;
  pricing: PricingProfile;
  paymentMode: PaymentMode;
  onPaymentModeChange: (mode: PaymentMode) => void;
  subscriptionConsent: boolean;
  onSubscriptionConsentChange: (checked: boolean) => void;
  /** Contenu recap specifique au formulaire (SummaryCards, timbre fiscal, etc.) */
  children: React.ReactNode;
  /** Texte de delai de traitement */
  delayText?: string;
  /** Montant additionnel (ex: timbre fiscal CNI) en centimes */
  extraAmountCents?: number;
  /** Label de l'extra (ex: "timbre fiscal") */
  extraLabel?: string;
}

export function SharedStepSummary({
  isSubscriber,
  basePrice,
  pricing,
  paymentMode,
  onPaymentModeChange,
  subscriptionConsent,
  onSubscriptionConsentChange,
  children,
  delayText = 'Traitement sous 3 a 5 jours ouvres apres validation.',
  extraAmountCents = 0,
  extraLabel,
}: SharedStepSummaryProps) {
  const SUBSCRIPTION_MONTHLY_PRICE = pricing.subscriptionMonthlyPrice;
  const { watch, setValue, formState: { errors } } = useFormContext<{
    consents: {
      acceptTerms: boolean;
      acceptDataProcessing: boolean;
      certifyAccuracy: boolean;
      retractationExecution: boolean;
      retractationRenonciation: boolean;
    };
  }>();

  return (
    <div className="space-y-6">
      {/* Contenu recap specifique (passe par children) */}
      {children}

      {/* Extra (timbre fiscal, etc.) */}
      {extraAmountCents > 0 && extraLabel && (
        <div className="bg-gray-50 border border-gray-200 p-5">
          <div className="flex justify-between items-baseline">
            <span className="text-base text-gray-900">{extraLabel}</span>
            <span className="text-base font-semibold text-gray-900">{formatPrice(extraAmountCents)}</span>
          </div>
        </div>
      )}

      {/* Consentements */}
      <div className="space-y-3">
        {/* CGV */}
        <div className={`form-gov-checkbox-group ${watch('consents.acceptTerms') ? 'checked' : ''}`}>
          <input
            type="checkbox"
            id="acceptTerms"
            checked={!!watch('consents.acceptTerms')}
            onChange={(e) => setValue('consents.acceptTerms', e.target.checked as unknown as true, { shouldValidate: true })}
          />
          <label htmlFor="acceptTerms">
            J'accepte les{' '}
            <a href="/conditions-generales" target="_blank" className="text-blue-700 underline">
              conditions generales de vente
            </a>
            {' '}et je certifie l'exactitude des informations fournies. *
          </label>
        </div>

        {/* RGPD */}
        <div className={`form-gov-checkbox-group ${watch('consents.acceptDataProcessing') ? 'checked' : ''}`}>
          <input
            type="checkbox"
            id="acceptDataProcessing"
            checked={!!watch('consents.acceptDataProcessing')}
            onChange={(e) => {
              const val = e.target.checked as unknown as true;
              setValue('consents.acceptDataProcessing', val, { shouldValidate: true });
              setValue('consents.certifyAccuracy', val, { shouldValidate: true });
            }}
          />
          <label htmlFor="acceptDataProcessing">
            J'accepte le traitement de mes donnees personnelles conformement au RGPD et a la{' '}
            <a href="/politique-confidentialite" target="_blank" className="text-blue-700 underline">
              politique de confidentialite
            </a>. *
          </label>
        </div>

        {/* Souscription — avant-derniere position */}
        {!isSubscriber && pricing.paymentMode !== 'one_time' && (
          <div className={`form-gov-checkbox-group ${paymentMode === 'subscription' ? 'checked' : ''}`}>
            <input
              type="checkbox"
              id="subscriptionOpt"
              checked={paymentMode === 'subscription'}
              onChange={(e) => {
                onPaymentModeChange(e.target.checked ? 'subscription' : 'one_time');
                onSubscriptionConsentChange(e.target.checked);
              }}
            />
            <label htmlFor="subscriptionOpt">
              Je souscris au Service d'Assistance Administrative a {formatPrice(SUBSCRIPTION_MONTHLY_PRICE)}/mois, sans engagement, resiliable a tout moment.
              {paymentMode !== 'subscription' && (
                <span className="text-gray-400"> Sans souscription, la demarche sera facturee {formatPrice(basePrice)}{extraAmountCents > 0 ? ` + ${formatPrice(extraAmountCents)}` : ''}.</span>
              )}
            </label>
          </div>
        )}

        {/* Retractation */}
        <div className={`form-gov-checkbox-group ${watch('consents.retractationExecution') ? 'checked' : ''}`}>
          <input
            type="checkbox"
            id="retractation"
            checked={!!watch('consents.retractationExecution')}
            onChange={(e) => {
              const val = e.target.checked as unknown as true;
              setValue('consents.retractationExecution', val, { shouldValidate: true });
              setValue('consents.retractationRenonciation', val, { shouldValidate: true });
            }}
          />
          <label htmlFor="retractation">
            Je demande l'execution immediate du service et renonce a mon droit de retractation
            conformement a l'article L221-28 du Code de la consommation. *
          </label>
        </div>

        {(errors.consents?.acceptTerms || errors.consents?.acceptDataProcessing || errors.consents?.certifyAccuracy || errors.consents?.retractationExecution || errors.consents?.retractationRenonciation) && (
          <p className="form-gov-error-msg">Vous devez accepter les conditions pour continuer.</p>
        )}
      </div>

      {/* Delai */}
      <p className="form-gov-hint">{delayText}</p>
    </div>
  );
}

// Utilitaires exportes pour les recaps specifiques
export function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border-l-2 border-l-gray-300 pl-3 py-1">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</h4>
      <div className="text-sm text-gray-900">{children}</div>
    </div>
  );
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export default SharedStepSummary;
