// Client component pour le formulaire carte d'identité en mode embed
// Affiche directement le formulaire, sans authentification requise

'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { IdentityCardForm } from '@/components/processes/identity-card';
import { getProcessTypeConfig } from '@/lib/process-types';

// Envoyer un message au parent (site qui embed le widget)
function postToParent(type: string, data?: Record<string, unknown>) {
  if (window.parent !== window) {
    window.parent.postMessage({ source: 'advercity-widget', type, ...data }, '*');
  }
}

export function EmbedIdentityCardForm() {
  const searchParams = useSearchParams();
  const partner = searchParams.get('partner') || 'default';

  const processConfig = getProcessTypeConfig('IDENTITY_CARD');

  // Notifier le parent que le formulaire est charge
  useEffect(() => {
    postToParent('ready');
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Demande de carte d&apos;identité
        </h2>
        <p className="text-gray-500 text-sm">
          Remplissez le formulaire ci-dessous pour effectuer votre demande.
        </p>
      </div>

      <IdentityCardForm
        isSubscriber={false}
        basePrice={processConfig?.basePrice ?? 3990}
        embedPartner={partner}
        onComplete={(reference) => {
          postToParent('complete', { reference });
        }}
        onCheckout={(checkoutUrl) => {
          // Ouvrir le checkout dans la fenetre principale (pas dans l'iframe)
          postToParent('checkout', { url: checkoutUrl });
          // Fallback: ouvrir dans le top frame
          if (window.top) {
            window.top.location.href = checkoutUrl;
          }
        }}
      />

      <p className="text-xs text-gray-400 text-center mt-6">
        Service fourni par SAF - Service d'Aide aux Formalités
      </p>
    </div>
  );
}
