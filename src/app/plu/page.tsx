"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import PluAddressForm from "@/components/plu/AddressForm";
import PluResults from "@/components/plu/PluResults";
import type { DocumentsResult, PluAnalysisResult } from "@/lib/plu/types";

type Phase =
  | { step: "idle" }
  | { step: "loading_docs" }
  | { step: "docs_ready"; docs: DocumentsResult; analysisType: string; projet: string }
  | { step: "loading_analysis"; docs: DocumentsResult }
  | { step: "done"; docs: DocumentsResult; analysis: PluAnalysisResult }
  | { step: "error"; message: string };

export default function PluPage() {
  const [phase, setPhase] = useState<Phase>({ step: "idle" });

  async function handleSubmit(params: { address: string; analysisType: string; projet: string }) {
    setPhase({ step: "loading_docs" });
    try {
      const docsRes = await fetch("/api/plu/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: params.address }),
      });
      if (!docsRes.ok) {
        const d = await docsRes.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? `Erreur ${docsRes.status}`);
      }
      const docs = await docsRes.json() as DocumentsResult;

      if (!docs.pluUrl) {
        setPhase({ step: "error", message: "Aucun règlement PLU trouvé pour cette adresse. La commune n'est peut-être pas encore couverte." });
        return;
      }

      setPhase({ step: "loading_analysis", docs });

      const analyzeRes = await fetch("/api/plu/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone: docs.zone,
          analysisType: params.analysisType,
          pluUrl: docs.pluUrl,
          planUrls: docs.planUrls,
          commune: docs.city,
          address: docs.address,
          projet: params.projet,
          smsData: docs.sms ? [{ libelle: "Secteur de mixité sociale" }] : [],
        }),
      });
      if (!analyzeRes.ok) {
        const d = await analyzeRes.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? `Erreur analyse ${analyzeRes.status}`);
      }
      const analysis = await analyzeRes.json() as PluAnalysisResult;
      setPhase({ step: "done", docs, analysis });
    } catch (err) {
      setPhase({ step: "error", message: err instanceof Error ? err.message : "Erreur inconnue" });
    }
  }

  const loading = phase.step === "loading_docs" || phase.step === "loading_analysis";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h1 className="text-lg font-bold text-gray-900 mb-1">Analyse PLU</h1>
          <p className="text-sm text-gray-500 mb-5">
            Faisabilité urbanistique automatisée à partir du règlement PLU officiel (GPU / Géoportail de l&apos;Urbanisme).
          </p>
          <PluAddressForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {phase.step === "loading_docs" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Recherche du PLU et de la zone…</p>
          </div>
        )}

        {phase.step === "loading_analysis" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">Analyse PLU en cours…</p>
              <p className="text-xs text-gray-400 mt-1">Téléchargement et analyse du règlement par IA — 30 à 90 s</p>
            </div>
            {phase.docs.zone && (
              <span className="bg-brand-50 text-brand-700 border border-brand-200 rounded-lg px-3 py-1 text-sm font-bold">
                Zone {phase.docs.zone}
              </span>
            )}
          </div>
        )}

        {phase.step === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-red-800 mb-1">Erreur</p>
            <p className="text-sm text-red-700">{phase.message}</p>
            <button
              onClick={() => setPhase({ step: "idle" })}
              className="mt-3 text-xs text-red-600 underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {phase.step === "done" && (
          <PluResults
            docsResult={phase.docs}
            analysisResult={phase.analysis}
            onReanalyze={() => setPhase({ step: "idle" })}
          />
        )}
      </div>
    </AppLayout>
  );
}
