// Page Contact publique (sans auth requise)

'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { contactSubjectValues, contactSubjectLabels } from '@/schemas/contact';

interface FilePreview {
  file: File;
  preview?: string;
}

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const validFiles = newFiles.filter(
      (f) => f.size <= 5 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(f.type)
    );

    setFiles((prev) => {
      const combined = [...prev, ...validFiles.map((f) => ({ file: f }))].slice(0, 3);
      return combined;
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const form = e.currentTarget;
    const formData = new FormData();

    formData.set('firstName', (form.elements.namedItem('firstName') as HTMLInputElement).value);
    formData.set('lastName', (form.elements.namedItem('lastName') as HTMLInputElement).value);
    formData.set('email', (form.elements.namedItem('email') as HTMLInputElement).value);
    formData.set('subject', (form.elements.namedItem('subject') as HTMLSelectElement).value);
    formData.set('processReference', (form.elements.namedItem('reference') as HTMLInputElement).value || '');
    formData.set('message', (form.elements.namedItem('message') as HTMLTextAreaElement).value);

    for (const { file } of files) {
      formData.append('files', file);
    }

    try {
      const res = await fetch('/api/contact', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      setSuccess(`Votre message a bien été envoyé ! Référence : ${data.reference}. Nous vous répondrons sous 48 heures.`);
      form.reset();
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo-franceguichet.png" alt="FranceGuichet" width={32} height={32} className="object-contain" />
              <span className="text-xl font-bold text-[#1a2e5a]">FranceGuichet</span>
            </Link>
            <div className="flex items-center gap-3">
              {session?.user ? (
                <Link href="/espace-membre" className="bg-[#1a2e5a] text-white px-5 py-2 rounded-lg hover:bg-[#243d73] font-medium text-sm transition-colors">
                  Mon espace
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                    Connexion
                  </Link>
                  <Link href="/register" className="bg-[#1a2e5a] text-white px-5 py-2 rounded-lg hover:bg-[#243d73] font-medium text-sm transition-colors">
                    Créer un compte
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contactez-nous</h1>
        <p className="text-gray-500 mb-10">Une question, un problème avec une démarche ou une suggestion ? Écrivez-nous.</p>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
                defaultValue={session?.user?.name?.split(' ').slice(1).join(' ') || ''}
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
                defaultValue={session?.user?.name?.split(' ')[0] || ''}
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
              defaultValue={session?.user?.email || ''}
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
              {contactSubjectValues.map((value) => (
                <option key={value} value={value}>
                  {contactSubjectLabels[value]}
                </option>
              ))}
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
              minLength={10}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent resize-none"
              placeholder="Décrivez votre demande..."
            />
          </div>

          {/* Upload fichiers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Pièces jointes <span className="text-gray-400 font-normal">(max 3 fichiers, 5 Mo chacun)</span>
            </label>
            <div className="space-y-2">
              {files.map((fp, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="text-sm text-gray-700 truncate flex-1">{fp.file.name}</span>
                  <span className="text-xs text-gray-400">{(fp.file.size / 1024).toFixed(0)} Ko</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {files.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                >
                  + Ajouter un fichier (JPEG, PNG, PDF)
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-[#1a2e5a] text-white px-8 py-3 rounded-xl hover:bg-[#243d73] font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
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
