// Hook de tracking step-by-step pour les formulaires multi-etapes
// Envoie les events en fire-and-forget via sendBeacon (fonctionne meme a la fermeture de page)

'use client';

import { useRef, useEffect, useCallback } from 'react';

type FormEventType = 'FORM_STARTED' | 'STEP_ENTERED' | 'STEP_COMPLETED' | 'FORM_COMPLETED' | 'FORM_ABANDONED';

interface TrackingEvent {
  sessionId: string;
  formType: string;
  stepIndex: number;
  stepName: string;
  event: FormEventType;
  partner?: string;
  pricingCode?: string;
  source?: string;
  processId?: string;
  metadata?: Record<string, unknown>;
}

interface UseFormTrackingOptions {
  formType: string;
  partner?: string;
  pricingCode?: string;
  source: 'direct' | 'embed' | 'widget';
}

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useFormTracking({ formType, partner, pricingCode, source }: UseFormTrackingOptions) {
  const sessionId = useRef(generateSessionId());
  const queue = useRef<TrackingEvent[]>([]);
  const firedEvents = useRef(new Set<string>());
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCompleted = useRef(false);

  const flush = useCallback(() => {
    if (queue.current.length === 0) return;

    const events = [...queue.current];
    queue.current = [];

    const body = JSON.stringify({ events });

    // sendBeacon est fiable meme pendant beforeunload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/tracking', body);
    } else {
      fetch('/api/tracking', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {});
    }
  }, []);

  const enqueue = useCallback(
    (event: FormEventType, stepIndex: number, stepName: string, processId?: string) => {
      // Deduplication (evite les doublons sur retours arriere et double-fire)
      const key = `${event}:${stepIndex}`;
      if (firedEvents.current.has(key)) return;
      firedEvents.current.add(key);

      queue.current.push({
        sessionId: sessionId.current,
        formType,
        stepIndex,
        stepName,
        event,
        partner: partner || undefined,
        pricingCode: pricingCode || undefined,
        source,
        processId,
      });
    },
    [formType, partner, pricingCode, source]
  );

  const trackStepEntered = useCallback(
    (stepIndex: number, stepName: string) => {
      enqueue('STEP_ENTERED', stepIndex, stepName);
    },
    [enqueue]
  );

  const trackStepCompleted = useCallback(
    (stepIndex: number, stepName: string) => {
      enqueue('STEP_COMPLETED', stepIndex, stepName);
    },
    [enqueue]
  );

  const trackFormCompleted = useCallback(
    (processId?: string) => {
      if (isCompleted.current) return;
      isCompleted.current = true;
      enqueue('FORM_COMPLETED', -1, 'completed', processId);
      flush();
    },
    [enqueue, flush]
  );

  const trackFormAbandoned = useCallback(() => {
    if (isCompleted.current) return;
    enqueue('FORM_ABANDONED', -1, 'abandoned');
    flush();
  }, [enqueue, flush]);

  // FORM_STARTED au mount
  useEffect(() => {
    enqueue('FORM_STARTED', 0, 'started');

    // Flush periodique toutes les 2s
    flushTimer.current = setInterval(flush, 2000);

    // Abandon tracking
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackFormAbandoned();
      }
    };
    const handleBeforeUnload = () => {
      trackFormAbandoned();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (flushTimer.current) clearInterval(flushTimer.current);
      flush();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    sessionId: sessionId.current,
    trackStepEntered,
    trackStepCompleted,
    trackFormCompleted,
    trackFormAbandoned,
  };
}
