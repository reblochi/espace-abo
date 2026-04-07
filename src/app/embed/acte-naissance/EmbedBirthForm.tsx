// Client component pour le formulaire acte de naissance en mode embed
// Affiche directement le formulaire, sans authentification requise

'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { BirthCertificateForm } from '@/components/processes/birth-certificate';
import { getProcessTypeConfig } from '@/lib/process-types';

// Envoyer un message au parent (site qui embed le widget)
function postToParent(type: string, data?: Record<string, unknown>) {
  if (window.parent !== window) {
    window.parent.postMessage({ source: 'advercity-widget', type, ...data }, '*');
  }
}

export function EmbedBirthForm() {
  const searchParams = useSearchParams();
  const partner = searchParams.get('partner') || 'default';

  const processConfig = getProcessTypeConfig('CIVIL_STATUS_BIRTH');

  // Notifier le parent que le formulaire est charge + auto-resize
  useEffect(() => {
    postToParent('ready');

    let lastHeight = 0;
    const sendHeight = () => {
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

    const ro = new ResizeObserver(sendHeight);
    ro.observe(document.body);
    const mo = new MutationObserver(sendHeight);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true });
    const interval = setInterval(sendHeight, 300);
    sendHeight();

    return () => { ro.disconnect(); mo.disconnect(); clearInterval(interval); };
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Demande d&apos;acte de naissance
        </h2>
        <p className="text-gray-500 text-sm">
          Remplissez le formulaire ci-dessous pour recevoir votre acte.
        </p>
      </div>

      <BirthCertificateForm
        isSubscriber={false}
        basePrice={processConfig?.basePrice ?? 1490}
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
