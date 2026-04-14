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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions générales d&apos;utilisation et de vente</h1>
        <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : 2 avril 2026</p>

        <div className="space-y-10 text-sm text-gray-600 leading-relaxed">

          {/* PARTIE 1 — CGU */}
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900">Partie 1 — Conditions générales d&apos;utilisation</h2>
          </div>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 1 — Objet</h2>
            <p>
              Les présentes Conditions Générales d&apos;Utilisation et de Vente (ci-après « CGU/CGV »)
              ont pour objet de définir les modalités d&apos;accès et d&apos;utilisation du site
              franceguichet.fr (ci-après « le Site ») et des services proposés
              par FranceGuichet (ci-après « FranceGuichet » ou « le Prestataire »).
            </p>
            <p className="mt-2">
              FranceGuichet est le nom commercial de SAF Service B.V., société de droit néerlandais
              (Besloten Vennootschap), immatriculée au registre du commerce néerlandais (KVK) sous
              le numéro 99957493, RSIN 869203708, dont le siège social est situé au
              Herengracht 449A, 1017 BR Amsterdam, Pays-Bas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 2 — Définitions</h2>
            <ul className="space-y-2">
              <li><span className="font-medium text-gray-900">« Utilisateur » :</span> toute personne physique ou morale accédant au Site, qu&apos;elle dispose ou non d&apos;un compte.</li>
              <li><span className="font-medium text-gray-900">« Membre » :</span> tout Utilisateur ayant créé un compte sur le Site.</li>
              <li><span className="font-medium text-gray-900">« Abonné » :</span> tout Membre ayant souscrit un abonnement payant.</li>
              <li><span className="font-medium text-gray-900">« Démarche » :</span> toute procédure administrative réalisée par le Prestataire pour le compte du Membre.</li>
              <li><span className="font-medium text-gray-900">« Espace membre » :</span> interface personnelle accessible après connexion, permettant de gérer ses démarches, documents et services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 3 — Acceptation des conditions</h2>
            <p>
              L&apos;utilisation du Site et la création d&apos;un compte impliquent l&apos;acceptation pleine
              et entière des présentes CGU/CGV. L&apos;Utilisateur reconnaît en avoir pris connaissance
              et s&apos;engage à les respecter.
            </p>
            <p className="mt-2">
              FranceGuichet se réserve le droit de modifier les présentes conditions à tout moment.
              Les Membres seront informés par email de toute modification substantielle au moins
              30 jours avant son entrée en vigueur. La poursuite de l&apos;utilisation du Site après
              cette notification vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 4 — Description des services</h2>
            <p>FranceGuichet propose les services suivants :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>La réalisation de démarches administratives pour le compte du Membre (actes d&apos;état civil, carte grise, casier judiciaire, etc.)</li>
              <li>Le suivi en temps réel de l&apos;avancement des procédures</li>
              <li>La réception, le stockage et la mise à disposition sécurisée des documents obtenus</li>
              <li>Un espace citoyen regroupant les services publics de proximité (mairie, CPAM, bureau de poste, etc.)</li>
              <li>La comparaison des prix de carburants à proximité</li>
              <li>Un service de signalement citoyen (voirie, éclairage, propreté)</li>
              <li>Des fiches pratiques de vie citoyenne</li>
            </ul>
            <p className="mt-3">
              FranceGuichet agit en tant qu&apos;intermédiaire entre le Membre et les administrations
              compétentes. Les documents officiels sont délivrés exclusivement par lesdites
              administrations. FranceGuichet ne se substitue en aucun cas à un service public
              et ne garantit pas les délais de traitement des administrations.
            </p>
            <p className="mt-2">
              Certaines fonctionnalités de l&apos;espace citoyen (prix des carburants, informations
              sur les services publics) sont fournies à titre informatif et peuvent être sujettes
              à des mises à jour non instantanées. FranceGuichet ne saurait être tenu responsable
              d&apos;éventuelles inexactitudes dans ces données.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 5 — Inscription et compte utilisateur</h2>
            <p>
              L&apos;accès aux services nécessite la création d&apos;un compte. Le Membre s&apos;engage à :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Fournir des informations exactes, complètes et à jour lors de l&apos;inscription</li>
              <li>Mettre à jour ses informations en cas de changement</li>
              <li>Préserver la confidentialité de ses identifiants de connexion</li>
              <li>Informer immédiatement FranceGuichet en cas d&apos;utilisation non autorisée de son compte</li>
            </ul>
            <p className="mt-2">
              Chaque compte est strictement personnel. Le Membre est responsable de toute
              activité effectuée depuis son compte. FranceGuichet se réserve le droit de suspendre
              ou supprimer tout compte en cas de violation des présentes conditions, d&apos;utilisation
              frauduleuse ou de fourniture d&apos;informations inexactes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 6 — Obligations du Membre</h2>
            <p>Le Membre s&apos;engage à :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Utiliser le Site conformément à sa destination et aux présentes conditions</li>
              <li>Ne pas fournir d&apos;informations fausses ou trompeuses dans le cadre de ses démarches</li>
              <li>Ne pas utiliser le service de signalement citoyen de manière abusive ou malveillante</li>
              <li>Ne pas tenter de contourner les mesures de sécurité du Site</li>
              <li>Respecter les droits de propriété intellectuelle de FranceGuichet</li>
            </ul>
            <p className="mt-2">
              En cas de manquement à ces obligations, FranceGuichet pourra suspendre l&apos;accès
              au compte sans préavis et sans remboursement des sommes déjà versées.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 7 — Disponibilité du service</h2>
            <p>
              FranceGuichet s&apos;efforce d&apos;assurer l&apos;accessibilité du Site 24 heures sur 24,
              7 jours sur 7. Toutefois, l&apos;accès peut être temporairement interrompu pour des
              raisons de maintenance, de mise à jour ou en cas de force majeure.
            </p>
            <p className="mt-2">
              FranceGuichet ne garantit pas un fonctionnement ininterrompu du Site et ne saurait
              être tenu responsable des dommages résultant d&apos;une indisponibilité temporaire
              du service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 8 — Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des éléments du Site (textes, images, logos, interface, code source,
              base de données) est la propriété exclusive de FranceGuichet et est protégé
              par le droit de la propriété intellectuelle.
            </p>
            <p className="mt-2">
              Toute reproduction, représentation, modification ou exploitation non autorisée
              de tout ou partie du Site est strictement interdite et peut donner lieu à des
              poursuites judiciaires.
            </p>
          </section>

          {/* PARTIE 2 — CGV */}
          <div className="border-b border-gray-200 pb-4 pt-6">
            <h2 className="text-xl font-bold text-gray-900">Partie 2 — Conditions générales de vente</h2>
          </div>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 9 — Tarifs</h2>
            <p>Les services sont proposés selon deux formules :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><span className="font-medium text-gray-900">À la carte :</span> 29,90 EUR TTC par démarche</li>
              <li><span className="font-medium text-gray-900">Abonnement mensuel :</span> 9,90 EUR TTC par mois, incluant des démarches illimitées et l&apos;accès complet à l&apos;espace citoyen</li>
            </ul>
            <p className="mt-3">
              Les tarifs sont indiqués en euros, toutes taxes comprises (TVA incluse au taux
              applicable). FranceGuichet se réserve le droit de modifier ses tarifs à tout moment.
              Toute modification sera communiquée aux Abonnés au moins 30 jours avant son
              application. Les démarches en cours au moment de la modification restent au
              tarif initial.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 10 — Paiement</h2>
            <p>
              Le paiement s&apos;effectue en ligne par carte bancaire via un prestataire de
              paiement sécurisé. FranceGuichet ne stocke aucune donnée bancaire.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><span className="font-medium text-gray-900">À la carte :</span> le paiement est exigible au moment de la validation de la démarche</li>
              <li><span className="font-medium text-gray-900">Abonnement :</span> le paiement est prélevé automatiquement au début de chaque période mensuelle</li>
            </ul>
            <p className="mt-2">
              En cas d&apos;échec du paiement, FranceGuichet se réserve le droit de suspendre l&apos;accès
              aux services jusqu&apos;à régularisation. Une facture est mise à disposition dans
              l&apos;espace membre après chaque paiement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 11 — Droit de rétractation</h2>
            <p>
              Conformément aux articles L.221-18 et suivants du Code de la consommation français
              et à la Directive européenne 2011/83/UE, le Membre consommateur dispose d&apos;un délai
              de 14 jours à compter de la souscription pour exercer son droit de rétractation,
              sans avoir à justifier de motifs ni à payer de pénalité.
            </p>
            <p className="mt-2">
              <span className="font-medium text-gray-900">Exception :</span> conformément à l&apos;article L.221-28
              du Code de la consommation, le droit de rétractation ne peut être exercé pour les
              services pleinement exécutés avant la fin du délai de rétractation, lorsque
              l&apos;exécution a commencé avec l&apos;accord exprès du consommateur et la reconnaissance
              de la perte du droit de rétractation.
            </p>
            <p className="mt-2">
              Pour exercer ce droit, le Membre doit adresser sa demande via la page{' '}
              <Link href="/contact" className="text-[#1a2e5a] underline hover:no-underline">contact</Link>{' '}
              ou par courrier à l&apos;adresse du siège social. Le remboursement sera effectué dans
              un délai de 14 jours suivant la réception de la demande, via le même moyen de
              paiement que celui utilisé pour la transaction initiale.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 12 — Résiliation de l&apos;abonnement</h2>
            <p>
              L&apos;abonnement est sans engagement de durée. Le Membre peut résilier à tout moment :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Depuis son espace membre, rubrique « Mon abonnement »</li>
              <li>Via la page <Link href="/desabonnement" className="text-[#1a2e5a] underline hover:no-underline">désabonnement</Link></li>
              <li>En contactant le support via la page <Link href="/contact" className="text-[#1a2e5a] underline hover:no-underline">contact</Link></li>
            </ul>
            <p className="mt-2">
              La résiliation prend effet à la fin de la période mensuelle en cours. Le Membre
              conserve l&apos;accès à l&apos;ensemble des services jusqu&apos;à cette date. Aucun
              remboursement au prorata ne sera effectué pour la période en cours.
            </p>
            <p className="mt-2">
              Les documents stockés dans l&apos;espace membre restent accessibles pendant 30 jours
              après la fin de l&apos;abonnement. Passé ce délai, le Membre pourra demander la
              récupération de ses documents en contactant le support.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 13 — Exécution des démarches</h2>
            <p>
              Après validation et paiement d&apos;une démarche, FranceGuichet s&apos;engage à la transmettre
              à l&apos;administration compétente dans un délai de 48 heures ouvrées.
            </p>
            <p className="mt-2">
              Le Membre est informé de l&apos;avancement de sa démarche via son espace membre et
              par notifications email. Les délais de traitement dépendent exclusivement des
              administrations concernées et ne sont pas du ressort de FranceGuichet.
            </p>
            <p className="mt-2">
              En cas de rejet d&apos;une démarche par l&apos;administration pour motif non imputable
              au Membre (erreur de traitement de FranceGuichet), une nouvelle démarche sera
              effectuée gratuitement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 14 — Responsabilité</h2>
            <p>
              FranceGuichet s&apos;engage à exécuter ses obligations avec diligence et professionnalisme.
              Sa responsabilité se limite à une obligation de moyens.
            </p>
            <p className="mt-2">FranceGuichet ne saurait être tenu responsable :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Des retards ou refus émanant des administrations compétentes</li>
              <li>Des erreurs résultant d&apos;informations inexactes ou incomplètes fournies par le Membre</li>
              <li>Des dommages indirects (perte de chance, préjudice financier, etc.)</li>
              <li>Des interruptions de service dues à un cas de force majeure</li>
              <li>De l&apos;exactitude des informations fournies par des sources tierces (prix des carburants, horaires des services publics)</li>
            </ul>
            <p className="mt-2">
              En tout état de cause, la responsabilité de FranceGuichet est limitée au montant
              des sommes effectivement versées par le Membre au cours des 12 derniers mois.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 15 — Réclamations</h2>
            <p>
              Toute réclamation relative à l&apos;exécution d&apos;une démarche doit être adressée
              au service client via la page{' '}
              <Link href="/contact" className="text-[#1a2e5a] underline hover:no-underline">contact</Link>{' '}
              dans un délai de 30 jours suivant la réalisation de la prestation.
            </p>
            <p className="mt-2">
              FranceGuichet s&apos;engage à accuser réception de toute réclamation dans un délai de
              48 heures ouvrées et à apporter une réponse dans un délai de 15 jours ouvrés.
            </p>
          </section>

          {/* PARTIE 3 — DISPOSITIONS COMMUNES */}
          <div className="border-b border-gray-200 pb-4 pt-6">
            <h2 className="text-xl font-bold text-gray-900">Partie 3 — Dispositions communes</h2>
          </div>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 16 — Données personnelles</h2>
            <p>
              FranceGuichet collecte et traite des données personnelles dans le cadre de la
              fourniture de ses services, conformément au Règlement Général sur la Protection
              des Données (RGPD) et à la loi néerlandaise sur la protection des données (AVG).
            </p>
            <p className="mt-2">
              Les modalités de collecte, de traitement et de conservation des données personnelles
              sont détaillées dans notre{' '}
              <Link href="/politique-confidentialite" className="text-[#1a2e5a] underline hover:no-underline">
                politique de confidentialité
              </Link>, qui fait partie intégrante des présentes conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 17 — Médiation</h2>
            <p>
              En cas de litige non résolu par le service client, le Membre consommateur résidant
              dans l&apos;Union européenne peut recourir gratuitement à un médiateur de la consommation.
            </p>
            <p className="mt-2">
              Le Membre peut également utiliser la plateforme de règlement en ligne des litiges
              mise en place par la Commission européenne, accessible à l&apos;adresse :{' '}
              <span className="font-medium text-gray-900">ec.europa.eu/consumers/odr</span>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 18 — Droit applicable et juridiction</h2>
            <p>
              Les présentes CGU/CGV sont régies par le droit néerlandais.
            </p>
            <p className="mt-2">
              En cas de litige, les parties s&apos;efforceront de trouver une solution amiable.
              À défaut, les tribunaux d&apos;Amsterdam seront seuls compétents.
            </p>
            <p className="mt-2">
              <span className="font-medium text-gray-900">Protection du consommateur :</span> conformément
              au Règlement européen (CE) n°593/2008, les consommateurs résidant dans l&apos;Union
              européenne bénéficient en outre de la protection des dispositions impératives de
              la loi de leur pays de résidence. Rien dans les présentes conditions ne prive le
              consommateur de la protection que lui accordent ces dispositions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 19 — Nullité partielle</h2>
            <p>
              Si l&apos;une des clauses des présentes conditions venait à être déclarée nulle ou
              inapplicable, les autres clauses demeureraient en vigueur. La clause nulle serait
              remplacée par une clause valide se rapprochant le plus possible de l&apos;intention
              initiale des parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Article 20 — Contact</h2>
            <p>
              Pour toute question relative aux présentes conditions, contactez-nous :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Via la page <Link href="/contact" className="text-[#1a2e5a] underline hover:no-underline">contact</Link> du Site</li>
              <li>Par courrier : SAF Service B.V. (FranceGuichet), Herengracht 449A, 1017 BR Amsterdam, Pays-Bas</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
