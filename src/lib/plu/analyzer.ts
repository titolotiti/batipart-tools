import type { PlanUrl, PluSection, PluConclusion } from "./types";

const SECTION_TITLES = [
  'Habitation / destination',
  'Mixité sociale / SMS',
  'Taille minimale des logements / STML',
  'Mixité fonctionnelle',
  'Stationnement',
  'Hauteur',
  'Emprise au sol',
  'Espaces verts / pleine terre',
  'Implantation / prospects',
  'Risques, servitudes et prescriptions particulières',
];

const OPERATIONS: Record<string, string> = {
  destination: "Changement de destination — bureaux → logements, bâtiment existant",
  surelevation: "Surélévation — ajout d'étages (hauteur max, gabarit, prospects)",
  extension: "Extension — agrandissement (emprise au sol, reculs, implantation)",
};

const PLAN_FALLBACK_NAMES: Record<string, string> = {
  '1': 'Plan général',
  '2': 'Plan des prescriptions et périmètres particuliers',
  '3': 'Plan des protections patrimoniales, écologiques et paysagères',
  '4': 'Plan de pleine-terre et coefficient de biotope surfacique',
  '5': 'Plan des secteurs de stationnement',
};

const PROMPT = `Tu es un expert en droit de l'urbanisme français et en faisabilité immobilière. Produis une note de faisabilité urbanistique de niveau professionnel, identique à celles produites par un cabinet d'architecte ou d'urbaniste pour un investisseur immobilier.

Zone : {ZONE}{COMMUNE}
Opération : {OPERATION}{PROJET}

RÈGLES ABSOLUES :
- Cite UNIQUEMENT ce qui est dans les extraits fournis. Si absent : statut "❓", resume "Non trouvé dans les extraits." — ne jamais inventer un chiffre, un seuil, un article ou une page.
- Ne cite que les règles qui s'appliquent à {ZONE}. Ignore les autres zones et indices.
- Pour chaque règle : texte exact entre guillemets + article + page (marqueur --- PAGE N ---).
- TABLEAUX : les lignes séparées par " | " sont des colonnes — extrais les valeurs cellule par cellule.
- Réponds UNIQUEMENT avec le bloc <json>...</json>. Aucun texte avant ni après.

---

ANALYSE EN 10 SECTIONS DANS CET ORDRE EXACT :
1. Habitation / destination
2. Mixité sociale / SMS
3. Taille minimale des logements / STML
4. Mixité fonctionnelle
5. Stationnement
6. Hauteur
7. Emprise au sol
8. Espaces verts / pleine terre
9. Implantation / prospects
10. Risques, servitudes et prescriptions particulières

CHAMPS OBLIGATOIRES PAR SECTION :
- titre : intitulé exact parmi la liste ci-dessus
- statut : "✅" | "⚠️" | "❌" | "🗺️" | "❓"
- statut_label : "Applicable" | "Sous conditions" | "Non applicable" | "À vérifier sur plan graphique" | "Non trouvé dans le règlement écrit"
- resume : 1-2 phrases — verdict immédiat pour CE projet
- regle_principale : valeurs exactes ou "Non trouvé dans les extraits."
- article : ex "Art. UH 1.2" — ou "" si absent
- page : numéro de page (--- PAGE N ---) — ou "" si absent
- analyse_detaillee : 900 à 1 500 caractères max
- citation : extrait verbatim entre guillemets — ou "" si absent
- points_vigilance : liste de 2 à 4 éléments concrets
- documents_a_consulter : 0 à 3 éléments max — { "reference": "...", "nom_document": "...", "raison": "...", "url": null }
- source_manquante : nom du document manquant si statut "🗺️" ou "❓", sinon ""
- action_recommandee : phrase d'action concrète ou ""

CONTRAINTES : analyse_detaillee max 1800 chars, citation max 800 chars, points_vigilance max 4, documents_a_consulter max 3, synthese max 200 mots.

⚠️ RÈGLES TRANSVERSALES : Les règles SMS, STML, stationnement, pleine-terre, CBS, hauteur, implantation et risques/servitudes se trouvent SOUVENT dans des chapitres TRANSVERSAUX. Des extraits thématiques dédiés sont fournis sous les marqueurs "--- MIXITÉ SOCIALE ---", "--- TAILLE MINIMALE ---", "--- STATIONNEMENT ---", etc. Analysez ces extraits même s'ils ne portent pas le nom de la zone.

FORMAT JSON OBLIGATOIRE :
<json>
{
  "sections": [
    {
      "titre": "Habitation / destination",
      "statut": "✅",
      "statut_label": "Applicable",
      "resume": "...",
      "regle_principale": "...",
      "article": "",
      "page": "",
      "analyse_detaillee": "...",
      "citation": "...",
      "points_vigilance": ["..."],
      "documents_a_consulter": [],
      "source_manquante": "",
      "action_recommandee": ""
    }
  ],
  "conclusion_operationnelle": {
    "points_bloquants": [],
    "conditions": [],
    "non_applicables": [],
    "sujets_a_verifier": [],
    "opportunites": [],
    "niveau_risque": "Faible",
    "synthese": "..."
  }
}
</json>`;

