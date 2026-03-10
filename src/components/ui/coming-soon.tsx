// Composant ComingSoon - Badge, Overlay et Toast pour fonctionnalites a venir

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Badge "Prochainement"
export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-violet-100 text-violet-700',
        className
      )}
    >
      Prochainement
    </span>
  );
}

// Toast notification
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

function showComingSoonToast() {
  // Remove existing toast
  const existing = document.getElementById('coming-soon-toast');
  if (existing) existing.remove();
  if (toastTimeout) clearTimeout(toastTimeout);

  const toast = document.createElement('div');
  toast.id = 'coming-soon-toast';
  toast.className =
    'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-violet-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-slide-up';
  toast.innerHTML = `
    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    Cette fonctionnalite sera disponible prochainement !
  `;
  document.body.appendChild(toast);

  toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 300ms';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Wrapper button qui affiche le toast au clic
export function ComingSoonButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn('relative', className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        showComingSoonToast();
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// Overlay qui grise le contenu
export function ComingSoonOverlay({
  children,
  className,
  label = 'Prochainement',
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn('relative cursor-pointer', className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        showComingSoonToast();
      }}
    >
      <div className="opacity-50 pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="bg-violet-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
          {label}
        </span>
      </div>
    </div>
  );
}

// Section inline Coming Soon
export function ComingSoonSection({
  title,
  description,
  icon,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 bg-violet-50 border border-violet-200 rounded-lg',
        className
      )}
    >
      {icon && <div className="text-violet-500 flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-violet-900">{title}</p>
        {description && (
          <p className="text-sm text-violet-600 mt-0.5">{description}</p>
        )}
      </div>
      <ComingSoonBadge />
    </div>
  );
}

export { showComingSoonToast };
