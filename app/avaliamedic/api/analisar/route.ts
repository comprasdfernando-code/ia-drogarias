export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ===============================
// CONFIG SUPABASE
// ===============================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ===============================
// CONFIG OPENAI
// ===============================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ===============================
// HELPERS PARA JSON DA IA
// ===============================
function limparJSON(texto: string): string {
  if (!texto) return "";

  return texto
    .replace(/json/gi, "")
    .replace(/``/g, "")
    .trim();
}

function parseJSONSeguro(texto: string): any {
  try {
    return JSON.parse(texto);
  } catch (e) {
    console.error("Erro ao fazer JSON.parse no texto:", texto);
    throw e;
  }
}

// ===============================
// ROTA PRINCIPAL
// ===============================
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

    // ===============================
    // 1) Upload do arquivo no Storage
    // ===============================
    const bytes = await arquivo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `prescricoes/${Date.now()}-${arquivo.name}`;

    const { error: uploadError } = await supabase.storage
      .from("avaliamedic")
      .upload(fileName, buffer, {
        contentType: arquivo.type || "image/jpeg",
      });

    if (uploadError) {
      console.error("Erro no upload:", uploadError);
      return NextResponse.json(
        { error: "Falha ao enviar arquivo para o storage." },
        { status: 500 }
      );
    }

    const arquivo_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avaliamedic/${fileName}`;

    // ===============================
    // 2) Criar registro inicial
    // ===============================
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

    if (prescError || !prescricao) {
      console.error("Erro ao criar prescrição:", prescError);
      return NextResponse.json(
        { error: "Falha ao registrar prescrição no banco." },
        { status: 500 }
      );
    }

    const prescricaoId = prescricao.id;

    // ===============================
    // 3) OCR - Ler a imagem da receita
    // ===============================
    let textoPrescricao = "";

    try {
      const ocr = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Você é uma IA especializada em ler prescrições hospitalares em português. Retorne apenas o texto legível da prescrição.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Leia essa prescrição e transcreva o texto completo, com foco nos medicamentos, doses, vias e frequências.",
              },
              {
                type: "image_url",
                image_url: { url: arquivo_url },
              },
            ],
          },
        ],
      });

      textoPrescricao = ocr.choices[0].message.content || "";
    } catch (err) {
      console.error("Erro no OCR da prescrição:", err);
      await supabase
        .from("prescricoes")
        .update({ status: "erro_ocr" })
        .eq("id", prescricaoId);

      return NextResponse.json(
        { error: "Falha ao ler a imagem da prescrição." },
        { status: 500 }
      );
    }

    // ===============================
    // 4) Extrair itens da prescrição
    // ===============================
    let itens: any[] = [];

    try {
      const extracao = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
            Você é uma IA clínica hospitalar.
            Extraia os itens da prescrição a seguir.
            Retorne SOMENTE JSON, sem texto explicativo, no formato:

            [
              {"medicamento":"", "dose":"", "via":"", "frequencia":""}
            ]
          `,
          },
          {
            role: "user",
            content: textoPrescricao,
          },
        ],
      });

      let bruto = extracao.choices[0].message.content || "";
      bruto = limparJSON(bruto);

      const json = parseJSONSeguro(bruto);

      if (Array.isArray(json)) {
        itens = json;
      } else if (Array.isArray(json.itens)) {
        itens = json.itens;
      } else {
        console.error("JSON retornado sem array esperado:", json);
        throw new Error("Formato de JSON inesperado pela IA");
      }
    } catch (err) {
      console.error("Erro na extração de itens:", err);
      await supabase
        .from("prescricoes")
        .update({ status: "erro_extracao" })
        .eq("id", prescricaoId);

      return NextResponse.json(
        { error: "Falha ao extrair itens da prescrição." },
        { status: 500 }
      );
    }

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      console.warn("Nenhum item extraído da prescrição.");
      await supabase
        .from("prescricoes")
        .update({ status: "sem_itens" })
        .eq("id", prescricaoId);

      // Ainda assim devolve ok pro front, pra mostrar algo como
      // "Não foi possível identificar medicamentos"
      return NextResponse.json(
        { sucesso: true, prescricao_id: prescricaoId, itens: [] },
        { status: 200 }
      );
    }

    // ===============================
    // 5) Salvar itens na tabela itens_prescricao
    //    (sem análise de risco por enquanto)
    // ===============================
    for (const item of itens) {
      const medicamento = item.medicamento || item.nome || "";
      const dose = item.dose || "";
      const via = item.via || "";
      const frequencia = item.frequencia || "";

      if (!medicamento) continue; // pular linhas vazias

      const { error: itemError } = await supabase
        .from("itens_prescricao")
        .insert({
          prescricao_id: prescricaoId,
          medicamento,
          dose,
          via,
          frequencia,
          risco: "pendente", // depois a gente troca pra "aprovado", "ajustar", "alerta", etc.
        });

      if (itemError) {
        console.error("Erro ao salvar item_prescricao:", itemError, item);
      }
    }

    // ===============================
    // 6) Atualizar status da prescrição
    // ===============================
    await supabase
      .from("prescricoes")
      .update({ status: "aguardando_parecer" })
      .eq("id", prescricaoId);

    // Resposta final pro front
    return NextResponse.json(
      { sucesso: true, prescricao_id: prescricaoId },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("ERRO GERAL NA ANÁLISE:", err);
    return NextResponse.json(
      { error: err?.message || "Erro desconhecido na análise." },
      { status: 500 }
    );
  }
}