export function normalizeGpuDocuments(rawPlans: Array<{ title?: string; url?: string; nom?: string }>) {
  if (!Array.isArray(rawPlans) || !rawPlans.length) return [];
  return rawPlans.map(p => {
    const rawNom = p.title || p.nom || '';
    const num = rawNom.match(/(?:^plan\s+graphique\s+|^plan\s+)(\d+)/i)?.[1]
             || String(p.url || '').match(/graphique_(\d+)/i)?.[1];
    const isGeneric = /^plan\s+graphique\s*\d*\s*$|^plan\s+\d+\s*$/i.test(rawNom);
    let nom: string;
    if (!isGeneric && rawNom) {
      nom = rawNom;
    } else if (num && PLAN_FALLBACK_NAMES[num]) {
      nom = `Plan graphique n°${num} — ${PLAN_FALLBACK_NAMES[num]}`;
    } else {
      nom = 'Document graphique — titre non disponible';
    }
    return { nom, url: p.url || '', num: num || null };
  });
}

export function resolveDocUrls(sections: PluSection[], availablePlans: Array<{ nom: string; url: string; num: string | null }>): PluSection[] {
  if (!availablePlans.length) return sections;
  const THEMATIC = [
    { keys: ['prescription', 'périmètre', 'sms', 'stml', 'emplacement', 'hauteur', 'réservé'], planKeys: ['prescription', 'périmètre'] },
    { keys: ['mixité', 'social', 'diversité'], planKeys: ['mixité', 'social', 'diversité'] },
    { keys: ['pleine terre', 'biotope', 'cbs'], planKeys: ['pleine', 'biotope', 'cbs'] },
    { keys: ['stationnement', 'parking'], planKeys: ['stationnement'] },
    { keys: ['patrimoine', 'paysag', 'écolog'], planKeys: ['patrimoine', 'paysag', 'écolog', 'protection'] },
    { keys: ['zonage', 'général', 'general'], planKeys: ['général', 'general', 'zonage', 'synthèse'] },
  ];
  return sections.map(sec => ({
    ...sec,
    documents_a_consulter: (sec.documents_a_consulter || []).map(doc => {
      if (doc.url) return doc;
      const refLower = (String(doc.reference || '') + ' ' + String(doc.nom_document || '')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const numRef = refLower.match(/n[°o]?\s*(\d+)|graphique\s+(\d+)|plan\s+(\d+)/);
      if (numRef) {
        const n = numRef[1] || numRef[2] || numRef[3];
        const byNum = availablePlans.find(p => p.num === n);
        if (byNum) return { ...doc, url: byNum.url, nom_document: byNum.nom || doc.nom_document };
      }
      for (const th of THEMATIC) {
        if (!th.keys.some(k => refLower.includes(k))) continue;
        const matched = availablePlans.find(p => {
          const pn = p.nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
          return th.planKeys.some(k => pn.includes(k));
        });
        if (matched) return { ...doc, url: matched.url, nom_document: matched.nom || doc.nom_document };
      }
      return doc;
    }),
  }));
}

const STATUT_FROM_LABEL: Record<string, string> = {
  'applicable': '✅', 'sous conditions': '⚠️', 'non applicable': '❌',
  'à vérifier sur plan graphique': '🗺️', 'non trouvé': '❓', 'non trouvé dans le règlement écrit': '❓'
};
const LABEL_FROM_STATUT: Record<string, string> = {
  '✅': 'Applicable', '⚠️': 'Sous conditions', '❌': 'Non applicable',
  '🗺️': 'À vérifier sur plan graphique', '❓': 'Non trouvé dans le règlement écrit'
};

function coerceStatut(rawStatut: string, rawLabel: string) {
  const s = (rawStatut || '').trim();
  if (LABEL_FROM_STATUT[s]) return { statut: s as PluSection['statut'], statut_label: LABEL_FROM_STATUT[s] as PluSection['statut_label'] };
  const lNorm = (rawLabel || '').toLowerCase().trim();
  if (STATUT_FROM_LABEL[lNorm]) return { statut: STATUT_FROM_LABEL[lNorm] as PluSection['statut'], statut_label: rawLabel as PluSection['statut_label'] };
  return { statut: '❓' as PluSection['statut'], statut_label: 'Non trouvé dans le règlement écrit' as PluSection['statut_label'] };
}

export function normalizeAnalysis(parsed: Record<string, unknown>): { sections: PluSection[]; conclusion_operationnelle: PluConclusion } {
  const defaultSection = (titre: string): PluSection => ({
    titre,
    statut: '❓',
    statut_label: 'Non trouvé dans le règlement écrit',
    resume: 'Non trouvé dans les extraits.',
    regle_principale: 'Non trouvé dans les extraits.',
    article: '',
    page: '',
    analyse_detaillee: "Aucune disposition relative à ce sujet n'a été trouvée dans les extraits disponibles. Vérifier manuellement dans le règlement écrit et les plans graphiques.",
    citation: '',
    points_vigilance: ['Vérifier manuellement dans le règlement et les plans graphiques.'],
    documents_a_consulter: [],
    source_manquante: '',
    action_recommandee: '',
  });

  const input = Array.isArray(parsed.sections) ? parsed.sections as Record<string, unknown>[] : [];
  const sections: PluSection[] = SECTION_TITLES.map(titre => {
    const keyword = titre.split('/')[0].trim().toLowerCase();
    const found = input.find(s => s && s.titre && String(s.titre).toLowerCase().includes(keyword));
    if (!found) return defaultSection(titre);
    const { statut, statut_label } = coerceStatut(String(found.statut || ''), String(found.statut_label || ''));
    return {
      titre,
      statut,
      statut_label,
      resume: String(found.resume || 'Non trouvé dans les extraits.'),
      regle_principale: String(found.regle_principale || 'Non trouvé dans les extraits.'),
      article: String(found.article || ''),
      page: String(found.page || ''),
      analyse_detaillee: String(found.analyse_detaillee || ''),
      citation: String(found.citation || ''),
      points_vigilance: Array.isArray(found.points_vigilance) ? (found.points_vigilance as unknown[]).slice(0, 4).map(String) : [],
      documents_a_consulter: Array.isArray(found.documents_a_consulter)
        ? (found.documents_a_consulter as Record<string, unknown>[]).slice(0, 3).map(d => ({
            reference: String(d.reference || ''),
            nom_document: String(d.nom_document || ''),
            raison: String(d.raison || ''),
            url: d.url ? String(d.url) : null,
          }))
        : [],
      source_manquante: String(found.source_manquante || ''),
      action_recommandee: String(found.action_recommandee || ''),
    };
  });

  const c = (parsed.conclusion_operationnelle || {}) as Record<string, unknown>;
  return {
    sections,
    conclusion_operationnelle: {
      points_bloquants: Array.isArray(c.points_bloquants) ? (c.points_bloquants as unknown[]).map(String) : [],
      conditions: Array.isArray(c.conditions) ? (c.conditions as unknown[]).map(String) : [],
      non_applicables: Array.isArray(c.non_applicables) ? (c.non_applicables as unknown[]).map(String) : [],
      sujets_a_verifier: Array.isArray(c.sujets_a_verifier) ? (c.sujets_a_verifier as unknown[]).map(String) : [],
      opportunites: Array.isArray(c.opportunites) ? (c.opportunites as unknown[]).map(String) : [],
      niveau_risque: String(c.niveau_risque || 'Moyen'),
      synthese: String(c.synthese || ''),
    },
  };
}

function escRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function extractZoneSection(text: string, zone: string, baseZone: string): string | null {
  try {
    const zE = escRe(zone), bE = escRe(baseZone);
    const patterns = [
      new RegExp('ZONE\\s+' + zE + '\\b', 'gi'),
      new RegExp('ZONE\\s+' + bE + '\\b', 'gi'),
      new RegExp('Article\\s+' + bE + '[\\s.\\-]*1\\b', 'gi'),
      new RegExp('^' + bE + '\\s*[-–—:]', 'gim'),
    ];
    const candidates = new Set<number>();
    for (const p of patterns) {
      let m: RegExpExecArray | null, guard = 0;
      while ((m = p.exec(text)) !== null && guard++ < 80) candidates.add(m.index);
    }
    if (!candidates.size) return null;
    let best = -1, bestScore = -Infinity;
    for (const pos of candidates) {
      const w = text.slice(pos, pos + 4000);
      const kw = (w.match(/article|chapitre|destination|interdit|autoris|hauteur|emprise|implantation|stationnement|pleine terre|recul/gi) || []).length;
      const wl = w.split('\n').map(l => l.trim()).filter(l => l.length > 3);
      const tocish = wl.filter(l =>
        /[.…]{2,}\s*\d{1,4}$/.test(l) ||
        (/\s\d{1,4}$/.test(l) && l.length < 70 && !/[m²°%]|m\d|\bm\b/i.test(l))
      ).length;
      const tocRatio = wl.length ? tocish / wl.length : 0;
      const score = kw * (1 - 1.5 * tocRatio) - tocish + (pos / text.length) * 3;
      if (score > bestScore) { bestScore = score; best = pos; }
    }
    if (best === -1) return null;
    const start = Math.max(0, best - 80000);
    let end = Math.min(best + 160000, text.length);
    const reEnd = new RegExp(
      '\\n\\s*(?:' +
        'ZONE\\s+([A-Z][A-Z0-9]*(?:[.\\-][A-Z0-9]+)*[a-z]?\\d*)' +
        '|CHAPITRE\\s+(?:ZONE\\s+)?([A-Z][A-Z0-9]*(?:[.\\-][A-Z0-9]+)*[a-z]?\\d*)' +
        '|([A-Z]{2,}[A-Z0-9]*\\d+[a-z]?)\\s*[-–—:]' +
        '|Article\\s+([A-Z]{2,}[A-Z0-9]*\\d+[a-z]?)\\.?1\\b' +
      ')', 'g'
    );
    reEnd.lastIndex = best + 500;
    let mm: RegExpExecArray | null;
    while ((mm = reEnd.exec(text)) !== null && mm.index < end) {
      const lbl = (mm[1] || mm[2] || mm[3] || mm[4] || '').toUpperCase();
      if (lbl && lbl !== zone.toUpperCase() && lbl !== baseZone.toUpperCase()) { end = mm.index; break; }
    }
    return text.slice(start, end);
  } catch { return null; }
}

function extractTopicSections(text: string, pattern: string, cap = 16000, maxClusters = 2): string | null {
  try {
    const re = new RegExp(pattern, 'gi');
    const hits: number[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null && hits.length < 600) hits.push(m.index);
    if (!hits.length) return null;
    const results: string[] = [];
    const used = new Set<number>();
    for (let k = 0; k < maxClusters; k++) {
      let best = -1, bestN = -1;
      for (const h of hits) {
        if (used.has(h)) continue;
        const n = hits.filter(x => x >= h && x < h + cap && !used.has(x)).length;
        if (n > bestN) { bestN = n; best = h; }
      }
      if (best === -1 || bestN < 2) break;
      const s = Math.max(0, best - 1500);
      results.push(text.slice(s, Math.min(s + cap, text.length)));
      hits.filter(x => x >= s && x < s + cap).forEach(x => used.add(x));
    }
    return results.length ? results.join('\n\n[...]\n\n') : null;
  } catch { return null; }
}

function addIfNew(existing: string, section: string | null): boolean {
  if (!section) return false;
  if (section.length < 2000) return true;
  const probe = section.slice(2000, 2400);
  return !probe || !existing.includes(probe);
}

async function callClaude(promptText: string, apiKey: string): Promise<string> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 16000, messages: [{ role: 'user', content: promptText }] })
  });
  const d = await r.json() as { content?: Array<{ type: string; text?: string }>; error?: unknown };
  if (!r.ok) throw new Error(JSON.stringify(d.error));
  return (d.content || []).filter(c => c.type === 'text').map(c => c.text || '').join('');
}

