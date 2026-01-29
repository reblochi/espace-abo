// Composant Stats Dashboard

'use client';

import { Card, CardContent } from '@/components/ui';

interface Stat {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: string;
}

interface Props {
  stats: Stat[];
}

export function DashboardStats({ stats }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                {stat.change && (
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                )}
              </div>
              {stat.icon && (
                <div className="text-gray-400">{stat.icon}</div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
