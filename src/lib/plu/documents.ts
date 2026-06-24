import { geocodeAddress } from "./geocode";
import { resolveCurrentDoc, fetchGpuFiles, plansFromGpuFiles, fetchTerritoryCommunes, filterPlansByCommune, fetchProcedures } from "./gpu";
import type { DocumentsResult, PlanUrl, Procedure } from "./types";

const H = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json, */*',
};

function fmtDate(url: string | null) {
  const m = url?.match(/_(\d{8})\.pdf$/i);
  if (!m) return '';
  const d = m[1];
  return ` — ${d.slice(6)}/${d.slice(4,6)}/${d.slice(0,4)}`;
}

async function buildUrlsFromDocProps(props: Record<string, unknown>): Promise<{ pluUrl?: string; pluName?: string; planUrls?: PlanUrl[] }> {
  const hash = props.id as string || props.gpu_doc_id as string;
  const name = props.name as string;
  const codgeo = props.grid_name as string || (name?.match(/^(\d+)_/)?.[1]);
  const date = name?.match(/(\d{8})$/)?.[1];
  if (!hash || !codgeo || !date) return {};
  const base = `https://data.geopf.fr/annexes/gpu/documents/DU_${codgeo}/${hash}`;
  const gridTitle = props.grid_title as string || '';
  const duType = props.du_type as string || 'PLU';

  const gpuFiles = await fetchGpuFiles(hash);
  const gpuPlans = gpuFiles ? plansFromGpuFiles(gpuFiles, base) : null;
  if (gpuPlans?.length) {
    return {
      pluUrl: `${base}/${codgeo}_reglement_${date}.pdf`,
      planUrls: gpuPlans.map(p => ({ title: p.nom, url: p.url })),
      pluName: `${duType} ${gridTitle}`.trim() + fmtDate(`${base}/${codgeo}_reglement_${date}.pdf`),
    };
  }

  const planUrls: PlanUrl[] = [];
  for (let batch = 0; batch < 4; batch++) {
    const ns = [batch*3+1, batch*3+2, batch*3+3].filter(n => n <= 10);
    const batchResults = await Promise.all(ns.map(async n => {
      const url = `${base}/${codgeo}_reglement_graphique_${n}_${date}.pdf`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const r = await fetch(url, { method: 'HEAD', headers: H, signal: controller.signal });
        clearTimeout(timeout);
        return r.ok ? { title: `Plan graphique ${n} — ${gridTitle || codgeo}`, url } : null;
      } catch { return null; }
    }));
    planUrls.push(...batchResults.filter((p): p is PlanUrl => p !== null));
    if (batch < 3) await new Promise(r => setTimeout(r, 300));
  }

  return {
    pluUrl: `${base}/${codgeo}_reglement_${date}.pdf`,
    planUrls,
    pluName: `${duType} ${gridTitle}`.trim() + fmtDate(`${base}/${codgeo}_reglement_${date}.pdf`),
  };
}

const GPSO: [string, string] = ['https://data.geopf.fr/annexes/gpu/documents/DU_200057974/da0d24dad863b8b32a2323bc49cd389e/200057974_reglement_20251202.pdf', 'PLUi Grand Paris Seine Ouest — 02/12/2025'];
const BNS: [string, string] = ['https://data.geopf.fr/annexes/gpu/documents/DU_200057990/35b89739df91562887f9e4623801ace5/200057990_reglement_20260217.pdf', 'PLUi Boucle Nord de Seine — 17/02/2026'];
const PC: [string, string] = ['https://data.geopf.fr/annexes/gpu/documents/DU_200057867/9ac270d37a778fa1bed02998270ab1b3/200057867_reglement_20251216.pdf', 'PLUi Plaine Commune — 16/12/2025'];
const EE: [string, string] = ['https://data.geopf.fr/annexes/gpu/documents/DU_200057875/b57af8c53d37c5c6308bbf07bdb1db87/200057875_reglement_20250624.pdf', 'PLUi Est Ensemble — 24/06/2025'];
const VS: [string, string] = ['https://data.geopf.fr/annexes/gpu/documents/DU_200057966/7062c937f56c7f4103879338ed3e6499/200057966_reglement_20250430.pdf', 'PLUi Vallée Sud Grand Paris — 30/04/2025'];

const DB: Record<string, [string, string]> = {
  '75056': ['https://data.geopf.fr/annexes/gpu/documents/DU_75056/29b89f23c2ea085d0ea7706d42254ce2/75056_reglement_20251219.pdf', 'PLU Paris bioclimatique — 16-19/12/2025'],
  '92012': GPSO, '92022': GPSO, '92040': GPSO, '92047': GPSO, '92048': GPSO, '92072': GPSO, '92075': GPSO, '92077': GPSO,
  '92004': BNS, '92009': BNS, '92024': BNS, '92025': BNS, '92036': BNS, '92078': BNS, '95018': BNS,
  '93001': PC, '93027': PC, '93031': PC, '93039': PC, '93059': PC, '93066': PC, '93070': PC, '93072': PC, '93079': PC,
  '93006': EE, '93008': EE, '93010': EE, '93045': EE, '93048': EE, '93053': EE, '93055': EE, '93061': EE, '93063': EE,
  '92002': VS, '92007': VS, '92014': VS, '92019': VS, '92020': VS, '92023': VS, '92032': VS, '92046': VS, '92049': VS, '92060': VS, '92071': VS,
  '92051': ['https://data.geopf.fr/annexes/gpu/documents/DU_92051/e6c8855ff88ca1b7823c688132f2d6f1/92051_reglement_20210629.pdf', 'PLU Neuilly-sur-Seine — 29/06/2021'],
  '92073': ['https://www.suresnes.fr/wp-content/uploads/2024/07/4.1-Reglement-PLU-Suresnes-Modification-26-06-2024-V2.pdf', 'PLU Suresnes — 26/06/2024'],
  '94037': ['https://www.ville-gentilly.fr/sites/default/files/modification_ndeg6_du_plu_-_reglement_ecrit.pdf', 'PLU Gentilly — 12/03/2024'],
};

export async function getPluDocuments(address: string): Promise<DocumentsResult> {
  const geo = await geocodeAddress(address);
  let { citycode } = geo;
  const { lat, lon, city, label } = geo;

  if (citycode.startsWith('751')) citycode = '75056';
  if (citycode.startsWith('692')) citycode = '69123';
  if (citycode.startsWith('132')) citycode = '13055';

  const geomStr = JSON.stringify({ type: 'Point', coordinates: [lon, lat] });

  // Zone PLU
  let zone = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const zR = await fetch(`https://apicarto.ign.fr/api/gpu/zone-urba?geom=${encodeURIComponent(geomStr)}`, { headers: H });
      const zD = await zR.json() as { features?: Array<{ properties: { libelle?: string; libelong?: string; typezone?: string } }> };
      if (zD.features?.length) {
        const p = zD.features[0].properties;
        let z = (p.libelle || p.libelong || p.typezone || '').trim().replace(/\s+/g, '');
        if (/([A-Za-z])\1{2,}/.test(z)) z = z.replace(/([A-Za-z])\1{2,}/g, '$1');
        if (z.length > 10) z = z.slice(0, 10);
        zone = z;
        if (zone) break;
      }
      if (!zone && attempt < 3) await new Promise(r => setTimeout(r, 500));
    } catch { /* continue */ }
  }

  let pluUrl: string | null = null;
  let pluName: string | null = null;
  let planUrls: PlanUrl[] = [];
  let partition: string | null = null;

  // Source A: APICarto document
  try {
    const dR = await fetch(`https://apicarto.ign.fr/api/gpu/document?geom=${encodeURIComponent(geomStr)}`, { headers: H });
    const dD = await dR.json() as { features?: Array<{ properties: Record<string, unknown> }> };
    if (dD.features?.length) {
      for (const feat of dD.features) {
        const props = feat.properties;
        const nm = ((props.name as string) || '').toLowerCase();
        if (nm.includes('graphique') || nm.includes('zonage')) {
          const h = props.id as string || props.gpu_doc_id as string;
          const cg = props.grid_name as string || (props.name as string)?.match(/^(\d+)_/)?.[1];
          const dt = (props.name as string)?.match(/(\d{8})$/)?.[1];
          if (h && cg && dt) {
            const planUrl = `https://data.geopf.fr/annexes/gpu/documents/DU_${cg}/${h}/${props.name as string}.pdf`;
            const n = (props.name as string)?.match(/graphique_(\d+)/)?.[1] || String(planUrls.length + 1);
            planUrls.push({ title: `Plan graphique ${n}`, url: planUrl });
          }
          continue;
        }
      }

      const mainProps = dD.features.find(f => {
        const nm = ((f.properties?.name as string) || '').toLowerCase();
        return !nm.includes('graphique') && !nm.includes('zonage');
      })?.properties || dD.features[0].properties;

      partition = (mainProps.name as string) || (mainProps.partition as string) || null;
      const urls = await buildUrlsFromDocProps(mainProps);
      if (urls.pluUrl) {
        pluUrl = urls.pluUrl;
        pluName = urls.pluName || null;
        const headPlans = urls.planUrls || [];
        const byUrl = new Map(planUrls.map(p => [p.url, p]));
        for (const p of headPlans) {
          const existing = byUrl.get(p.url);
          if (existing) {
            if (!/^Plan graphique\b/.test(p.title)) existing.title = p.title;
          } else { planUrls.push(p); byUrl.set(p.url, p); }
        }
      }
    }
  } catch { /* ignore */ }

  // Source B: WFS partition
  if (!pluUrl && partition) {
    try {
      const wfsUrl = `https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=wfs_du:doc_urba&OUTPUTFORMAT=application/json&COUNT=10&CQL_FILTER=partition='${encodeURIComponent(partition)}'`;
      const wR = await fetch(wfsUrl, { headers: H });
      const wD = await wR.json() as { features?: Array<{ properties: Record<string, unknown> }> };
      if (wD.features?.length) {
        const docs = wD.features.map(f => f.properties);
        const u = (d: Record<string, unknown>) => String(d.href || d.url || d.download || '');
        const reg = docs.find(d => u(d).match(/reglement(?!.*graphique).*\.pdf$/i))
                 || docs.find(d => u(d).endsWith('.pdf') && !u(d).match(/graphique|rapport|padd/i));
        if (reg) { pluUrl = u(reg); pluName = String(reg.libelle || 'Règlement PLU') + fmtDate(pluUrl); }
      }
    } catch { /* ignore */ }
  }

  // Source B2: WFS codcom
  if (!pluUrl) {
    try {
      const wfsUrl = `https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=wfs_du:doc_urba&OUTPUTFORMAT=application/json&COUNT=10&CQL_FILTER=codcom='${citycode}'&sortBy=datval+D`;
      const wR = await fetch(wfsUrl, { headers: H });
      const wD = await wR.json() as { features?: Array<{ properties: Record<string, unknown> }> };
      if (wD.features?.length) {
        const docs = wD.features.map(f => f.properties);
        const u = (d: Record<string, unknown>) => String(d.href || d.url || d.download || '');
        const reg = docs.find(d => u(d).match(/reglement(?!.*graphique).*\.pdf$/i))
                 || docs.find(d => u(d).endsWith('.pdf') && !u(d).match(/graphique|rapport|padd/i));
        if (reg) { pluUrl = u(reg); pluName = String(reg.libelle || 'Règlement PLU') + fmtDate(pluUrl); }
      }
    } catch { /* ignore */ }
  }

  // Source C: DB fallback
  if (!pluUrl) {
    const entry = DB[citycode];
    if (entry) {
      let [dbUrl, dbName] = entry;
      const grid = dbUrl.match(/DU_(\w+)\//)?.[1];
      if (grid) {
        const cur = await resolveCurrentDoc(grid);
        if (cur) {
          dbUrl = `https://data.geopf.fr/annexes/gpu/documents/DU_${cur.codgeo}/${cur.hash}/${cur.codgeo}_reglement_${cur.date}.pdf`;
          dbName = `${cur.duType} ${cur.title}`.trim() + ` — màj ${cur.date.slice(6,8)}/${cur.date.slice(4,6)}/${cur.date.slice(0,4)}`;
        }
      }
      pluUrl = dbUrl; pluName = dbName;
    }
  }

  // Detect plan graphiques if none yet
  if (planUrls.length === 0 && pluUrl) {
    const urlMatch = pluUrl.match(/DU_([^/]+)\/([^/]+)\/([^/]+)_(\d{8})\.pdf/);
    if (urlMatch) {
      const [, du, hash, , date2] = urlMatch;
      const base2 = `https://data.geopf.fr/annexes/gpu/documents/DU_${du}/${hash}`;
      const gpuFiles2 = await fetchGpuFiles(hash);
      const gpuPlans2 = gpuFiles2 ? plansFromGpuFiles(gpuFiles2, base2) : null;
      if (gpuPlans2?.length) {
        planUrls = gpuPlans2.map(p => ({ title: p.nom, url: p.url }));
      } else {
        for (let batch = 0; batch < 4; batch++) {
          const ns = [batch*3+1, batch*3+2, batch*3+3].filter(n => n <= 10);
          const batchResults = await Promise.all(ns.map(async n => {
            const url = `${base2}/${du}_reglement_graphique_${n}_${date2}.pdf`;
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 5000);
              const r = await fetch(url, { method: 'HEAD', headers: H, signal: controller.signal });
              clearTimeout(timeout);
              return r.ok ? { title: `Plan graphique ${n}`, url } : null;
            } catch { return null; }
          }));
          planUrls.push(...batchResults.filter((p): p is PlanUrl => p !== null));
          if (batch < 3) await new Promise(r => setTimeout(r, 300));
        }
      }
    }
  }

  // Filter plans by commune (PLUi)
  const duCode = (pluUrl || '').match(/DU_(\d+)\//)?.[1];
  let territoryCommunes: string[] | null = null;
  if (planUrls.length > 1 && duCode) {
    territoryCommunes = await fetchTerritoryCommunes(duCode);
    if (territoryCommunes?.length) planUrls = filterPlansByCommune(planUrls, city, territoryCommunes);
  }

  // Single unnamed plan → rename
  if (planUrls.length === 1 && /^Plan graphique\b/.test(planUrls[0].title || '')) {
    planUrls[0].title = 'Règlement graphique (plan de zonage)';
  }

  // Procedures
  let procedures: Procedure[] = [];
  const pm = (pluUrl || '').match(/DU_(\w+)\/[^/]+\/\w+?_reglement[^/]*_(\d{8})\.pdf/);
  if (pm) {
    const procs = await fetchProcedures(pm[1], pm[2]);
    if (procs) procedures = procs;
  }

  // PPRI
  let ppri = false;
  try {
    const geoR = await fetch(
      `https://georisques.gouv.fr/api/v1/gaspar/ppr?rayon=1000&latlon=${lon},${lat}&page=1&page_size=20`,
      { headers: H }
    );
    if (geoR.ok) {
      const geoD = await geoR.json() as { data?: Array<{ type_risque_jo?: string; libelle_risque_jo?: string }> };
      ppri = (geoD.data || []).some(p =>
        p.type_risque_jo?.toLowerCase().includes('inond') || p.libelle_risque_jo?.toLowerCase().includes('inond')
      );
    }
  } catch { /* ignore */ }

  // SMS
  let sms = false;
  try {
    const smsR = await fetch(
      `https://apicarto.ign.fr/api/gpu/info-surf?geom=${encodeURIComponent(geomStr)}`,
      { headers: H, signal: AbortSignal.timeout(8000) }
    );
    if (smsR.ok) {
      const smsD = await smsR.json() as { features?: Array<{ properties: { libelle?: string; txt?: string; typeinf?: string } }> };
      const SMS_KEYWORDS = /mixit[ée]|sociaux?|social|logements?\s+aid[ée]s?|diversit[ée]|SMS|LLS/i;
      const smsFeat = (smsD.features || []).filter(f => {
        const p = f.properties || {};
        return SMS_KEYWORDS.test(p.libelle || '') || SMS_KEYWORDS.test(p.txt || '') || SMS_KEYWORDS.test(p.typeinf || '');
      });
      sms = smsFeat.length > 0;
    }
  } catch { /* ignore */ }

  return {
    success: true,
    address: label,
    coordinates: { lat, lon },
    citycode,
    city,
    zone,
    pluUrl,
    pluName,
    planUrls,
    ppri,
    sms,
    procedures,
  };
}
