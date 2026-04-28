// Wrapper embed du formulaire signalement-mairie
// Auto-resize, postMessage vers le parent, pas de redirect (mode iframe)

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SignalementMairieForm } from '@/components/processes/signalement-mairie';
import { Card, CardContent } from '@/components/ui/card';

function postToParent(type: string, data?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.parent !== window) {
    window.parent.postMessage({ source: 'advercity-widget', type, ...data }, '*');
  }
}

export function EmbedSignalementForm() {
  const searchParams = useSearchParams();
  const partner = searchParams.get('partner') || 'default';
  const gclid = searchParams.get('gclid') || undefined;
  const prefillZipCode = searchParams.get('prefillZipCode') || undefined;
  const prefillCity = searchParams.get('prefillCity') || undefined;

  const [completedRef, setCompletedRef] = useState<string | null>(null);

  // Auto-resize de l'iframe en notifiant le parent
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

  if (completedRef) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Signalement envoye !</h2>
            <p className="text-gray-600 mb-1">
              Votre signalement <strong>{completedRef}</strong> a bien ete enregistre.
            </p>
            <p className="text-sm text-gray-500">
              Vous allez recevoir un email de confirmation avec un lien pour suivre son traitement.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Signaler un probleme a la mairie
        </h2>
        <p className="text-gray-500 text-sm">
          Service citoyen gratuit. Votre signalement est transmis directement a la mairie.
        </p>
      </div>

      <SignalementMairieForm
        embedPartner={partner}
        gclid={gclid}
        prefillZipCode={prefillZipCode}
        prefillCity={prefillCity}
        onComplete={() => {}}
        onEmbedComplete={(reference) => {
          setCompletedRef(reference);
          postToParent('complete', { reference });
        }}
      />
    </div>
  );
}
