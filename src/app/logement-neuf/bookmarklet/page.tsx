'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';

export default function BookmarkletPage() {
  const [href, setHref] = useState<string>('#');
  const [collectUrl, setCollectUrl] = useState<string>('');
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const origin = window.location.origin;
    const url = origin + '/api/logement-neuf/favorite';
    setCollectUrl(url);

    const bookmarklet = `javascript:(()=>{const s=document.createElement("script");s.src="${origin}/api/logement-neuf/bookmarklet?v="+Date.now();document.body.appendChild(s);})();`;
    setHref(bookmarklet);
    setReady(true);
  }, []);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(collectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        {/* CTA drag */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm space-y-5">
          <div className="text-4xl">⭐</div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Glissez ce bouton dans votre barre de favoris
            </h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Depuis une page programme SeLoger Neuf, cliquez dessus pour envoyer automatiquement
              les données dans votre collecteur.
            </p>
          </div>

          {!ready ? (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
              Chargement…
            </div>
          ) : href === '#' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              Impossible de charger le bookmarklet. Rechargez la page.
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <a
                href={href}
                draggable
                onClick={(e) => {
                  e.preventDefault();
                  alert(
                    'Glissez ce bouton vers votre barre de favoris.\n\n' +
                    'Si elle n\'est pas visible : Ctrl+Maj+B (Chrome / Edge).'
                  );
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow cursor-grab active:cursor-grabbing select-none transition-colors"
              >
                ★ SeLoger Neuf → Collecteur
              </a>
              <p className="text-xs text-slate-400">
                Maintenez et glissez vers la barre de favoris Chrome
              </p>
            </div>
          )}
        </div>

        {/* Étapes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
          <h2 className="font-bold text-slate-900 text-sm mb-5">Comment utiliser</h2>
          <ol className="space-y-5">
            {[
              {
                n: 1,
                title: 'Installez le bookmarklet',
                desc: 'Glissez le bouton ⭐ ci-dessus vers votre barre de favoris Chrome. Raccourci pour afficher la barre : Ctrl+Maj+B.',
              },
              {
                n: 2,
                title: 'Ouvrez une page programme SeLoger Neuf',
                desc: 'Naviguez jusqu\'à la page détail d\'un programme sur selogerneuf.com.',
              },
              {
                n: 3,
                title: 'Cliquez sur le bookmarklet',
                desc: 'Un overlay apparaît, puis le programme est ajouté au volet Collecteur de la page principale.',
              },
              {
                n: 4,
                title: 'Répétez',
                desc: 'Cliquez le bookmarklet sur autant de pages que nécessaire.',
              },
              {
                n: 5,
                title: 'Exportez l\'Excel',
                desc: 'Retournez sur la page Logement Neuf : le volet de gauche affiche les programmes collectés et permet l\'export Excel.',
              },
            ].map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {s.n}
                </span>
                <div>
                  <p className="font-semibold text-sm text-slate-900">{s.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Infos techniques */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm">Informations techniques</h2>
          <div className="space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-slate-700">URL de collecte :</span>
              <code className="bg-white border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-700 break-all">
                {collectUrl || '—'}
              </code>
              {collectUrl && (
                <button
                  onClick={copyUrl}
                  className="text-blue-600 hover:text-blue-700 font-medium shrink-0"
                >
                  {copied ? '✓ Copié' : 'Copier'}
                </button>
              )}
            </div>
            <p>
              Données envoyées via formulaire POST et stockées dans le{' '}
              <code className="bg-white border border-slate-200 px-1 rounded font-mono">
                localStorage
              </code>{' '}
              du navigateur. Aucune base de données, aucun tiers.
            </p>
            <p>
              Compatible Chrome, Edge, Firefox. Fonctionne uniquement sur{' '}
              <code className="bg-white border border-slate-200 px-1 rounded font-mono">
                selogerneuf.com
              </code>
              .
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
