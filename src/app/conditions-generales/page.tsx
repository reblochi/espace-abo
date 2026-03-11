import Link from 'next/link';
import Image from 'next/image';

export default function ConditionsGeneralesPage() {
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
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                Connexion
              </Link>
              <Link href="/register" className="bg-[#1a2e5a] text-white px-5 py-2 rounded-lg hover:bg-[#243d73] font-medium text-sm transition-colors">
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions générales d&apos;utilisation</h1>
        <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : 3 mars 2026</p>

        <div className="space-y-10 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Objet</h2>
            <p>
              Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation
              du site saf-service.com, édité par SAF Service B.V., société immatriculée aux Pays-Bas
              sous le numéro RSIN 869203708, dont le siège social est situé à Amsterdam.
            </p>
            <p className="mt-2">
              Le site propose un service d&apos;aide aux démarches administratives en ligne, notamment
              les demandes d&apos;actes d&apos;état civil, de carte grise et de casier judiciaire.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Acceptation des conditions</h2>
            <p>
              L&apos;utilisation du site implique l&apos;acceptation pleine et entière des présentes CGU.
              Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Description des services</h2>
            <p>SAF Service propose :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>La réalisation de démarches administratives pour le compte de l&apos;utilisateur</li>
              <li>Le suivi en temps réel de l&apos;avancement des procédures</li>
              <li>La réception et le stockage sécurisé des documents obtenus</li>
            </ul>
            <p className="mt-2">
              SAF Service agit en tant qu&apos;intermédiaire. Les documents officiels sont délivrés
              par les administrations compétentes. SAF Service ne garantit pas les délais
              de traitement des administrations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Inscription et compte utilisateur</h2>
            <p>
              L&apos;accès aux services nécessite la création d&apos;un compte. L&apos;utilisateur s&apos;engage
              à fournir des informations exactes et à jour. Il est responsable de la
              confidentialité de ses identifiants de connexion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Tarifs et paiement</h2>
            <p>Les services sont proposés selon deux formules :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><span className="font-medium text-gray-900">À la carte :</span> 29,90 EUR par démarche</li>
              <li><span className="font-medium text-gray-900">Abonnement :</span> 9,90 EUR par mois, démarches illimitées, sans engagement</li>
            </ul>
            <p className="mt-2">
              Les prix sont indiqués en euros TTC. Le paiement est exigible au moment de la
              commande ou au début de chaque période d&apos;abonnement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Droit de rétractation</h2>
            <p>
              Conformément à la législation européenne, l&apos;utilisateur dispose d&apos;un délai de 14 jours
              à compter de la souscription pour exercer son droit de rétractation, sauf si l&apos;exécution
              du service a été pleinement achevée avant la fin de ce délai avec l&apos;accord de l&apos;utilisateur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Résiliation de l&apos;abonnement</h2>
            <p>
              L&apos;abonnement est sans engagement. L&apos;utilisateur peut résilier à tout moment depuis
              son espace personnel ou via la page{' '}
              <Link href="/desabonnement" className="text-[#1a2e5a] underline hover:no-underline">désabonnement</Link>.
              La résiliation prend effet à la fin de la période en cours.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Responsabilité</h2>
            <p>
              SAF Service s&apos;engage à traiter les démarches avec diligence. Toutefois, SAF Service
              ne saurait être tenu responsable des retards ou refus émanant des administrations,
              ni des erreurs résultant d&apos;informations inexactes fournies par l&apos;utilisateur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Données personnelles</h2>
            <p>
              Le traitement des données personnelles est décrit dans notre{' '}
              <Link href="/politique-confidentialite" className="text-[#1a2e5a] underline hover:no-underline">
                politique de confidentialité
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Droit applicable</h2>
            <p>
              Les présentes CGU sont soumises au droit néerlandais. En cas de litige,
              les tribunaux d&apos;Amsterdam seront compétents, sans préjudice des droits
              des consommateurs résidant dans l&apos;Union européenne.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU, contactez-nous via
              la page <Link href="/contact" className="text-[#1a2e5a] underline hover:no-underline">contact</Link>.
            </p>
          </section>
        </div>
      </div>

      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} SAF - Service d&apos;Aide aux Formalités. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
