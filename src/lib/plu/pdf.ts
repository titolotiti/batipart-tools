import { PDFParse } from "pdf-parse";
import * as fs from "fs";

const PDF_MAX_MB = Number(process.env.PDF_MAX_MB || 60);
const LARGE_PDF_MAX_MB = Number(process.env.LARGE_PDF_MAX_MB || 250);

export async function extractText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText({ pageJoiner: "\n--- PAGE page_number ---\n" });
  await parser.destroy();
  return repairTableBlocks(result.text || '');
}

function repairTableBlocks(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const tableLines: string[] = [];
    let j = i;
    while (j < lines.length && j < i + 50) {
      const l = lines[j].trim();
      if (l.length === 0) { j++; continue; }
      if (l.length < 80 || /^\d[\d\s,./%-]*$/.test(l) || /\d+\s*(place|logement|m²|%|T\d)/i.test(l)) {
        tableLines.push(l); j++;
      } else break;
    }
    if (tableLines.length >= 4) { out.push(tableLines.join(' | ')); i = j; }
    else { out.push(lines[i]); i++; }
  }
  return out.join('\n');
}

async function streamToTmp(url: string, tmpPath: string, maxBytes: number): Promise<number> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 180000);
  let response: Response;
  try {
    response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: ctrl.signal });
  } finally { clearTimeout(tid); }
  if (!response.ok) throw new Error(`Téléchargement échoué (${response.status})`);
  const cl = parseInt(response.headers.get('content-length') || '0');
  if (cl > maxBytes) {
    try { response.body?.cancel(); } catch { /* ignore */ }
    throw new Error(`PDF_TROP_VOLUMINEUX:${Math.round(cl / 1048576)}`);
  }
  const fd = fs.openSync(tmpPath, 'w');
  const reader = response.body!.getReader();
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > maxBytes) {
        try { await reader.cancel(); } catch { /* ignore */ }
        throw new Error(`PDF_TROP_VOLUMINEUX:>${Math.round(maxBytes / 1048576)}`);
      }
      fs.writeSync(fd, Buffer.from(value));
    }
  } finally {
    try { fs.closeSync(fd); } catch { /* ignore */ }
  }
  return total;
}

async function downloadCapped(url: string, maxBytes: number): Promise<Buffer> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 120000);
  let r: Response;
  try {
    r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: ctrl.signal });
  } finally { clearTimeout(tid); }
  if (!r.ok) throw new Error(`Téléchargement échoué (${r.status})`);
  const cl = parseInt(r.headers.get('content-length') || '0');
  if (cl > maxBytes) {
    try { r.body?.cancel(); } catch { /* ignore */ }
    throw new Error(`PDF_TROP_VOLUMINEUX:${Math.round(cl / 1048576)}`);
  }
  const reader = r.body!.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      try { await reader.cancel(); } catch { /* ignore */ }
      throw new Error(`PDF_TROP_VOLUMINEUX:>${Math.round(maxBytes / 1048576)}`);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

async function gpuReglementPieces(docUrl: string): Promise<Array<{ name: string; url: string }> | null> {
  try {
    const m = (docUrl || '').match(/documents\/DU_\w+\/([0-9a-f]{16,40})\//);
    if (!m) return null;
    const hash = m[1];
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 8000);
    let r: Response;
    try {
      r = await fetch(`https://www.geoportail-urbanisme.gouv.fr/api/document/${hash}/files`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal: ctrl.signal
      });
    } finally { clearTimeout(tid); }
    if (!r.ok) return null;
    const files = await r.json() as Array<{ name: string; title?: string }>;
    if (!Array.isArray(files) || !files.length) return null;
    const base = docUrl.slice(0, docUrl.lastIndexOf('/'));
    const EXCLUDE = /graphique|rapport.pr[ée]sentation|padd|oap|notice|info.surf|sanitaire|assainissement|servitude|sup[_-]/i;
    const INCLUDE = /r[eè]glement/i;
    const candidates = files
      .filter(f => { const n = (f.name || '').toLowerCase(); return n.endsWith('.pdf') && INCLUDE.test(n) && !EXCLUDE.test(n); })
      .map(f => {
        const priority = /ecrit|zone|secteur|partie[_\s-]?\d|piece[_\s-]?\d|\d[_-]\d{8}/i.test(f.name) ? 1
                       : /_\d+_\d{8}/i.test(f.name) ? 2 : 3;
        return { name: f.name, url: `${base}/${f.name}`, priority };
      })
      .sort((a, b) => a.priority - b.priority);
    return candidates.length ? candidates : null;
  } catch { return null; }
}

export interface DownloadResult {
  buffer: Buffer | null;
  preExtractedText: string | null;
  errorCode?: 'PDF_TROP_VOLUMINEUX';
  errorMessage?: string;
  sizeStr?: string;
}

