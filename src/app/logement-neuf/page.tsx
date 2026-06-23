import AppLayout from "@/components/AppLayout";

export default function LogementNeufPage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Logement Neuf</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            Ce module permettra d&apos;analyser les programmes de logements neufs et d&apos;identifier les opportunités de promotion immobilière.
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 border border-amber-200">
          En cours de développement
        </span>
      </div>
    </AppLayout>
  );
}
