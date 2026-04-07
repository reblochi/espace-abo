// Visualisation funnel step-by-step pour les formulaires
// Barres horizontales avec taux d'abandon entre chaque etape

'use client';

interface FunnelStep {
  stepIndex: number;
  stepName: string;
  entered: number;
  completed: number;
  dropOffRate: number;
}

interface FunnelChartProps {
  formType: string;
  steps: FunnelStep[];
  totalStarted: number;
  totalCompleted: number;
  conversionRate: number;
}

const FORM_TYPE_LABELS: Record<string, string> = {
  IDENTITY_CARD: 'Carte d\'identite',
  CIVIL_STATUS_BIRTH: 'Acte de naissance',
  REGISTRATION_CERT: 'Carte grise',
  CIVIL_STATUS_MARRIAGE: 'Acte de mariage',
  CIVIL_STATUS_DEATH: 'Acte de deces',
  PASSPORT: 'Passeport',
};

export function FunnelChart({ formType, steps, totalStarted, totalCompleted, conversionRate }: FunnelChartProps) {
  const maxEntered = Math.max(...steps.map((s) => s.entered), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">
          {FORM_TYPE_LABELS[formType] || formType}
        </h4>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            {totalStarted} demarres
          </span>
          <span className="font-semibold text-blue-700">
            {conversionRate}% conversion
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {steps.map((step, i) => {
          const widthPercent = Math.max((step.entered / maxEntered) * 100, 2);
          const completedPercent = step.entered > 0 ? (step.completed / step.entered) * 100 : 0;

          return (
            <div key={step.stepIndex}>
              {/* Drop-off label */}
              {i > 0 && step.dropOffRate > 0 && (
                <div className="flex items-center gap-2 py-0.5 pl-2">
                  <svg className="w-3 h-3 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className="text-xs text-red-500 font-medium">
                    -{step.dropOffRate}% abandon
                  </span>
                </div>
              )}

              {/* Step bar */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 truncate flex-shrink-0" title={step.stepName}>
                  {step.stepName}
                </span>
                <div className="flex-1 bg-gray-100 rounded-sm h-6 relative overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-sm transition-all duration-300"
                    style={{ width: `${widthPercent}%`, opacity: 1 - (i * 0.12) }}
                  />
                  {/* Completed overlay */}
                  {completedPercent > 0 && completedPercent < 100 && (
                    <div
                      className="absolute top-0 left-0 h-full bg-green-500 rounded-sm opacity-30"
                      style={{ width: `${(step.completed / maxEntered) * 100}%` }}
                    />
                  )}
                </div>
                <span className="text-xs text-gray-600 w-12 text-right flex-shrink-0">
                  {step.entered}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>{totalCompleted} completes</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 bg-blue-500 rounded-sm inline-block" /> Entrees
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 bg-green-500 opacity-30 rounded-sm inline-block" /> Valides
          </span>
        </div>
      </div>
    </div>
  );
}
