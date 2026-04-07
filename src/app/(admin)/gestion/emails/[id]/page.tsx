// Admin - Edition d'un template email avec editeur WYSIWYG

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';

type EditorMode = 'design' | 'code' | 'preview';

interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  subject: string;
  html: string;
  variables: string[];
  updatedAt: string;
}

export default function EditEmailTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<EditorMode>('design');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeRef = useRef<HTMLTextAreaElement>(null);

  const { data: template, isLoading } = useQuery<EmailTemplate>({
    queryKey: ['admin', 'email-template', id],
    queryFn: async () => {
      const res = await fetch(`/api/gestion/email-templates/${id}`);
      if (!res.ok) throw new Error('Erreur chargement');
      return res.json();
    },
  });

  // Init values when template loads
  useEffect(() => {
    if (template && !initialized) {
      setSubject(template.subject);
      setHtml(template.html);
      setInitialized(true);
    }
  }, [template, initialized]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/gestion/email-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html }),
      });
      if (!res.ok) throw new Error('Erreur sauvegarde');
      return res.json();
    },
    onSuccess: () => {
      setSaved(true);
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-template', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-templates'] });
      setTimeout(() => setSaved(false), 3000);
    },
  });

  // Setup editable iframe for design mode
  const setupDesignIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();
    doc.designMode = 'on';

    // Listen for changes
    doc.addEventListener('input', () => {
      // Read the full HTML from the iframe
      const newHtml = doc.documentElement.outerHTML;
      // Wrap back in doctype
      setHtml('<!DOCTYPE html>\n' + newHtml);
      setDirty(true);
    });
  }, [html]);

  // Sync from design iframe before switching away
  const syncFromDesign = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    const newHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    setHtml(newHtml);
  }, []);

  // Switch modes
  const switchMode = useCallback(
    (newMode: EditorMode) => {
      if (mode === 'design') {
        syncFromDesign();
      }
      setMode(newMode);
    },
    [mode, syncFromDesign]
  );

  // Load iframe content when entering design mode
  useEffect(() => {
    if (mode === 'design') {
      // Small delay to ensure iframe is mounted
      const timer = setTimeout(() => setupDesignIframe(), 50);
      return () => clearTimeout(timer);
    }
  }, [mode, setupDesignIframe]);

  const execCommand = (command: string, value?: string) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.execCommand(command, false, value);
    // Sync changes
    const newHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    setHtml(newHtml);
    setDirty(true);
  };

  const insertVariable = (variable: string) => {
    if (mode === 'design') {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const doc = iframe.contentDocument;
      if (!doc) return;
      doc.execCommand('insertText', false, `{{${variable}}}`);
      const newHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      setHtml(newHtml);
      setDirty(true);
    } else if (mode === 'code' && codeRef.current) {
      const textarea = codeRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = `{{${variable}}}`;
      const newHtml = html.substring(0, start) + text + html.substring(end);
      setHtml(newHtml);
      setDirty(true);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
      }, 0);
    }
  };

  if (isLoading) {
    return <div className="text-gray-500">Chargement...</div>;
  }

  if (!template) {
    return <div className="text-red-500">Template non trouve</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/gestion/emails"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{template.name}</h1>
            <span className="text-xs text-gray-400 font-mono">{template.slug}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-600">Sauvegarde !</span>
          )}
          {dirty && !saved && (
            <span className="text-xs text-amber-600">Modifications non sauvegardees</span>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !dirty}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Subject */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Sujet de l&apos;email</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setDirty(true);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Sujet de l'email..."
        />
        <p className="mt-1 text-xs text-gray-400">
          Variables disponibles : {template.variables.map((v) => `{{${v}}}`).join(', ')}
        </p>
      </div>

      {/* Mode tabs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-4">
          <div className="flex">
            {([
              { key: 'design', label: 'Design' },
              { key: 'code', label: 'Code HTML' },
              { key: 'preview', label: 'Apercu' },
            ] as { key: EditorMode; label: string }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => switchMode(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  mode === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Insert variable dropdown */}
          {mode !== 'preview' && (
            <div className="relative group">
              <button className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">
                Inserer une variable
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10 min-w-[180px] hidden group-hover:block">
                {template.variables.map((v) => (
                  <button
                    key={v}
                    onClick={() => insertVariable(v)}
                    className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 font-mono"
                  >
                    {'{{'}
                    {v}
                    {'}}'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* WYSIWYG Toolbar */}
        {mode === 'design' && (
          <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-gray-200 bg-gray-50">
            <ToolbarButton onClick={() => execCommand('bold')} title="Gras">
              <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand('italic')} title="Italique">
              <em>I</em>
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand('underline')} title="Souligne">
              <span className="underline">U</span>
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton onClick={() => execCommand('justifyLeft')} title="Aligner a gauche">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h9.5a.75.75 0 010 1.5h-9.5A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand('justifyCenter')} title="Centrer">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm3 5A.75.75 0 015.75 9h8.5a.75.75 0 010 1.5h-8.5A.75.75 0 015 9.75zm-3 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton onClick={() => execCommand('formatBlock', 'h1')} title="Titre 1">
              H1
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand('formatBlock', 'h2')} title="Titre 2">
              H2
            </ToolbarButton>
            <ToolbarButton onClick={() => execCommand('formatBlock', 'p')} title="Paragraphe">
              P
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Liste a puces">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 4a1 1 0 011-1h.01a1 1 0 010 2H3a1 1 0 01-1-1zm4 0a1 1 0 011-1h10a1 1 0 110 2H7a1 1 0 01-1-1zm-4 6a1 1 0 011-1h.01a1 1 0 110 2H3a1 1 0 01-1-1zm4 0a1 1 0 011-1h10a1 1 0 110 2H7a1 1 0 01-1-1zm-4 6a1 1 0 011-1h.01a1 1 0 110 2H3a1 1 0 01-1-1zm4 0a1 1 0 011-1h10a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                const url = prompt('URL du lien:');
                if (url) execCommand('createLink', url);
              }}
              title="Lien"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton onClick={() => execCommand('removeFormat')} title="Supprimer le formatage">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </ToolbarButton>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs text-gray-500">Couleur:</label>
              <input
                type="color"
                defaultValue="#1e293b"
                onChange={(e) => execCommand('foreColor', e.target.value)}
                className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                title="Couleur du texte"
              />
              <input
                type="color"
                defaultValue="#ffffff"
                onChange={(e) => execCommand('hiliteColor', e.target.value)}
                className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                title="Couleur de fond"
              />
            </div>
          </div>
        )}

        {/* Editor area */}
        <div className="min-h-[500px]">
          {mode === 'design' && (
            <iframe
              ref={iframeRef}
              className="w-full border-0"
              style={{ minHeight: '500px', height: '600px' }}
              title="Editeur email"
            />
          )}

          {mode === 'code' && (
            <textarea
              ref={codeRef}
              value={html}
              onChange={(e) => {
                setHtml(e.target.value);
                setDirty(true);
              }}
              className="w-full min-h-[500px] p-4 font-mono text-sm text-gray-800 bg-gray-50 border-0 resize-none focus:outline-none"
              style={{ height: '600px' }}
              spellCheck={false}
            />
          )}

          {mode === 'preview' && (
            <div className="p-6 bg-gray-100 min-h-[500px]">
              <div className="max-w-[640px] mx-auto">
                <div className="mb-3 text-xs text-gray-500">
                  <strong>Sujet:</strong>{' '}
                  {subject.replace(/\{\{(\w+)\}\}/g, (_, v) => getPreviewValue(v))}
                </div>
                <div className="bg-white rounded shadow-sm overflow-hidden">
                  <iframe
                    srcDoc={html.replace(/\{\{(\w+)\}\}/g, (_, v) => getPreviewValue(v))}
                    className="w-full border-0"
                    style={{ minHeight: '500px', height: '600px' }}
                    title="Apercu email"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <div className="mt-4 text-sm text-gray-500">
          {template.description}
        </div>
      )}
    </div>
  );
}

// Toolbar components
function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded transition-colors text-sm"
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-gray-300 mx-1" />;
}

// Preview sample values
function getPreviewValue(variable: string): string {
  const samples: Record<string, string> = {
    firstName: 'Jean',
    lastName: 'Dupont',
    reference: 'SUB-2026-000001',
    amount: '9,90 EUR',
    nextBillingDate: '07/05/2026',
    endDate: '07/05/2026',
    invoiceUrl: '#',
    pdfUrl: '#',
    resetUrl: '#',
    unsubscribeUrl: '#',
    siteUrl: 'https://franceguichet.fr',
    number: 'FAC-2026-000001',
    type: 'Acte de naissance',
    isFromSubscription: 'true',
  };
  return samples[variable] ?? `[${variable}]`;
}
