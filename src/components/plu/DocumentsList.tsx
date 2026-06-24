"use client";
import type { PlanUrl } from "@/lib/plu/types";

type Props = {
  pluUrl: string | null;
  pluName: string | null;
  planUrls: PlanUrl[];
};

export default function DocumentsList({ pluUrl, pluName, planUrls }: Props) {
  return (
    <div className="space-y-2">
      {pluUrl && (
        <a
          href={pluUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 underline break-all"
        >
          <span>📄</span>
          <span>{pluName || "Règlement écrit"}</span>
        </a>
      )}
      {planUrls.map((plan, i) => (
        <a
          key={i}
          href={plan.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 underline break-all"
        >
          <span>🗺️</span>
          <span>{plan.title}</span>
        </a>
      ))}
      {!pluUrl && planUrls.length === 0 && (
        <p className="text-sm text-gray-500 italic">Aucun document trouvé.</p>
      )}
    </div>
  );
}
