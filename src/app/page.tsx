// Page d'accueil FranceGuichet

import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image src="/logo-franceguichet.png" alt="FranceGuichet" width={200} height={48} className="object-contain" />
            </div>
            <div className="flex items-center gap-3">
              {session ? (
                <Link
                  href="/espace-membre"
                  className="bg-[#1a2e5a] text-white px-5 py-2 rounded-lg hover:bg-[#243d73] font-medium text-sm transition-colors"
                >
                  Mon espace
                </Link>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Split layout */}
      <section className="bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 bg-amber-400 rounded-full" />
                Nouveau : Carte grise en ligne
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-gray-900 leading-tight mb-6">
                Votre{' '}
                <span className="relative">
                  espace citoyen
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-amber-200/60 -z-10 rounded" />
                </span>{' '}
                tout-en-un
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Démarches administratives, services publics, prix des carburants,
                signalements... Tout ce dont vous avez besoin, au même endroit.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-[#1a2e5a] text-white px-7 py-3.5 rounded-xl hover:bg-[#243d73] font-medium text-base transition-colors"
                >
                  Commencer gratuitement
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/abonnement"
                  className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 px-7 py-3.5 rounded-xl hover:border-gray-300 hover:bg-gray-50 font-medium text-base transition-colors"
                >
                  Découvrir l&apos;offre
                </Link>
              </div>
              <div className="mt-4">
                <Link href="/desabonnement" className="text-sm text-gray-400 hover:text-gray-600 underline">
                  Déjà abonné ? Se désabonner
                </Link>
              </div>
            </div>

            {/* Right - Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/hero-documents.jpg"
                  alt="Documents administratifs"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e5a]/20 to-transparent" />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-4 -left-4 md:-left-8 bg-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 border border-gray-100">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Dossier validé</p>
                  <p className="text-xs text-gray-500">Il y a 2 minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos / Trust bar */}
      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-400 mb-6 uppercase tracking-wider font-medium">Nos démarches couvrent</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 text-gray-400">
            {[
              { label: 'Actes de naissance', icon: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z' },
              { label: 'Actes de mariage', icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
              { label: 'Actes de décès', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
              { label: 'Carte grise', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
              { label: 'Casier judiciaire', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
            ].map(({ label, icon }) => (
              <div key={label} className="flex items-center gap-2 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                </svg>
                <span className="text-sm font-medium whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Espace citoyen */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#1a2e5a] uppercase tracking-wider mb-3">Espace citoyen</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Bien plus que des démarches administratives
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Un véritable espace citoyen qui centralise vos services publics,
              vos informations locales et vos outils du quotidien.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Mes services publics',
                desc: 'Retrouvez votre mairie, CPAM, bureau de poste, trésorerie... avec adresses et horaires, géolocalisés autour de chez vous.',
                icon: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21',
                color: 'text-[#1a2e5a]',
                bg: 'bg-blue-50',
              },
              {
                title: 'Prix des carburants',
                desc: 'Comparez les prix des stations-service autour de vous et trouvez le carburant le moins cher en un coup d\'œil.',
                icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
                color: 'text-amber-600',
                bg: 'bg-amber-50',
              },
              {
                title: 'Signalement citoyen',
                desc: 'Signalez un problème dans votre quartier : voirie abîmée, éclairage en panne, propreté... directement à votre mairie.',
                icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
                color: 'text-rose-600',
                bg: 'bg-rose-50',
              },
              {
                title: 'Fiches vie citoyenne',
                desc: 'Guides pratiques pour chaque moment de vie : déménagement, naissance, retraite, renouvellement de papiers...',
                icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
                color: 'text-green-600',
                bg: 'bg-green-50',
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl p-6 hover:shadow-md transition-shadow border border-gray-100">
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-5`}>
                  <svg className={`w-6 h-6 ${feature.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-family.jpg"
                alt="Simplification des démarches administratives"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1a2e5a] uppercase tracking-wider mb-3">Comment ça marche</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                3 étapes simples pour vos démarches
              </h2>
              <div className="space-y-8">
                {[
                  { step: '01', title: 'Créez votre compte', desc: 'Inscription gratuite en moins de 2 minutes. Aucune carte bancaire requise.' },
                  { step: '02', title: 'Remplissez votre démarche', desc: 'Choisissez votre démarche et laissez-vous guider par notre formulaire intelligent.' },
                  { step: '03', title: 'Recevez vos documents', desc: 'Suivez l\'avancement en temps réel et recevez vos documents chez vous.' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#1a2e5a] text-white rounded-xl flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Aperçu espace membre */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[#1a2e5a] uppercase tracking-wider mb-3">Aperçu</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Un tableau de bord clair et complet
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Suivez vos démarches, consultez vos documents et accédez à tous vos services
              depuis un seul espace.
            </p>
          </div>
          <div className="relative max-w-5xl mx-auto">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/apercu-espace-membre.png"
                alt="Aperçu de l'espace membre FranceGuichet"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#1a2e5a] uppercase tracking-wider mb-3">Tarifs</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Un abonnement simple et transparent
            </h2>
            <p className="text-gray-600">
              Profitez de démarches illimitées, ou payez à l&apos;unité.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* À la carte */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">À la carte</h3>
              <p className="text-sm text-gray-500 mb-6">Pour une démarche ponctuelle</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">29,90€</span>
                <span className="text-gray-500 ml-1">/démarche</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Une démarche au choix', 'Suivi en temps réel', 'Support par email'].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/nouvelle-demarche"
                className="block w-full text-center border-2 border-gray-200 text-gray-700 py-3 rounded-xl hover:border-gray-300 hover:bg-gray-50 font-medium transition-colors"
              >
                Faire une démarche
              </Link>
            </div>

            {/* Abonnement */}
            <div className="bg-[#1a2e5a] rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="bg-amber-400 text-[#1a2e5a] text-xs font-bold px-3 py-1 rounded-full">POPULAIRE</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Abonnement</h3>
              <p className="text-sm text-blue-200 mb-6">Démarches illimitées, sans engagement</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">9,90€</span>
                <span className="text-blue-200 ml-1">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Démarches illimitées', 'Suivi en temps réel', 'Support prioritaire', 'Sans engagement', 'Coffre-fort numérique'].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-blue-100">
                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block w-full text-center bg-white text-[#1a2e5a] py-3 rounded-xl hover:bg-gray-100 font-semibold transition-colors"
              >
                S&apos;abonner maintenant
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="bg-gradient-to-br from-[#1a2e5a] to-[#2a4a8a] rounded-3xl p-10 md:p-16 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt à simplifier vos démarches ?
            </h2>
            <p className="text-blue-200 mb-8 max-w-xl mx-auto">
              Créez votre compte gratuitement et commencez vos démarches en quelques minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#1a2e5a] px-8 py-3.5 rounded-xl hover:bg-gray-100 font-semibold transition-colors"
              >
                Créer un compte gratuit
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/abonnement"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white px-8 py-3.5 rounded-xl hover:bg-white/10 font-medium transition-colors"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
