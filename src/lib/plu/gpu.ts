import type { PlanUrl, Procedure } from "./types";

const H = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json, */*',
};

function normName(s: string) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-_']/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function resolveCurrentDoc(gridCode: string) {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const r = await fetch(`https://www.geoportail-urbanisme.gouv.fr/api/document?gridName=${gridCode}&status=document.production&limit=20`, {
      headers: H, signal: controller.signal
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const docs = await r.json() as Array<{ type?: string; uploadDate?: string; name?: string; id?: string; grid?: { title?: string } }>;
    const du = (Array.isArray(docs) ? docs : []).filter(d => /^(PLUi?|POS|PSMV)$/.test(d.type || ''));
    if (!du.length) return null;
    du.sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());
    const d = du[0];
    const m = (d.name || '').match(/^(\w+)_[A-Za-z]+_(\d{8})$/);
    if (!m || !d.id) return null;
    return { codgeo: m[1], date: m[2], hash: d.id, duType: d.type, title: d.grid?.title || '' };
  } catch { return null; }
}

export async function fetchGpuFiles(hash: string) {
  if (!hash) return null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 8000);
      const r = await fetch(`https://www.geoportail-urbanisme.gouv.fr/api/document/${hash}/files`, {
        headers: H, signal: controller.signal
      });
      clearTimeout(t);
      if (!r.ok) return null;
      const d = await r.json() as Array<{ name: string; title?: string; path?: string }>;
      return Array.isArray(d) && d.length ? d : null;
    } catch {
      if (attempt < 2) await new Promise(r => setTimeout(r, 400));
    }
  }
  return null;
}

export function plansFromGpuFiles(files: Array<{ name: string; title?: string; path?: string }>, base: string): Array<{ nom: string; url: string }> | null {
  const plans = files.filter(f => /graphique/i.test(f.name || ''));
  if (!plans.length) return null;
  const result = plans.map(f => {
    const n = f.name.match(/graphique_(\d+)/)?.[1];
    let title = (f.title || '').trim();
    if (/^(r[èe]glement|plan)?\s*graphique\s*\d*$/i.test(title) || /^\d+$/.test(title)) title = '';
    if (!title || /\.pdf$/i.test(title)) title = (f.path || '').trim();
    if (!title || /\.pdf$/i.test(title) || /^r[èe]glements?$/i.test(title)) title = '';
    if (!title) {
      const mid = f.name.replace(/^\d+_(reglement_)?graphique_?/i, '').replace(/_?\d{8}\.pdf$/i, '').replace(/\.pdf$/i, '').replace(/^\d+_?/, '').replace(/_/g, ' ').trim();
      if (mid && !/^\d*$/.test(mid)) title = mid;
    }
    const nom = title
      ? (n ? `Plan ${n} — ${title.slice(0, 90)}` : title.slice(0, 90))
      : `Plan graphique ${n || ''}`.trim();
    return { nom, url: `${base}/${f.name}`, n: parseInt(n || '999') };
  });
  result.sort((a, b) => a.n - b.n);
  return result.map(({ nom, url }) => ({ nom, url }));
}

export async function fetchTerritoryCommunes(codgeo: string): Promise<string[] | null> {
  if (!codgeo || codgeo.length <= 5) return null;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const r = await fetch(`https://www.geoportail-urbanisme.gouv.fr/api/grid/${codgeo}/children`, {
      headers: H, signal: controller.signal
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const d = await r.json() as Array<{ title?: string }>;
    return Array.isArray(d) ? d.map(g => g.title).filter((t): t is string => Boolean(t)) : null;
  } catch { return null; }
}

export function filterPlansByCommune(plans: PlanUrl[], communeName: string, allCommunes: string[]): PlanUrl[] {
  if (!communeName || !plans?.length || !allCommunes?.length) return plans;
  const cur = normName(communeName);
  if (!cur) return plans;
  const others = allCommunes.map(normName).filter(c => c && c !== cur);
  const mentionsCur = (p: PlanUrl) => {
    const nn = normName(p.title);
    if (!nn.includes(cur)) return false;
    return !others.some(o => o.includes(cur) && nn.includes(o));
  };
  const mentionsOther = (p: PlanUrl) => { const nn = normName(p.title); return others.some(o => nn.includes(o)); };
  if (!plans.some(mentionsCur)) return plans;
  return plans.filter(p => mentionsCur(p) || !mentionsOther(p));
}

export async function fetchProcedures(gridCode: string, docDate: string): Promise<Procedure[] | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const r = await fetch(`https://www.geoportail-urbanisme.gouv.fr/api/${gridCode}/procedures?limit=50`, {
      headers: H, signal: controller.signal
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const arr = await r.json() as Array<{ name?: string; procedureType?: string; procedureNumber?: string }>;
    if (!Array.isArray(arr) || !arr.length) return null;
    const TYPES: Record<string, string> = { E: 'élaboration', R: 'révision', RA: 'révision allégée', M: 'modification', MS: 'modification simplifiée', MEC: 'mise en compatibilité', MAJ: 'mise à jour' };
    const out: Procedure[] = [];
    for (const p of arr) {
      const m = (p.name || '').match(/_([A-Z]+?)(\d*)_(\d{8})$/);
      const tp = m ? m[1] : (p.procedureType || '');
      const num = m ? m[2] : (p.procedureNumber || '');
      const date = m ? m[3] : '';
      if (!date || (docDate && date <= docDate)) continue;
      out.push({
        id: p.name || '',
        type: TYPES[tp] || tp,
        statut: num ? `n°${num}` : '',
        dateApprobation: `${date.slice(6, 8)}/${date.slice(4, 6)}/${date.slice(0, 4)}`,
      });
    }
    return out.length ? out.slice(0, 5) : null;
  } catch { return null; }
}
