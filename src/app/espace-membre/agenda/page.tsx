// Page Agenda citoyen

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { showComingSoonToast } from '@/components/ui/coming-soon';

interface CalendarEvent {
  id: string;
  title: string;
  date: number; // jour du mois
  type: 'demarche' | 'expiration' | 'rdv' | 'general';
}

const eventColors = {
  demarche: 'bg-blue-500',
  expiration: 'bg-orange-500',
  rdv: 'bg-green-500',
  general: 'bg-gray-400',
};

const eventLabels = {
  demarche: 'Demarche',
  expiration: 'Expiration',
  rdv: 'Rendez-vous',
  general: 'General',
};

const mockEvents: CalendarEvent[] = [
  { id: '1', title: 'CNI expire dans 30j', date: 4, type: 'expiration' },
  { id: '2', title: 'Echeance impots', date: 15, type: 'general' },
  { id: '3', title: 'RDV mairie - Carte grise', date: 10, type: 'rdv' },
  { id: '4', title: 'Demarche acte de naissance', date: 7, type: 'demarche' },
  { id: '5', title: 'Prochaine election', date: 22, type: 'general' },
  { id: '6', title: 'Renouvellement passeport', date: 18, type: 'expiration' },
  { id: '7', title: 'Paiement abonnement', date: 1, type: 'general' },
];

const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function AgendaPage() {
  const now = new Date();
  const [currentMonth] = useState(now.getMonth());
  const [currentYear] = useState(now.getFullYear());
  const today = now.getDate();

  // Calculer les jours du mois
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  // Lundi = 0
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;

  const monthName = firstDay.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const getEventsForDay = (day: number) =>
    mockEvents.filter(e => e.date === day);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda citoyen</h1>
          <p className="text-gray-500 mt-1">
            Suivez vos échéances et rendez-vous importants
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => showComingSoonToast()}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Synchroniser
          </Button>
          <Button onClick={() => showComingSoonToast()}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Ajouter
          </Button>
        </div>
      </div>

      {/* Legende */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(eventColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs text-gray-600">{eventLabels[type as keyof typeof eventLabels]}</span>
          </div>
        ))}
      </div>

      {/* Calendrier */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center">
            <CardTitle className="capitalize">{monthName}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {daysOfWeek.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Grille du mois */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {/* Cellules vides avant le premier jour */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-gray-50 min-h-[80px] p-1" />
            ))}

            {/* Jours du mois */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today;
              const dayEvents = getEventsForDay(day);

              return (
                <div
                  key={day}
                  className={`bg-white min-h-[80px] p-1 ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(evt => (
                      <div
                        key={evt.id}
                        className={`${eventColors[evt.type]} text-white text-[9px] px-1 py-0.5 rounded truncate cursor-pointer`}
                        title={evt.title}
                        onClick={() => showComingSoonToast()}
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-gray-500 px-1">
                        +{dayEvents.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Cellules vides apres le dernier jour */}
            {Array.from({ length: (7 - ((startDayOfWeek + daysInMonth) % 7)) % 7 }).map((_, i) => (
              <div key={`end-${i}`} className="bg-gray-50 min-h-[80px] p-1" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evenements a venir */}
      <Card>
        <CardHeader>
          <CardTitle>Prochains evenements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockEvents
              .sort((a, b) => a.date - b.date)
              .map(evt => (
                <div key={evt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${eventColors[evt.type]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{evt.title}</p>
                    <p className="text-xs text-gray-500">{evt.date} {monthName}</p>
                  </div>
                  <Badge variant="secondary">{eventLabels[evt.type]}</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
