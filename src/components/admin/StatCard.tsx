// Carte statistique pour le dashboard admin

import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

const variantStyles = {
  default: 'border-gray-200',
  success: 'border-green-200 bg-green-50',
  warning: 'border-orange-200 bg-orange-50',
  destructive: 'border-red-200 bg-red-50',
};

const valueStyles = {
  default: 'text-gray-900',
  success: 'text-green-700',
  warning: 'text-orange-700',
  destructive: 'text-red-700',
};

export function StatCard({ label, value, sublabel, variant = 'default' }: StatCardProps) {
  return (
    <div className={cn('bg-white rounded-lg border p-4', variantStyles[variant])}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={cn('text-2xl font-semibold mt-1', valueStyles[variant])}>{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  );
}
