// Layout Espace Membre

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Tableau de bord', href: '/espace-membre' },
  { name: 'Mes demarches', href: '/espace-membre/mes-demarches' },
  { name: 'Mes documents', href: '/espace-membre/mes-documents' },
  { name: 'Mes factures', href: '/espace-membre/mes-factures' },
  { name: 'Mon abonnement', href: '/espace-membre/mon-abonnement' },
  { name: 'Mon profil', href: '/espace-membre/mon-profil' },
];

export function MemberLayout({ children }: Props) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                Espace Abo
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {user?.email}
              </span>
              <button
                onClick={() => logout()}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Deconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/espace-membre' && pathname.startsWith(item.href));

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'block px-4 py-2 rounded-md text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
