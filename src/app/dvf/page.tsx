import AppLayout from "@/components/AppLayout";

export default function DvfPage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Analyse DVF</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            Ce module permettra d&apos;explorer les Demandes de Valeurs Foncières pour analyser les transactions immobilières récentes.
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 border border-amber-200">
          En cours de développement
        </span>
      </div>
    </AppLayout>
  );
}
