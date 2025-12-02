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
// CONFIG OPENAI (API NOVA 2025)
// ===============================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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
      return NextResponse.json({ error: "Arquivo não recebido" }, { status: 400 });
    }

    // ===============================
    // 1) Upload do arquivo
    // ===============================
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

    if (prescError) {
      return NextResponse.json({ error: prescError.message }, { status: 500 });
    }

    const prescricaoId = prescricao.id;

    // ===============================
    // 3) OCR — API NOVA
    // ===============================
    const ocr = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: "Você é uma IA especializada em ler prescrições hospitalares."
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Leia totalmente esta prescrição e extraia tudo que for relevante."
        },
        {
          type: "image_url",
          image_url: { url: arquivo_url }
        }
      ]
    }
  ]
});

const textoPrescricao = ocr.choices[0].message.content;

    // ===============================
    // 4) Extrair itens — API NOVA
    // ===============================
    const extracao = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: `
        Extraia os itens da prescrição.
        Retorne SOMENTE JSON:
        [
          {"medicamento":"", "dose":"", "via":"", "frequencia":""}
        ]
      `
    },
    {
      role: "user",
      content: textoPrescricao
    }
  ]
});

// 1) Garantir que é string
let texto = extracao.choices[0].message.content || "";

// 2) Remover blocos markdown
texto = texto.replace(/```json/gi, "")
             .replace(/```/g, "")
             .trim();

// 3) Extrair SOMENTE o array JSON usando regex
const match = texto.match(/\[[\s\S]*\]/);

if (!match) {
  throw new Error("JSON não encontrado na resposta da IA");
}

const jsonLimpo = match[0];

let itens;
try {
  itens = JSON.parse(jsonLimpo);
} catch (err) {
  console.error("ERRO AO PARSEAR JSON:", jsonLimpo);
  throw new Error("JSON inválido na resposta da IA");
}





    // ===============================
    // 5) Busca Vetorial
    // ===============================
    async function buscarContexto(medicamento: string) {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/avaliamedic/api/busca-vetorial`,
        {
          method: "POST",
          body: JSON.stringify({ query: medicamento }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const json = await resp.json();
      return json.resultados || [];
    }

    // ===============================
    // 6) Análise de cada item — API NOVA
    // ===============================
    // ===============================
// 5) Análise de cada item
// ===============================

// <-- AQUI: criar o array
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
          Retorne APENAS JSON:
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

  const resultado = JSON.parse(analise.choices[0].message.content);

  analiseFinal.push({
    ...item,
    status: resultado.status,
    motivo: resultado.motivo,
  });
}


// ===============================
// 8) Salvar itens individualmente
// ===============================
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


    // ===============================
    // 9) Atualizar status
    // ===============================
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
