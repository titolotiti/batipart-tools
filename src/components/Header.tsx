"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "Vue d'ensemble de vos analyses immobilières" },
  "/plu": { title: "Analyse PLU", description: "Plan Local d'Urbanisme — Règles de constructibilité" },
  "/dvf": { title: "Analyse DVF", description: "Demandes de Valeurs Foncières — Transactions immobilières" },
  "/logement-neuf": { title: "Logement Neuf", description: "Programmes neufs et opportunités de promotion" },
  "/exports": { title: "Exports", description: "Téléchargement de rapports et données" },
};

export default function Header() {
  const pathname = usePathname();
  const page = pageTitles[pathname] ?? { title: "ImmoSuite", description: "" };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6">
      <div>
        <h1 className="text-base font-semibold text-slate-900">{page.title}</h1>
        {page.description && (
          <p className="text-xs text-slate-500 mt-0.5">{page.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-secondary text-xs">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Paramètres
        </button>
        <div className="h-8 w-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-semibold">
          AI
        </div>
      </div>
    </header>
  );
}
