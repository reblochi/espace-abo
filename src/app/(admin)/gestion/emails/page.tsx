// Admin - Gestion des templates email

'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

interface EmailTemplateSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  subject: string;
  variables: string[];
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const { data: templates, isLoading, refetch } = useQuery<EmailTemplateSummary[]>({
    queryKey: ['admin', 'email-templates'],
    queryFn: async () => {
      const res = await fetch('/api/gestion/email-templates');
      if (!res.ok) throw new Error('Erreur chargement');
      return res.json();
    },
  });

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch('/api/gestion/email-templates/seed', { method: 'POST' });
      const data = await res.json();
      const created = data.results?.filter((r: { action: string }) => r.action === 'created').length ?? 0;
      const skipped = data.results?.filter((r: { action: string }) => r.action === 'skipped').length ?? 0;
      setSeedResult(`${created} template(s) cree(s), ${skipped} deja existant(s)`);
      refetch();
    } catch {
      setSeedResult('Erreur lors du seed');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Templates email</h1>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          {seeding ? 'Initialisation...' : 'Initialiser les templates par defaut'}
        </button>
      </div>

      {seedResult && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-md">
          {seedResult}
        </div>
      )}

      {isLoading ? (
        <div className="text-gray-500">Chargement...</div>
      ) : !templates?.length ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500 mb-4">Aucun template email configure.</p>
          <p className="text-sm text-gray-400">
            Cliquez sur &quot;Initialiser les templates par defaut&quot; pour creer les 9 templates de base.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Template</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sujet</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Variables</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Modifie le</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => (
                <tr key={tpl.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{tpl.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{tpl.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                    {tpl.subject}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {tpl.variables.map((v) => (
                        <span
                          key={v}
                          className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(tpl.updatedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/gestion/emails/${tpl.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
