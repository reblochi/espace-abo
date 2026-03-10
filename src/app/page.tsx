// Page d'accueil SAF - Service d'Aide aux Formalites

import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Image src="/logo-saf.png" alt="SAF" width={32} height={32} className="object-contain" />
              <span className="text-xl font-bold text-[#1a2e5a]">SAF</span>
            </div>
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
                Creer un compte
              </Link>
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
                Simplifiez vos{' '}
                <span className="relative">
                  demarches
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-amber-200/60 -z-10 rounded" />
                </span>{' '}
                administratives
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Gerez vos procedures en ligne, suivez leur avancement et
                recevez vos documents directement dans votre espace personnel.
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
                  Decouvrir l&apos;offre
                </Link>
              </div>
              {/* Social proof */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['bg-blue-400', 'bg-green-400', 'bg-amber-400', 'bg-rose-400'].map((color, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-gray-900">+2 400 utilisateurs</span>
                  <span className="text-gray-500 ml-1">nous font confiance</span>
                </div>
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
                  <p className="text-sm font-semibold text-gray-900">Dossier valide</p>
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
          <p className="text-center text-sm text-gray-400 mb-6 uppercase tracking-wider font-medium">Nos demarches couvrent</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 text-gray-400">
            {[
              { label: 'Actes de naissance', icon: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z' },
              { label: 'Actes de mariage', icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
              { label: 'Actes de deces', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
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

      {/* Features Section */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#1a2e5a] uppercase tracking-wider mb-3">Fonctionnalites</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une plateforme complete pour gerer l&apos;ensemble de vos demarches
              administratives en toute serenite.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Demarches simplifiees',
                desc: 'Remplissez vos formulaires en quelques clics. Nos assistants vous guident a chaque etape du processus.',
                icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
                color: 'text-[#1a2e5a]',
                bg: 'bg-blue-50',
              },
              {
                title: 'Suivi en temps reel',
                desc: 'Suivez l\'avancement de vos procedures et recevez des notifications instantanees a chaque mise a jour.',
                icon: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
                color: 'text-amber-600',
                bg: 'bg-amber-50',
              },
              {
                title: 'Securise et confidentiel',
                desc: 'Vos donnees sont protegees par un chiffrement de bout en bout. Conformite RGPD garantie.',
                icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
                color: 'text-green-600',
                bg: 'bg-green-50',
              },
              {
                title: 'Rapide et efficace',
                desc: 'Reduisez le temps de traitement de vos dossiers de 80% grace a notre automatisation intelligente.',
                icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
                color: 'text-purple-600',
                bg: 'bg-purple-50',
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
                alt="Famille heureuse"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1a2e5a] uppercase tracking-wider mb-3">Comment ca marche</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                3 etapes simples pour vos demarches
              </h2>
              <div className="space-y-8">
                {[
                  { step: '01', title: 'Creez votre compte', desc: 'Inscription gratuite en moins de 2 minutes. Aucune carte bancaire requise.' },
                  { step: '02', title: 'Remplissez votre demarche', desc: 'Choisissez votre demarche et laissez-vous guider par notre formulaire intelligent.' },
                  { step: '03', title: 'Recevez vos documents', desc: 'Suivez l\'avancement en temps reel et recevez vos documents chez vous.' },
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

      {/* Pricing */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#1a2e5a] uppercase tracking-wider mb-3">Tarifs</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Un abonnement simple et transparent
            </h2>
            <p className="text-gray-600">
              Profitez de demarches illimitees, ou payez a l&apos;unite.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* A la carte */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">A la carte</h3>
              <p className="text-sm text-gray-500 mb-6">Pour une demarche ponctuelle</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">29,90€</span>
                <span className="text-gray-500 ml-1">/demarche</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Une demarche au choix', 'Suivi en temps reel', 'Support par email'].map((f) => (
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
                Faire une demarche
              </Link>
            </div>

            {/* Abonnement */}
            <div className="bg-[#1a2e5a] rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="bg-amber-400 text-[#1a2e5a] text-xs font-bold px-3 py-1 rounded-full">POPULAIRE</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Abonnement</h3>
              <p className="text-sm text-blue-200 mb-6">Demarches illimitees, sans engagement</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">9,90€</span>
                <span className="text-blue-200 ml-1">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Demarches illimitees', 'Suivi en temps reel', 'Support prioritaire', 'Sans engagement', 'Coffre-fort numerique'].map((f) => (
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

      {/* Testimonials / CTA */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="bg-gradient-to-br from-[#1a2e5a] to-[#2a4a8a] rounded-3xl p-10 md:p-16 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pret a simplifier vos demarches ?
            </h2>
            <p className="text-blue-200 mb-8 max-w-xl mx-auto">
              Rejoignez des milliers d&apos;utilisateurs qui font confiance a SAF pour gerer leurs formalites administratives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#1a2e5a] px-8 py-3.5 rounded-xl hover:bg-gray-100 font-semibold transition-colors"
              >
                Creer un compte gratuit
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

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo-saf.png" alt="SAF" width={28} height={28} className="object-contain" />
                <span className="text-lg font-bold text-[#1a2e5a]">SAF</span>
              </div>
              <p className="text-sm text-gray-500">
                Service d&apos;Aide aux Formalites. Simplifiez toutes vos demarches administratives.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Services</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/nouvelle-demarche/acte-naissance" className="hover:text-gray-700">Acte de naissance</Link></li>
                <li><Link href="/nouvelle-demarche/acte-mariage" className="hover:text-gray-700">Acte de mariage</Link></li>
                <li><Link href="/nouvelle-demarche/acte-deces" className="hover:text-gray-700">Acte de deces</Link></li>
                <li><Link href="/nouvelle-demarche/carte-grise" className="hover:text-gray-700">Carte grise</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Entreprise</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/abonnement" className="hover:text-gray-700">Tarifs</Link></li>
                <li><Link href="/contact" className="hover:text-gray-700">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-gray-700">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/conditions-generales" className="hover:text-gray-700">CGU</Link></li>
                <li><Link href="/politique-confidentialite" className="hover:text-gray-700">Confidentialite</Link></li>
                <li><Link href="/mentions-legales" className="hover:text-gray-700">Mentions legales</Link></li>
                <li><Link href="/desabonnement" className="hover:text-gray-700">Se desabonner</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8">
            <p className="text-center text-sm text-gray-400">
              &copy; {new Date().getFullYear()} SAF - Service d&apos;Aide aux Formalites. Tous droits reserves.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