export async function downloadPdf(pluUrl: string): Promise<DownloadResult> {
  const MAX_PDF = PDF_MAX_MB * 1024 * 1024;
  const FALLBACK_URLS: Record<string, string> = {
    '200057867_zones': 'https://plainecommune.fr/fileadmin/user_upload/Portail_Plaine_Commune/LA_DOC/PROJET_DE_TERRITOIRE/PLUI/PLUi_Exutoire/TOME_4-REGLEMENT_ECRIT_ET_GRAPHIQUE/TOME_4-REGLEMENT_ECRIT/4-1-2_Partie_2_Reglements_de-zones/4-1-2-1_Zones_UMD_UMT_UM_UC_UH_UA_UE_UG_UVP_N_A/200057867_4-1-2-1_Reglements_des_zones.pdf',
  };

  let url = pluUrl;
  try {
    const code = pluUrl.match(/DU_(\d+)\//)?.[1];
    const head = await fetch(pluUrl, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
    const size = parseInt(head.headers.get('content-length') || '0');
    if ((size === 0 || size > 30 * 1024 * 1024) && code && FALLBACK_URLS[code + '_zones']) {
      url = FALLBACK_URLS[code + '_zones'];
    }
  } catch { /* continue */ }

  const code2 = pluUrl.match(/DU_(\d+)\//)?.[1];
  const fb = code2 && FALLBACK_URLS[code2 + '_zones'];
  const tries = [...new Set([url, fb, pluUrl].filter(Boolean))] as string[];

  const cache = (globalThis as Record<string, unknown>).__pdfBufCache as Map<string, Buffer> | undefined;
  const pdfCache: Map<string, Buffer> = cache || new Map();
  (globalThis as Record<string, unknown>).__pdfBufCache = pdfCache;

  async function downloadWithRetry(u: string, cap: number, tries2 = 3): Promise<Buffer> {
    if (pdfCache.has(u)) return pdfCache.get(u)!;
    let lastErr!: Error;
    for (let i = 1; i <= tries2; i++) {
      try {
        const buf = await downloadCapped(u, cap);
        if (buf.length <= 30 * 1024 * 1024) {
          if (pdfCache.size >= 5) pdfCache.delete(pdfCache.keys().next().value!);
          pdfCache.set(u, buf);
        }
        return buf;
      } catch (e) {
        lastErr = e as Error;
        if (/PDF_TROP_VOLUMINEUX/.test(lastErr.message)) throw lastErr;
        if (i < tries2) await new Promise(r => setTimeout(r, 900 * i));
      }
    }
    throw lastErr;
  }

  let pdfBuffer: Buffer | null = null;
  let preExtractedText: string | null = null;
  let lastErr: Error | null = null;

  for (const tryUrl of tries) {
    try {
      pdfBuffer = await downloadWithRetry(tryUrl, MAX_PDF, 2);
      lastErr = null;
      break;
    } catch (e) { lastErr = e as Error; }
  }

  // Try GPU pieces
  if (lastErr) {
    const pieces = (await gpuReglementPieces(pluUrl)) || [];
    const others = pieces.filter(p => !tries.includes(p.url));
    const texts: string[] = [];
    for (const p of others.slice(0, 5)) {
      try {
        const buf = await downloadWithRetry(p.url, MAX_PDF, 3);
        texts.push(await extractText(buf));
      } catch { /* ignore */ }
      if (texts.length >= 3) break;
    }
    if (texts.length) {
      const combined = texts.join('\n\n');
      if (combined.length >= 8000) { preExtractedText = combined; lastErr = null; }
    }
  }

  // Large PDF streaming to /tmp
  if (lastErr && /PDF_TROP_VOLUMINEUX/.test(lastErr.message)) {
    const tmpPath = `/tmp/plu_large_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`;
    const maxLarge = LARGE_PDF_MAX_MB * 1024 * 1024;
    try {
      const bytes = await streamToTmp(pluUrl, tmpPath, maxLarge);
      pdfBuffer = fs.readFileSync(tmpPath);
      lastErr = null;
      console.log('Large PDF mode:', Math.round(bytes / 1048576), 'MB');
    } catch (e) {
      if (/PDF_TROP_VOLUMINEUX/.test((e as Error).message)) lastErr = e as Error;
    } finally {
      try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    }
  }

  if (lastErr) {
    if (/PDF_TROP_VOLUMINEUX/.test(lastErr.message)) {
      const sizeStr = (lastErr.message.match(/:>?\s*(\S+)/) || [])[1] || '?';
      return { buffer: null, preExtractedText: null, errorCode: 'PDF_TROP_VOLUMINEUX', sizeStr };
    }
    return { buffer: null, preExtractedText: null, errorMessage: lastErr.message };
  }

  return { buffer: pdfBuffer, preExtractedText };
}
