import Link from 'next/link';
import Image from 'next/image';

export default function ContactPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contactez-nous</h1>
        <p className="text-gray-500 mb-10">Une question, un problème avec une démarche ou une suggestion ? Écrivez-nous.</p>

        <form className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent"
                placeholder="Dupont"
              />
            </div>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent"
                placeholder="Marie"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent"
              placeholder="marie.dupont@email.com"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">Sujet</label>
            <select
              id="subject"
              name="subject"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent text-gray-900"
            >
              <option value="">Sélectionnez un sujet</option>
              <option value="demarche">Question sur une démarche</option>
              <option value="abonnement">Abonnement / Facturation</option>
              <option value="technique">Problème technique</option>
              <option value="signalement">Signalement citoyen</option>
              <option value="retractation">Droit de rétractation</option>
              <option value="donnees">Mes données personnelles</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1.5">
              Référence de démarche <span className="text-gray-400 font-normal">(facultatif)</span>
            </label>
            <input
              type="text"
              id="reference"
              name="reference"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent"
              placeholder="DEM-2026-000001"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
            <textarea
              id="message"
              name="message"
              rows={6}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent resize-none"
              placeholder="Décrivez votre demande..."
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-[#1a2e5a] text-white px-8 py-3 rounded-xl hover:bg-[#243d73] font-medium text-sm transition-colors"
          >
            Envoyer le message
          </button>
        </form>

        <div className="mt-14 grid sm:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[#1a2e5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Par email</h3>
            <p className="text-sm text-gray-500">Réponse sous 48 heures ouvrées</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[#1a2e5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Par courrier</h3>
            <p className="text-sm text-gray-500">FranceGuichet<br />Willem Fenengastraat 16 E<br />1096BN Amsterdam, Pays-Bas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
