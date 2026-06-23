import AppLayout from "@/components/AppLayout";
import DashboardCard from "@/components/DashboardCard";

const modules = [
  {
    title: "Analyse PLU",
    description: "Interrogez les Plans Locaux d'Urbanisme pour connaître les règles de constructibilité d'une parcelle.",
    href: "/plu",
    badge: "IA",
    stats: [
      { label: "Communes", value: "3 500+" },
      { label: "Règles", value: "200k+" },
    ],
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    title: "Analyse DVF",
    description: "Explorez les transactions foncières récentes (DVF/DV3F) pour évaluer le potentiel d'un terrain.",
    href: "/dvf",
    badge: "Open Data",
    stats: [
      { label: "Transactions", value: "5M+" },
      { label: "Années", value: "10" },
    ],
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Logement Neuf",
    description: "Analysez les programmes de logements neufs et identifiez les opportunités de promotion immobilière.",
    href: "/logement-neuf",
    badge: "Promoteur",
    stats: [
      { label: "Programmes", value: "12k+" },
      { label: "Lots", value: "80k+" },
    ],
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: "Exports",
    description: "Générez et téléchargez vos rapports d'analyse au format Excel ou PDF.",
    href: "/exports",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <AppLayout>
      {/* Welcome banner */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 p-6 text-white">
        <h2 className="text-lg font-semibold">Bienvenue sur Agent Immo Suite</h2>
        <p className="mt-1 text-sm text-white/80 max-w-xl">
          Plateforme d&apos;analyse immobilière pilotée par IA. Interrogez les PLU, analysez les transactions foncières et identifiez vos opportunités.
        </p>
        <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30 transition-colors">
          Démarrer une analyse
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {modules.map((mod) => (
          <DashboardCard key={mod.href} {...mod} />
        ))}
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Analyses ce mois", value: "—" },
          { label: "Communes couvertes", value: "—" },
          { label: "Rapports générés", value: "—" },
          { label: "Dernière mise à jour", value: "—" },
        ].map((stat) => (
          <div key={stat.label} className="card px-4 py-4">
            <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
