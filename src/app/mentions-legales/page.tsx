import Link from 'next/link';
import Image from 'next/image';

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo-saf.png" alt="SAF" width={32} height={32} className="object-contain" />
              <span className="text-xl font-bold text-[#1a2e5a]">SAF</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="bg-[#1a2e5a] text-white px-5 py-2 rounded-lg hover:bg-[#243d73] font-medium text-sm transition-colors"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mentions légales</h1>

        <div className="space-y-10 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Éditeur du site</h2>
            <div className="bg-gray-50 rounded-xl p-6 space-y-2">
              <p><span className="font-medium text-gray-900">Raison sociale :</span> SAF Service B.V.</p>
              <p><span className="font-medium text-gray-900">Forme juridique :</span> Besloten Vennootschap (société à responsabilité limitée)</p>
              <p><span className="font-medium text-gray-900">Numéro d&apos;immatriculation (RSIN) :</span> 869203708</p>
              <p><span className="font-medium text-gray-900">Numéro d&apos;établissement :</span> 000064994767</p>
              <p><span className="font-medium text-gray-900">Siège social :</span> Amsterdam, Pays-Bas</p>
              <p><span className="font-medium text-gray-900">Adresse :</span> Herengracht 449A, 1017 BR Amsterdam</p>
              <p><span className="font-medium text-gray-900">Date de création :</span> 3 mars 2026</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activités</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Programmation informatique (SBI 62100)</li>
              <li>Conseil en informatique et gestion d&apos;installations informatiques (SBI 62200)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hébergement</h2>
            <p>
              Le site est hébergé par Vercel Inc., 440 N Baxter St, Coppell, TX 75019, États-Unis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble du contenu de ce site (textes, images, logos, éléments graphiques) est la propriété
              de SAF Service B.V. ou de ses partenaires. Toute reproduction, même partielle, est interdite
              sans autorisation préalable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Données personnelles</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
              d&apos;un droit d&apos;accès, de rectification et de suppression de vos données personnelles.
              Pour exercer ces droits, contactez-nous via la page{' '}
              <Link href="/contact" className="text-[#1a2e5a] underline hover:no-underline">contact</Link>.
            </p>
          </section>
        </div>
      </div>

    </div>
  );
}
