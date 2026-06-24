"use client";
import { useState } from "react";
import type { PluSection } from "@/lib/plu/types";

function statusColor(statut: string) {
  if (statut === '✅') return 'bg-green-50 border-green-200';
  if (statut === '⚠️') return 'bg-amber-50 border-amber-200';
  if (statut === '❌') return 'bg-red-50 border-red-200';
  if (statut === '🗺️') return 'bg-blue-50 border-blue-200';
  return 'bg-gray-50 border-gray-200';
}

function statusBadge(statut: string, label: string) {
  const colors: Record<string, string> = {
    '✅': 'bg-green-100 text-green-800',
    '⚠️': 'bg-amber-100 text-amber-800',
    '❌': 'bg-red-100 text-red-800',
    '🗺️': 'bg-blue-100 text-blue-800',
    '❓': 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colors[statut] || 'bg-gray-100 text-gray-600'}`}>
      {statut} {label}
    </span>
  );
}

export default function RegulationCards({ sections }: { sections: PluSection[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {sections.map((sec, i) => (
        <div key={i} className={`border rounded-xl overflow-hidden ${statusColor(sec.statut)}`}>
          <button
            className="w-full text-left p-4 flex items-start justify-between gap-3"
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {statusBadge(sec.statut, sec.statut_label)}
                {sec.article && <span className="text-xs text-gray-500 font-mono">{sec.article}</span>}
                {sec.page && <span className="text-xs text-gray-400">p.{sec.page}</span>}
              </div>
              <p className="text-sm font-semibold text-gray-900">{sec.titre}</p>
              <p className="text-xs text-gray-600 mt-0.5">{sec.resume}</p>
            </div>
            <span className="text-gray-400 shrink-0 mt-0.5">{expanded === i ? '▲' : '▼'}</span>
          </button>
          {expanded === i && (
            <div className="px-4 pb-4 space-y-3 border-t border-inherit pt-3">
              {sec.regle_principale && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Règle principale</p>
                  <p className="text-sm text-gray-800">{sec.regle_principale}</p>
                </div>
              )}
              {sec.analyse_detaillee && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Analyse détaillée</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{sec.analyse_detaillee}</p>
                </div>
              )}
              {sec.citation && (
                <blockquote className="border-l-4 border-gray-300 pl-3 italic text-xs text-gray-600">
                  &ldquo;{sec.citation}&rdquo;
                </blockquote>
              )}
              {sec.points_vigilance?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Points de vigilance</p>
                  <ul className="space-y-1">
                    {sec.points_vigilance.map((pt, j) => (
                      <li key={j} className="text-xs text-amber-800 flex gap-2">
                        <span>⚠</span><span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sec.documents_a_consulter?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Documents à consulter</p>
                  <ul className="space-y-2">
                    {sec.documents_a_consulter.map((doc, j) => (
                      <li key={j} className="text-xs bg-white border border-gray-200 rounded-lg p-2">
                        <p className="font-semibold text-gray-800">{doc.nom_document || doc.reference}</p>
                        <p className="text-gray-500 mt-0.5">{doc.raison}</p>
                        {doc.url && (
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all mt-1 block">
                            Télécharger →
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sec.action_recommandee && (
                <div className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
                  <strong>Action :</strong> {sec.action_recommandee}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
