export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ==========================
// CONFIG SUPABASE
// ==========================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ==========================
// CONFIG OPENAI
// ==========================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: "Texto de consulta não enviado" },
        { status: 400 }
      );
    }

    console.log("🔎 BUSCA-VETORIAL | Consulta:", query);

    // ================================
    // 1) Criar embedding da pergunta
    // ================================
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small", // modelo atual
      input: query,
    });

    const embedding = embeddingRes.data[0].embedding;
    console.log("📌 Embedding gerado:", embedding.length);

    // ==================================================
    // 2) RPC correta (AJUSTE PARA O NOME CERTO)
    // ==================================================
    const { data, error } = await supabase.rpc("match_enciclopedia", {
      query_embedding: embedding,
      similarity_threshold: 0.25, // valor ideal
      match_count: 5,
    });

    if (error) {
      console.error("❌ ERRO NO SUPABASE:", error);
      return NextResponse.json(
        { error: "Erro Supabase RPC: " + error.message },
        { status: 500 }
      );
    }

    console.log("📚 Resultados encontrados:", data?.length);

    return NextResponse.json({
      sucesso: true,
      resultados: data,
    });
  } catch (e: any) {
    console.error("❌ ERRO GERAL /busca-vetorial:", e);
    return NextResponse.json(
      { error: e.message || "Erro interno" },
      { status: 500 }
    );
  }
}
