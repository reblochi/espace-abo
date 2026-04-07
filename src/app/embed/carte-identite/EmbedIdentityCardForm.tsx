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
  const pricingCode = searchParams.get('pricing') || undefined;

  const processConfig = getProcessTypeConfig('IDENTITY_CARD');

  // Notifier le parent que le formulaire est charge + auto-resize
  useEffect(() => {
    postToParent('ready');

    // Mesurer la hauteur reelle du contenu et l'envoyer au parent
    let lastHeight = 0;
    const sendHeight = () => {
      // Prendre le max de toutes les mesures possibles pour ne rien couper
      const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight,
      );
      if (Math.abs(height - lastHeight) > 2) {
        lastHeight = height;
        postToParent('resize', { height });
      }
    };

    // Observer les changements de taille du contenu
    const ro = new ResizeObserver(sendHeight);
    ro.observe(document.body);
    // MutationObserver pour les changements DOM (autocomplete, erreurs, etc.)
    const mo = new MutationObserver(sendHeight);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true });
    // Polling de secours
    const interval = setInterval(sendHeight, 300);
    // Mesure initiale
    sendHeight();

    return () => { ro.disconnect(); mo.disconnect(); clearInterval(interval); };
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
        pricingCode={pricingCode}
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
        Service fourni par FranceGuichet - Service d'Aide aux Formalites
      </p>
    </div>
  );
}
