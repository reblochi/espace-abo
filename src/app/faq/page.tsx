import Link from 'next/link';
import Image from 'next/image';

const faqs = [
  {
    category: 'Général',
    questions: [
      {
        q: 'Qu\'est-ce que FranceGuichet ?',
        a: 'FranceGuichet est un espace citoyen en ligne qui vous permet de réaliser vos démarches administratives (actes d\'état civil, carte grise, casier judiciaire...), de retrouver vos services publics de proximité, de comparer les prix des carburants et de signaler des problèmes dans votre quartier.',
      },
      {
        q: 'FranceGuichet est-il un service public ?',
        a: 'Non. FranceGuichet est un service privé d\'aide aux démarches administratives. Nous agissons en tant qu\'intermédiaire entre vous et les administrations compétentes. Les documents officiels sont délivrés directement par les administrations.',
      },
      {
        q: 'Mes données sont-elles protégées ?',
        a: 'Oui. Vos données sont protégées par un chiffrement de bout en bout et nous respectons le RGPD. Consultez notre politique de confidentialité pour plus de détails.',
      },
    ],
  },
  {
    category: 'Démarches',
    questions: [
      {
        q: 'Quelles démarches puis-je effectuer ?',
        a: 'Vous pouvez demander des actes de naissance, de mariage, de décès, une carte grise, un extrait de casier judiciaire, et d\'autres démarches administratives courantes.',
      },
      {
        q: 'Combien de temps prend une démarche ?',
        a: 'FranceGuichet transmet votre demande à l\'administration compétente sous 48 heures ouvrées. Les délais de traitement dépendent ensuite de l\'administration concernée et varient généralement de quelques jours à plusieurs semaines.',
      },
      {
        q: 'Que se passe-t-il si ma démarche est refusée ?',
        a: 'Si le refus est dû à une erreur de notre part, nous relancons la démarche gratuitement. Si le refus provient de l\'administration pour un motif lié à votre dossier, nous vous en informons avec les détails pour corriger votre demande.',
      },
      {
        q: 'Comment suivre l\'avancement de ma démarche ?',
        a: 'Depuis votre espace membre, rubrique « Mes démarches ». Vous recevrez également des notifications par email à chaque mise à jour du statut.',
      },
    ],
  },
  {
    category: 'Abonnement et tarifs',
    questions: [
      {
        q: 'Quels sont les tarifs ?',
        a: 'Deux formules : à la carte à 29,90 € par démarche, ou l\'abonnement à 9,90 € par mois avec démarches illimitées et accès complet à l\'espace citoyen.',
      },
      {
        q: 'L\'abonnement est-il sans engagement ?',
        a: 'Oui, vous pouvez résilier à tout moment depuis votre espace membre ou via la page de désabonnement. La résiliation prend effet à la fin du mois en cours.',
      },
      {
        q: 'Comment payer ?',
        a: 'Le paiement se fait par carte bancaire via Stripe, notre prestataire de paiement sécurisé. Nous ne stockons aucune donnée bancaire.',
      },
      {
        q: 'Puis-je être remboursé ?',
        a: 'Vous disposez d\'un droit de rétractation de 14 jours après la souscription, sauf si la démarche a déjà été exécutée. Contactez-nous pour toute demande de remboursement.',
      },
    ],
  },
  {
    category: 'Espace citoyen',
    questions: [
      {
        q: 'Qu\'est-ce que l\'espace citoyen ?',
        a: 'C\'est votre tableau de bord personnel qui regroupe, en plus de vos démarches, vos services publics de proximité (mairie, CPAM, bureau de poste...), les prix des carburants autour de chez vous, un service de signalement citoyen et des fiches pratiques.',
      },
      {
        q: 'Comment fonctionne le signalement citoyen ?',
        a: 'Vous pouvez signaler un problème dans votre quartier (voirie abîmée, éclairage en panne, propreté...) directement depuis votre espace membre. Le signalement est transmis aux services compétents.',
      },
      {
        q: 'Les prix des carburants sont-ils à jour ?',
        a: 'Nous nous appuyons sur des sources de données officielles et mettons à jour les prix régulièrement. Un léger décalage peut exister avec les prix affichés en station.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo-saf.png" alt="FranceGuichet" width={32} height={32} className="object-contain" />
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Questions fréquentes</h1>
        <p className="text-gray-500 mb-12">Retrouvez les réponses aux questions les plus courantes sur nos services.</p>

        <div className="space-y-12">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-lg font-semibold text-[#1a2e5a] mb-5">{section.category}</h2>
              <div className="space-y-4">
                {section.questions.map((item) => (
                  <details key={item.q} className="group bg-gray-50 rounded-xl border border-gray-100">
                    <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-sm font-medium text-gray-900 select-none">
                      {item.q}
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Vous ne trouvez pas votre réponse ?</h3>
          <p className="text-sm text-gray-600 mb-4">Notre équipe est là pour vous aider.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[#1a2e5a] text-white px-6 py-2.5 rounded-xl hover:bg-[#243d73] font-medium text-sm transition-colors"
          >
            Nous contacter
          </Link>
        </div>
      </div>
    </div>
  );
}
