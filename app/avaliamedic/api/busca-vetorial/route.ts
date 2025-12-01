export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";



// ==========================
// CONFIGURAÇÃO SUPABASE
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

    // ==============================
    // 1) Criar embedding da pergunta
    // ==============================
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const embedding = embeddingRes.data[0].embedding;

    // ======================================
    // 2) Buscar os VETORES mais próximos
    // ======================================
    const { data, error } = await supabase.rpc(
      "match_conhecimento",
      {
        query_embedding: embedding,
        similarity_threshold: 0.7, // ajustável
        match_count: 5,            // retorna 5 trechos
      }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      sucesso: true,
      resultados: data,
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro interno" },
      { status: 500 }
    );
  }
}
