export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ===============================
// CONFIG
// ===============================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ===============================
// HELPERS
// ===============================
function limparJSON(texto: string): string {
  if (!texto) return "";
  return texto.replace(/json/gi, "").replace(/```/g, "").trim();
}

function parseJSONSeguro(texto: string): any[] | null {
  try {
    const json = JSON.parse(texto);
    return Array.isArray(json) ? json : null;
  } catch {
    return null;
  }
}

// ===============================
// GERAR PARECER
// ===============================
async function gerarParecer(item: any) {
  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Você é um farmacêutico clínico hospitalar.
Responda SOMENTE JSON:

{
  "status": "",
  "motivo": ""
}
`
        },
        {
          role: "user",
          content: `
Medicamento: ${item.medicamento}
Dose: ${item.dose}
Via: ${item.via}
Frequência: ${item.frequencia}
`
        }
      ]
    });

    const bruto = limparJSON(resp.choices[0].message.content || "");
    return JSON.parse(bruto);

  } catch {
    return {
      status: "Indefinido",
      motivo: "Falha na análise automática."
    };
  }
}

// ===============================
// POST
// ===============================
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const setor = form.get("setor") as string;
    const idade = form.get("idade") as string;
    const peso = form.get("peso") as string;
    const arquivo = form.get("arquivo") as File;

    if (!arquivo) {
      return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
    }

    // ===============================
    // UPLOAD
    // ===============================
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const fileName = `prescricoes/${Date.now()}-${arquivo.name}`;

    await supabase.storage
      .from("avaliamedic")
      .upload(fileName, buffer, { contentType: arquivo.type });

    const arquivo_url =
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avaliamedic/${fileName}`;

    // ===============================
    // REGISTRO
    // ===============================
    const { data: prescricao } = await supabase
      .from("prescricoes")
      .insert({
        setor,
        idade,
        peso,
        arquivo_url,
        status: "em_analise"
      })
      .select()
      .single();

    const prescricaoId = prescricao.id;

    // ===============================
    // OCR TURBO
    // ===============================
    const ocr = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Você é um OCR médico avançado.
Leia receitas manuscritas, borradas ou escaneadas.
Retorne TODO o texto legível, sem interpretar.
`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Leia a prescrição médica:" },
            { type: "image_url", image_url: { url: arquivo_url } }
          ]
        }
      ]
    });

    const textoOCR = ocr.choices[0].message.content || "";

    await supabase
      .from("prescricoes")
      .update({ texto_ocr: textoOCR })
      .eq("id", prescricaoId);

    // ===============================
    // EXTRAÇÃO
    // ===============================
    const extracao = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Extraia medicamentos de OCR ruim.
Mesmo abreviações, texto quebrado ou incompleto.

RETORNE APENAS JSON:

[
  { "medicamento": "", "dose": "", "via": "", "frequencia": "" }
]
`
        },
        {
          role: "user",
          content: textoOCR
        }
      ]
    });

    const bruto = limparJSON(extracao.choices[0].message.content || "");
    const itens = parseJSONSeguro(bruto);

    // 🚨 VALIDAÇÃO CRÍTICA
    if (!itens || itens.length === 0) {
      await supabase
        .from("prescricoes")
        .update({ status: "sem_itens" })
        .eq("id", prescricaoId);

      return NextResponse.json(
        { sucesso: false, motivo: "Nenhum medicamento identificado" },
        { status: 200 }
      );
    }

    // ===============================
    // SALVAR ITENS
    // ===============================
    for (const item of itens) {
      if (!item.medicamento) continue;

      const parecer = await gerarParecer(item);

      await supabase.from("itens_prescricao").insert({
        prescricao_id: prescricaoId,
        medicamento: item.medicamento,
        dose: item.dose || "",
        via: item.via || "",
        frequencia: item.frequencia || "",
        status: parecer.status,
        motivo: parecer.motivo
      });
    }

    // ===============================
    // FINAL
    // ===============================
    await supabase
      .from("prescricoes")
      .update({ status: "parecer_concluido" })
      .eq("id", prescricaoId);

    return NextResponse.json({ sucesso: true }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
