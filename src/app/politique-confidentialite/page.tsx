import Link from 'next/link';
import Image from 'next/image';

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo-franceguichet.png" alt="FranceGuichet" width={32} height={32} className="object-contain" />
              <span className="text-xl font-bold text-[#1a2e5a]">FranceGuichet</span>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : 3 mars 2026</p>

        <div className="space-y-10 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des données personnelles est FranceGuichet,
              dont le siège social est situé au Willem Fenengastraat 16 E, 1096BN Amsterdam, Pays-Bas.
              Numéro RSIN : 869203708.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Données collectées</h2>
            <p>Dans le cadre de nos services, nous collectons les données suivantes :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><span className="font-medium text-gray-900">Données d&apos;identification :</span> nom, prénom, date de naissance, adresse email</li>
              <li><span className="font-medium text-gray-900">Données de contact :</span> adresse postale, numéro de téléphone</li>
              <li><span className="font-medium text-gray-900">Données de démarches :</span> informations nécessaires à la réalisation des procédures administratives</li>
              <li><span className="font-medium text-gray-900">Données de paiement :</span> traitées par notre prestataire de paiement sécurisé</li>
              <li><span className="font-medium text-gray-900">Données de connexion :</span> adresse IP, navigateur, pages consultées</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Finalités du traitement</h2>
            <p>Vos données sont collectées pour :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>La création et la gestion de votre compte utilisateur</li>
              <li>La réalisation des démarches administratives demandées</li>
              <li>La gestion des paiements et de la facturation</li>
              <li>L&apos;envoi de notifications liées à vos démarches en cours</li>
              <li>L&apos;amélioration de nos services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Base légale</h2>
            <p>Le traitement de vos données repose sur :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><span className="font-medium text-gray-900">L&apos;exécution du contrat :</span> pour la fourniture des services souscrits</li>
              <li><span className="font-medium text-gray-900">L&apos;obligation légale :</span> pour la conservation des données de facturation</li>
              <li><span className="font-medium text-gray-900">L&apos;intérêt légitime :</span> pour l&apos;amélioration de nos services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Durée de conservation</h2>
            <p>
              Les données personnelles sont conservées pendant la durée de votre compte,
              puis supprimées dans un délai de 12 mois après la clôture du compte.
              Les données de facturation sont conservées 10 ans conformément aux obligations légales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Partage des données</h2>
            <p>Vos données peuvent être transmises à :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Les administrations compétentes dans le cadre de vos démarches</li>
              <li>Notre prestataire de paiement pour le traitement des transactions</li>
              <li>Notre hébergeur (Vercel Inc.) pour le fonctionnement technique du site</li>
            </ul>
            <p className="mt-2">
              Vos données ne sont jamais vendues à des tiers. Elles ne sont pas utilisées
              à des fins de prospection commerciale.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Transferts hors UE</h2>
            <p>
              Certaines données peuvent être transférées vers les États-Unis (hébergement Vercel).
              Ces transferts sont encadrés par des garanties appropriées conformément au RGPD.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><span className="font-medium text-gray-900">Droit d&apos;accès :</span> obtenir une copie de vos données</li>
              <li><span className="font-medium text-gray-900">Droit de rectification :</span> corriger des données inexactes</li>
              <li><span className="font-medium text-gray-900">Droit de suppression :</span> demander l&apos;effacement de vos données</li>
              <li><span className="font-medium text-gray-900">Droit à la portabilité :</span> recevoir vos données dans un format structuré</li>
              <li><span className="font-medium text-gray-900">Droit d&apos;opposition :</span> vous opposer au traitement de vos données</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits, contactez-nous via la page{' '}
              <Link href="/contact" className="text-[#1a2e5a] underline hover:no-underline">contact</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Cookies</h2>
            <p>
              Le site utilise des cookies strictement nécessaires au fonctionnement du service
              (authentification, préférences). Aucun cookie publicitaire ou de suivi tiers
              n&apos;est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Autorité de contrôle</h2>
            <p>
              Si vous estimez que le traitement de vos données n&apos;est pas conforme, vous pouvez
              introduire une réclamation auprès de l&apos;Autoriteit Persoonsgegevens (autorité
              néerlandaise de protection des données) ou de la CNIL si vous résidez en France.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
