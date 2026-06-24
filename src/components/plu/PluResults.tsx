"use client";
import type { PluAnalysisResult, DocumentsResult } from "@/lib/plu/types";
import RegulationCards from "./RegulationCards";
import DocumentsList from "./DocumentsList";

type Props = {
  docsResult: DocumentsResult;
  analysisResult: PluAnalysisResult;
  onReanalyze?: () => void;
};

export default function PluResults({ docsResult, analysisResult, onReanalyze }: Props) {
  const { conclusion_operationnelle: conc } = analysisResult;
  const riskColor = (r: string) => {
    const l = (r || '').toLowerCase();
    if (l.includes('faible')) return 'text-green-700 bg-green-100';
    if (l.includes('élevé') || l.includes('fort')) return 'text-red-700 bg-red-100';
    return 'text-amber-700 bg-amber-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 mb-1">{docsResult.address}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg px-3 py-1 text-sm font-bold">
                Zone {docsResult.zone || '—'}
              </span>
              {docsResult.pluName && <span className="text-sm text-gray-600">{docsResult.pluName}</span>}
            </div>
          </div>
          {conc && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${riskColor(conc.niveau_risque)}`}>
              Risque {conc.niveau_risque}
            </span>
          )}
        </div>

        {/* Flags */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {docsResult.ppri && (
            <span className="text-xs bg-red-100 text-red-700 border border-red-200 rounded px-2 py-0.5 font-medium">⚠️ PPRI — Zone inondable</span>
          )}
          {docsResult.sms && (
            <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 rounded px-2 py-0.5 font-medium">🏘️ Secteur SMS</span>
          )}
          {docsResult.procedures?.length > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded px-2 py-0.5 font-medium">
              🔄 Procédure en cours : {docsResult.procedures.map(p => `${p.type}${p.statut ? ' ' + p.statut : ''}`).join(' ; ')}
            </span>
          )}
        </div>
      </div>

      {/* PDF too large warning */}
      {analysisResult.error_code === 'PDF_TROP_VOLUMINEUX' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-amber-800 mb-2">⚠️ Document trop volumineux ou non exploitable automatiquement, analyse partielle réalisée.</p>
          <p className="text-xs text-amber-700">{analysisResult.message}</p>
          {analysisResult.pluUrl && (
            <a href={analysisResult.pluUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 underline mt-2 block">
              Télécharger le règlement manuellement →
            </a>
          )}
        </div>
      )}

      {/* Conclusion */}
      {conc && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Conclusion opérationnelle</h2>
          {conc.synthese && <p className="text-sm text-gray-700 mb-4">{conc.synthese}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {conc.points_bloquants?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-700 mb-1.5">Points bloquants</p>
                <ul className="space-y-1">{conc.points_bloquants.map((pt, i) => <li key={i} className="text-xs text-red-800">• {pt}</li>)}</ul>
              </div>
            )}
            {conc.conditions?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1.5">Sous conditions</p>
                <ul className="space-y-1">{conc.conditions.map((pt, i) => <li key={i} className="text-xs text-amber-800">• {pt}</li>)}</ul>
              </div>
            )}
            {conc.opportunites?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-700 mb-1.5">Opportunités</p>
                <ul className="space-y-1">{conc.opportunites.map((pt, i) => <li key={i} className="text-xs text-green-800">• {pt}</li>)}</ul>
              </div>
            )}
            {conc.sujets_a_verifier?.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1.5">À vérifier</p>
                <ul className="space-y-1">{conc.sujets_a_verifier.map((pt, i) => <li key={i} className="text-xs text-blue-800">• {pt}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section cards */}
      {(analysisResult.sections?.length ?? 0) > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Analyse par thème</h2>
          <RegulationCards sections={analysisResult.sections!} />
        </div>
      )}

      {/* Documents */}
      {(docsResult.pluUrl || docsResult.planUrls?.length > 0) && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Documents PLU disponibles</h2>
          <DocumentsList pluUrl={docsResult.pluUrl} pluName={docsResult.pluName} planUrls={docsResult.planUrls} />
        </div>
      )}

      {onReanalyze && (
        <div className="flex justify-end">
          <button onClick={onReanalyze} className="text-sm text-brand-600 hover:text-brand-800 underline">
            Nouvelle analyse
          </button>
        </div>
      )}
    </div>
  );
}
