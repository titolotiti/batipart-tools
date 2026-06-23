import Link from "next/link";

interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  stats?: { label: string; value: string }[];
}

export default function DashboardCard({
  title,
  description,
  href,
  icon,
  badge,
  stats,
}: DashboardCardProps) {
  return (
    <Link href={href} className="card group flex flex-col gap-4 p-5 hover:border-brand-500/30 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-colors">
          {icon}
        </div>
        {badge && (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600">
            {badge}
          </span>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>

      {stats && stats.length > 0 && (
        <div className="flex gap-4 border-t border-slate-100 pt-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-lg font-semibold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 text-xs font-medium text-brand-500 mt-auto">
        Accéder
        <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
