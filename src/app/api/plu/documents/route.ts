import { NextRequest, NextResponse } from "next/server";
import { getPluDocuments } from "@/lib/plu/documents";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { address?: string };
    if (!body.address) return NextResponse.json({ error: "Adresse manquante" }, { status: 400 });
    const result = await getPluDocuments(body.address);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
