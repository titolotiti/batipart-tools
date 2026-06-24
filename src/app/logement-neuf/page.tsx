'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import NeufAddressForm from '@/components/logement-neuf/NeufAddressForm';
import NeufAnalysisResults from '@/components/logement-neuf/NeufAnalysisResults';
import CollectedProgramsSidebar from '@/components/logement-neuf/CollectedProgramsSidebar';
import type { NeufAnalysisInput, NeufAnalysisResult } from '@/lib/logement-neuf/types';

export default function LogementNeufPage() {
  const [result, setResult] = useState<NeufAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(input: NeufAnalysisInput) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/logement-neuf/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Erreur serveur (${res.status})`);
      }
      const data = (await res.json()) as NeufAnalysisResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!result) return;
    setExportLoading(true);
    try {
      const res = await fetch('/api/logement-neuf/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Erreur export (${res.status})`);
      }
      const blob = await res.blob();
      const city = result.geocodedAddress.city.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const date = new Date().toISOString().slice(0, 10);
      const filename = `seloger_neuf_${city}_${date}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'export");
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="lg:flex lg:gap-6 lg:items-start">
        <aside className="hidden lg:block w-[300px] shrink-0 sticky top-6 max-h-[calc(100vh-80px)] overflow-y-auto">
          <CollectedProgramsSidebar />
        </aside>

        <div className="flex-1 min-w-0 space-y-6">
          <div className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <strong className="text-blue-800">Comment ça marche :</strong> Saisissez une adresse pour
            rechercher les programmes immobiliers neufs sur SeLoger Neuf. Utilisez le bookmarklet pour
            collecter manuellement les programmes et les exporter en Excel.{' '}
            <a href="/logement-neuf/bookmarklet" className="text-blue-700 underline font-medium">
              Installer le bookmarklet →
            </a>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <NeufAddressForm onSubmit={handleAnalyze} loading={loading} />
          </div>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">Recherche des programmes neufs sur SeLoger Neuf…</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              <strong>Erreur :</strong> {error}
            </div>
          )}

          {result && !loading && (
            <NeufAnalysisResults
              result={result}
              onExport={handleExport}
              exportLoading={exportLoading}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
