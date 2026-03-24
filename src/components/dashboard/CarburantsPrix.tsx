// Composant affichant les prix des carburants proches du client

'use client';

import { useState } from 'react';
import { useCarburants } from '@/hooks/useCarburants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

const FUEL_COLORS: Record<string, string> = {
  gazole: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  sp95: 'bg-green-100 text-green-700 border-green-200',
  sp98: 'bg-blue-100 text-blue-700 border-blue-200',
  e10: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  e85: 'bg-purple-100 text-purple-700 border-purple-200',
  gplc: 'bg-orange-100 text-orange-700 border-orange-200',
};

function formatPrix(prix: number): string {
  return prix.toFixed(3).replace('.', ',') + ' €';
}

export function CarburantsPrix() {
  const { data, isLoading, error } = useCarburants();
  const [selectedFuel, setSelectedFuel] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Essence la moins chere</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.stations?.length) {
    return null;
  }

  const { meilleursPrix, stations } = data;
  const availableFuels = Object.keys(meilleursPrix);

  // Stations filtrees par carburant selectionne
  const displayStations = selectedFuel
    ? stations.filter((s) => s.carburants.some((c) => c.type === selectedFuel))
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Essence la moins chere</CardTitle>
          <span className="text-xs text-gray-400">{data.codePostal}</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Meilleurs prix par type */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {availableFuels.map((fuel) => {
            const best = meilleursPrix[fuel];
            const isSelected = selectedFuel === fuel;
            const colorClass = FUEL_COLORS[fuel] || 'bg-gray-100 text-gray-700 border-gray-200';

            return (
              <button
                key={fuel}
                onClick={() => setSelectedFuel(isSelected ? null : fuel)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? `${colorClass} ring-2 ring-offset-1 ring-current`
                    : `${colorClass} hover:opacity-80`
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  {fuel.toUpperCase()}
                </p>
                <p className="text-lg font-bold mt-0.5">{formatPrix(best.prix)}</p>
                <p className="text-xs opacity-60 mt-0.5 leading-tight" title={`${best.adresse}, ${best.station}`}>
                  {best.adresse}, {best.station}
                </p>
              </button>
            );
          })}
        </div>

        {/* Detail des stations si un carburant est selectionne */}
        {selectedFuel && displayStations.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Stations avec {selectedFuel.toUpperCase()} :
            </p>
            {displayStations.slice(0, 5).map((station) => {
              const carb = station.carburants.find((c) => c.type === selectedFuel);
              if (!carb) return null;

              const isBest = carb.prix === meilleursPrix[selectedFuel]?.prix;

              return (
                <div
                  key={station.id}
                  className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                    isBest ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="font-medium text-gray-900 text-xs">
                      {station.adresse}, {station.cp} {station.ville}
                    </p>
                    {station.automate24h && (
                      <p className="text-xs text-blue-500">24h/24</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-bold ${isBest ? 'text-green-600' : 'text-gray-900'}`}>
                      {formatPrix(carb.prix)}
                    </span>
                    {isBest && (
                      <span className="block text-xs text-green-500">Moins cher</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!selectedFuel && (
          <p className="text-xs text-gray-400 text-center">
            Cliquez sur un carburant pour voir le detail des stations
          </p>
        )}
      </CardContent>
    </Card>
  );
}
