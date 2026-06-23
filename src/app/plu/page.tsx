import AppLayout from "@/components/AppLayout";

export default function PluPage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Analyse PLU</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            Ce module permettra d&apos;interroger les Plans Locaux d&apos;Urbanisme par adresse ou parcelle cadastrale.
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 border border-amber-200">
          En cours de développement
        </span>
      </div>
    </AppLayout>
  );
}
