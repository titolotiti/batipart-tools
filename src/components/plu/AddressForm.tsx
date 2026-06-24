"use client";
import { useState } from "react";

type Props = {
  onSubmit: (params: { address: string; analysisType: string; projet: string }) => void;
  loading: boolean;
};

export default function PluAddressForm({ onSubmit, loading }: Props) {
  const [address, setAddress] = useState("");
  const [analysisType, setAnalysisType] = useState("destination");
  const [projet, setProjet] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    onSubmit({ address: address.trim(), analysisType, projet });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Adresse</label>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Ex: 45 rue de la Paix, Paris 75002"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Type d&apos;opération</label>
        <select
          value={analysisType}
          onChange={e => setAnalysisType(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="destination">Changement de destination (bureaux → logements)</option>
          <option value="surelevation">Surélévation (ajout d&apos;étages)</option>
          <option value="extension">Extension (agrandissement)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Description du projet <span className="font-normal text-gray-400">(optionnel)</span>
        </label>
        <textarea
          value={projet}
          onChange={e => setProjet(e.target.value)}
          rows={3}
          placeholder="Ex: Transformation d'un immeuble de bureaux de 800 m² en 8 logements, R+5..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !address.trim()}
        className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {loading ? "Analyse en cours…" : "Analyser le PLU"}
      </button>
    </form>
  );
}
