// Composant Timeline demarche

'use client';

import { formatDate } from '@/lib/utils';
import type { ProcessTimeline as TimelineType } from '@/types';

interface Props {
  timeline: TimelineType[];
}

export function ProcessTimeline({ timeline }: Props) {
  return (
    <div className="space-y-4">
      {timeline.map((step, index) => (
        <div key={step.step} className="flex items-start gap-4">
          {/* Indicateur */}
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.completed
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {step.completed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            {index < timeline.length - 1 && (
              <div
                className={`w-0.5 h-8 mt-2 ${
                  step.completed ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>

          {/* Contenu */}
          <div className="flex-1 pb-4">
            <p
              className={`font-medium ${
                step.completed ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {step.label}
            </p>
            {step.date && (
              <p className="text-sm text-gray-500">
                {formatDate(step.date)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
