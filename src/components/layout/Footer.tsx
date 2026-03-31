// Footer global du site

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div>
            <h3 className="text-white font-semibold mb-3">France Guichet</h3>
            <p className="text-sm">
              Service d&apos;aide aux formalités administratives.
              Simplifiez vos démarches en ligne.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/nouvelle-demarche" className="hover:text-white transition-colors">Démarches</Link></li>
              <li><Link href="/abonnement" className="hover:text-white transition-colors">Abonnement</Link></li>
              <li><Link href="/desabonnement" className="hover:text-white transition-colors">Désabonnement</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link></li>
              <li><Link href="/conditions-generales" className="hover:text-white transition-colors">CGV</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:contact@franceguichet.fr" className="hover:text-white transition-colors">contact@franceguichet.fr</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} SAF Service B.V. — Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
