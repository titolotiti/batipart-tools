import { NextRequest, NextResponse } from "next/server";
import { downloadPdf, extractText } from "@/lib/plu/pdf";
import { analyzeZone, normalizeGpuDocuments, enrichTextWithGeneralDispositions } from "@/lib/plu/analyzer";
import type { PlanUrl } from "@/lib/plu/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      zone: string;
      analysisType: string;
      pluUrl: string;
      planUrls?: PlanUrl[];
      commune?: string;
      address?: string;
      projet?: string;
      smsData?: Array<{ libelle: string }> | null;
    };

    const { zone, analysisType, pluUrl, planUrls, commune, address, projet, smsData } = body;
    if (!zone || !analysisType || !pluUrl) {
      return NextResponse.json({ error: "Paramètres manquants (zone, analysisType, pluUrl)" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Clé API non configurée" }, { status: 500 });

    const dl = await downloadPdf(pluUrl);
    if (dl.errorCode === 'PDF_TROP_VOLUMINEUX') {
      const normalizedPlans = normalizeGpuDocuments(planUrls || []);
      return NextResponse.json({
        success: false,
        error_code: 'PDF_TROP_VOLUMINEUX',
        zone,
        analysisType,
        message: `Le règlement PLU (${dl.sizeStr} Mo) dépasse la capacité d'analyse automatique. Document trop volumineux ou non exploitable automatiquement, analyse partielle réalisée.`,
        reglement_url: pluUrl,
        documents_disponibles: normalizedPlans,
      });
    }
    if (dl.errorMessage) {
      return NextResponse.json({ error: dl.errorMessage }, { status: 422 });
    }

    let fullText = dl.preExtractedText || (dl.buffer ? await extractText(dl.buffer) : '');
    fullText = await enrichTextWithGeneralDispositions(pluUrl, fullText);

    const result = await analyzeZone({
      zone, analysisType, fullText, pluUrl,
      planUrls: planUrls || [], commune, address, projet, smsData, apiKey,
    });

    return NextResponse.json({ success: true, zone, analysisType, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