export async function analyzeZone(params: {
  zone: string;
  analysisType: string;
  fullText: string;
  pluUrl: string;
  planUrls: PlanUrl[];
  commune?: string;
  address?: string;
  projet?: string;
  smsData?: Array<{ libelle: string }> | null;
  apiKey: string;
}): Promise<{ sections: PluSection[]; conclusion_operationnelle: PluConclusion; raw?: string }> {
  const { zone, analysisType, fullText, pluUrl, planUrls, commune, address, projet, smsData, apiKey } = params;

  const baseZone = (zone.match(/^([A-Z]+\d*)/)?.[1]) || zone;
  const normalizedPlans = normalizeGpuDocuments(planUrls);

  const communeInfo = commune ? `\nCommune : ${commune}${address ? ' — ' + address : ''}` : '';
  const plansInfo = normalizedPlans.length
    ? '\n\nDOCUMENTS GRAPHIQUES DÉJÀ DISPONIBLES :\n' +
      normalizedPlans.map(p => `- ${p.nom} : ${p.url}`).join('\n') +
      '\n\nRÈGLES : Si une section nécessite de consulter un plan listé ci-dessus, mets l\'URL EXACTE dans documents_a_consulter[].url — JAMAIS null si le document est dans la liste.'
    : '';
  const smsInfo = smsData && smsData.length > 0
    ? '\n\n⚠️ DONNÉE CARTOGRAPHIQUE CONFIRMÉE — Cette parcelle est dans un SECTEUR DE MIXITÉ SOCIALE : ' + smsData.map(s => s.libelle).join(', ') + '. Analyse l\'applicabilité de la règle SMS de ce secteur.'
    : smsData !== null && smsData !== undefined
      ? '\n\n✅ DONNÉE CARTOGRAPHIQUE CONFIRMÉE — Cette parcelle n\'est dans AUCUN secteur de mixité sociale.'
      : '';
  const zoneNote = zone !== baseZone
    ? `\n\nNOTE ZONE : La zone s'affiche "${zone}" mais dans le règlement, cherche sous le code court "${baseZone}".`
    : '';

  const prompt = PROMPT
    .replace(/\{ZONE\}/g, zone)
    .replace('{COMMUNE}', communeInfo + plansInfo + smsInfo + zoneNote)
    .replace('{OPERATION}', OPERATIONS[analysisType] || analysisType)
    .replace('{PROJET}', projet ? '\nDescription du projet : ' + String(projet).slice(0, 1500) : '');

  const generalText = fullText.slice(0, 40000);
  const zoneSection = extractZoneSection(fullText, zone, baseZone);

  let sendText: string;
  if (zoneSection) {
    sendText = generalText + '\n\n--- ZONE ' + zone + ' ---\n\n' + zoneSection;
  } else {
    const third = Math.floor(fullText.length / 3);
    sendText = fullText.slice(0, 80000) + '\n...\n' + fullText.slice(third, third + 80000) + '\n...\n' + fullText.slice(-60000);
  }

  const topics = [
    { label: 'MIXITÉ SOCIALE / LOGEMENTS SOCIAUX', section: extractTopicSections(fullText, 'SMS|secteurs?\\s+de\\s+mixit[ée]\\s+sociale|servitude\\s+de\\s+mixit[ée]|mixit[ée]\\s+sociale|logements?\\s+(?:locatifs?\\s+)?sociaux|L\\.?\\s*151-15', 16000) },
    { label: 'TAILLE MINIMALE / TYPOLOGIE DES LOGEMENTS', section: extractTopicSections(fullText, 'taille\\s+minimale|surface\\s+minimale|STML|typ(?:e|ologie)\\s+(?:de\\s+)?logements?\\s*:?\\s*T[1-5]|\\bT3\\b|65\\s*%', 16000) },
    { label: 'MIXITÉ FONCTIONNELLE / LINÉAIRES COMMERCIAUX', section: extractTopicSections(fullText, 'mixit[ée]\\s+fonctionnelle|lin[ée]aires?\\s+(?:de\\s+)?(?:commerces?|activit[ée]s?)|rez-de-chauss[ée]e\\s+(?:actif|commercial)', 16000) },
    { label: 'HAUTEUR / GABARIT', section: extractTopicSections(fullText, 'hauteur\\s+(?:maximale?|des\\s+constructions|plafond)|\\bHmax\\b|gabarit|\\bR\\s*\\+\\s*\\d', 12000) },
    { label: 'EMPRISE AU SOL / PLEINE TERRE / ESPACES VERTS', section: extractTopicSections(fullText, 'emprise\\s+au\\s+sol|\\bCES\\b|pleine\\s+terre|pleine-terre|coefficient\\s+(?:bio|vert|nature|perméabilité|biotope)|\\bCBS\\b', 12000) },
    { label: 'STATIONNEMENT', section: extractTopicSections(fullText, 'stationnement|aires?\\s+de\\s+stationnement|places?\\s+de\\s+(?:parking|stationnement)|normes?\\s+de\\s+stationnement|\\bS1\\b|\\bS2\\b|\\bS3\\b|\\bS4\\b', 16000) },
    { label: 'IMPLANTATION / PROSPECTS', section: extractTopicSections(fullText, 'implantation|prospect|recul|retrait|limite\\s+séparat|bande\\s+constructible|alignement', 12000) },
  ];

  for (const { label, section } of topics) {
    if (section && addIfNew(sendText, section)) sendText += '\n\n--- ' + label + ' ---\n\n' + section;
  }

  const fullPrompt = `Voici les extraits du règlement PLU pour la zone "${zone}".\n\nRÈGLE ABSOLUE : ne cite et n'utilise QUE les dispositions présentes dans les extraits ci-dessous.\n\n${sendText}\n\n---\n\n${prompt}`;

  const analysisText = await callClaude(fullPrompt, apiKey);

  try {
    const jsonMatch = analysisText.match(/<json>([\s\S]*?)<\/json>/) || analysisText.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1].trim()) as Record<string, unknown>;
      const normalized = normalizeAnalysis(parsed);
      normalized.sections = resolveDocUrls(normalized.sections, normalizedPlans);
      return normalized;
    }
  } catch { /* fallback */ }

  return { sections: SECTION_TITLES.map(t => ({
    titre: t, statut: '❓', statut_label: 'Non trouvé dans le règlement écrit',
    resume: 'Erreur de parsing de la réponse.', regle_principale: '', article: '', page: '',
    analyse_detaillee: '', citation: '', points_vigilance: [], documents_a_consulter: [],
    source_manquante: '', action_recommandee: ''
  })), conclusion_operationnelle: { points_bloquants: [], conditions: [], non_applicables: [], sujets_a_verifier: [], opportunites: [], niveau_risque: 'Inconnu', synthese: '' }, raw: analysisText };
}

