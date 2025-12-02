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

    // =====================================================
    // 3) OCR – GPT 4o-mini
    // =====================================================
    const ocr = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é uma IA especializada em ler prescrições médicas."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Leia totalmente esta prescrição e extraia tudo que for relevante." },
            { type: "image_url", image_url: { url: arquivo_url } }
          ]
        }
      ]
    });

    const textoPrescricao = ocr.choices[0].message.content || "";

    // =====================================================
    // 4) Extrair itens – GPT 4o-mini
    // =====================================================
    const extracao = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
            Extraia todos os medicamentos da prescrição.
            
            Retorne SOMENTE JSON:
            [
              {"medicamento":"", "dose":"", "via":"", "frequencia":""}
            ]
          `
        },
        { role: "user", content: textoPrescricao }
      ]
    });

    let bruto = extracao.choices[0].message.content || "";
    bruto = limparJSON(bruto);

    let itens = parseJSONSeguro(bruto);
    if (!itens || !Array.isArray(itens)) itens = [];

    // =====================================================
    // 5) Busca vetorial
    // =====================================================
    async function buscarContexto(medicamento: string) {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/avaliamedic/api/busca-vetorial,
        {
          method: "POST",
          body: JSON.stringify({ query: medicamento }),
          headers: { "Content-Type": "application/json" }
        }
      `);

      const json = await resp.json();
      return json.resultados || [];
    }

    // =====================================================
    // 6) Análise de cada item
    // =====================================================
    const analiseFinal: any[] = [];

    for (const item of itens) {
      const contexto = await buscarContexto(item.medicamento);

      const analise = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
              Você é uma IA clínica hospitalar.
              Retorne SOMENTE JSON:
              {"status":"", "motivo":""}
            `
          },
          {
            role: "user",
            content: `
              Medicamento: ${item.medicamento}
              Dose: ${item.dose}
              Via: ${item.via}
              Frequência: ${item.frequencia}

              Contexto clínico:
              ${contexto.map((c: any) => c.conteudo).join("\n")}
            `
          }
        ]
      });

      let analiseBruta = limparJSON(analise.choices[0].message.content || "");
      const resultado = parseJSONSeguro(analiseBruta) || { status: "indefinido", motivo: "erro ao analisar" };

      analiseFinal.push({
        ...item,
        status: resultado.status,
        motivo: resultado.motivo,
      });
    }

    // =====================================================
    // 7) Salvar itens no banco
    // =====================================================
    for (const item of analiseFinal) {
      await supabase.from("itens_prescricao").insert({
        prescricao_id: prescricaoId,
        medicamento: item.medicamento,
        dose: item.dose,
        via: item.via,
        frequencia: item.frequencia,
        risco: item.status,
      });
    }

    // =====================================================
    // 8) Atualizar status da prescrição
    // =====================================================
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