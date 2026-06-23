import AppLayout from "@/components/AppLayout";

export default function ExportsPage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Exports</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            Ce module permettra de générer et télécharger vos rapports d&apos;analyse au format Excel ou PDF.
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 border border-amber-200">
          En cours de développement
        </span>
      </div>
    </AppLayout>
  );
}