// Also need pluUrl for Plaine Commune fallback
export async function enrichTextWithGeneralDispositions(pluUrl: string, fullText: string): Promise<string> {
  const FALLBACK_URLS: Record<string, string> = {
    '200057867_general': 'https://plainecommune.fr/fileadmin/user_upload/Portail_Plaine_Commune/LA_DOC/PROJET_DE_TERRITOIRE/PLUI/PLUi_Exutoire/TOME_4-REGLEMENT_ECRIT_ET_GRAPHIQUE/TOME_4-REGLEMENT_ECRIT/200057867_4-1-1_Partie1_Definitions_et_dispositions_generales.pdf',
  };
  const urlCode = pluUrl.match(/DU_(\d+)\//)?.[1];
  if (urlCode && FALLBACK_URLS[urlCode + '_general']) {
    try {
      const { extractText } = await import('./pdf');
      const r = await fetch(FALLBACK_URLS[urlCode + '_general'], { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (r.ok) {
        const cl = parseInt(r.headers.get('content-length') || '0');
        if (cl <= 40 * 1024 * 1024) {
          const buf = Buffer.from(await r.arrayBuffer());
          const generalText = await extractText(buf);
          return generalText.slice(0, 40000) + '\n\n' + fullText;
        }
      }
    } catch { /* ignore */ }
  }
  return fullText;
}
