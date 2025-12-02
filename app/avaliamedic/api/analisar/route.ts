export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// =========================================
// CONFIG SUPABASE
// =========================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// =========================================
// CONFIG OPENAI
// =========================================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// =========================================
// FUNÇÃO → Força JSON válido SEMPRE
// =========================================
function limparJSON(texto: string) {
  if (!texto) return "[]";

  return texto
    .replace(/json/gi, "")
    .replace(/``/g, "")
    .replace(/[\n\r\t]/g, " ")
    .replace(/  +/g, " ")
    .trim();
}

// =========================================
// FUNÇÃO → Tentar converter JSON (com fallback)
// =========================================
function parseJSONSeguro(texto: string) {
  try {
    return JSON.parse(texto);
  } catch (e) {
    // Tenta extrair apenas o primeiro array válido
    const match = texto.match(/\[.*\]/s);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
    return null;
  }
}

// =========================================
// ROTA PRINCIPAL
// =========================================
export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const setor = form.get("setor") as string;
    const idade = form.get("idade") as string;
    const peso = form.get("peso") as string;
    const arquivo: File | null = form.get("arquivo") as any;

    if (!arquivo) {
      return NextResponse.json(
        { error: "Arquivo não recebido" },
        { status: 400 }
      );
    }

    // =====================================================
    // 1) Upload da imagem
    // =====================================================
    const bytes = await arquivo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `prescricoes/${Date.now()}-${arquivo.name}`;

    const { error: uploadError } = await supabase.storage
      .from("avaliamedic")
      .upload(fileName, buffer);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const arquivo_url =
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avaliamedic/${fileName}`;

    // =====================================================
    // 2) Criar registro inicial
    // =====================================================
    const { data: prescricao, error: prescError } = await supabase
      .from("prescricoes")
      .insert({
        setor,
        idade,
        peso,
        arquivo_url,
        status: "em_analise",
      })
      .select()
      .single();

    if (prescError) {
      return NextResponse.json({ error: prescError.message }, { status: 500 });
    }

    const prescricaoId = prescricao.id;


// 🔴 TESTE: pular a parte da IA por enquanto
await supabase
  .from("prescricoes")
  .update({ status: "aguardando_parecer" })
  .eq("id", prescricaoId);

return NextResponse.json({ sucesso: true, prescricao_id: prescricaoId });

  } catch (err: any) {
    console.error("ERRO NA ANÁLISE:", err);
    return NextResponse.json(
      { error: err.message || "Erro desconhecido" },
      { status: 500 }
    );
  }
}