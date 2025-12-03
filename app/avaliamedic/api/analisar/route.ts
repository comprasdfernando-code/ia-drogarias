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
  return texto.replace(/json/gi, "").replace(/``/g, "").trim();
}

function parseJSONSeguro(texto: string): any {
  try {
    return JSON.parse(texto);
  } catch (e) {
    console.error("JSON inválido recebido:", texto);
    throw e;
  }
}

// ======================================================================
// 🚀 GERAR STATUS + MOTIVO AUTOMÁTICO (100% Seguro, nunca quebra)
// ======================================================================
async function gerarParecer(item: any) {
  try {
    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Você é um farmacêutico clínico especialista.
Analise o item abaixo e gere:

{
 "status": "",
 "motivo": ""
}

STATUS deve ser: "Adequado", "Dose alta", "Dose baixa", "Frequência inadequada",
"Via inadequada", "Precisa de monitoramento", "Risco aumentado", etc.

MOTIVO deve ser curto, objetivo, clínico.
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

    let bruto = resposta.choices[0].message.content || "";
    bruto = limparJSON(bruto);

    // 🔥 PATCH de segurança — nunca deixa o JSON quebrar
    try {
      return JSON.parse(bruto);
    } catch (e) {
      console.warn("Parecer não retornou JSON válido:", bruto);
      return {
        status: "Indefinido",
        motivo: "A IA não encontrou dados suficientes para gerar um parecer automático."
      };
    }

  } catch (e) {
    console.error("Erro ao gerar parecer:", e);
    return {
      status: "Indefinido",
      motivo: "Falha ao processar o parecer."
    };
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
      return NextResponse.json({ error: "Arquivo não recebido" }, { status: 400 });
    }

    // ===============================
    // 1) Upload do arquivo no Storage
    // ===============================
    const bytes = await arquivo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `prescricoes/${Date.now()}-${arquivo.name}`;

    const { error: uploadError } = await supabase.storage
      .from("avaliamedic")
      .upload(fileName, buffer, { contentType: arquivo.type || "image/jpeg" });

    if (uploadError) {
      console.error("Erro no upload:", uploadError);
      return NextResponse.json({ error: "Falha ao enviar arquivo." }, { status: 500 });
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

    if (prescError || !prescricao) {
      console.error("Erro criando prescrição:", prescError);
      return NextResponse.json(
        { error: "Falha ao registrar prescrição." },
        { status: 500 }
      );
    }

    const prescricaoId = prescricao.id;

    // ===============================
    // 3) OCR - Ler texto da prescrição
    // ===============================
    let textoPrescricao = "";

    try {
      const ocr = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Transcreva a prescrição com clareza.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Leia esta prescrição:" },
              { type: "image_url", image_url: { url: arquivo_url } }
            ],
          },
        ],
      });

      textoPrescricao = ocr.choices[0].message.content || "";
    } catch (err) {
      console.error("Erro no OCR:", err);
      await supabase.from("prescricoes").update({ status: "erro_ocr" }).eq("id", prescricaoId);
      return NextResponse.json({ error: "Falha no OCR." }, { status: 500 });
    }

    // ===============================
// 4) Extrair itens via IA (VERSÃO CORRIGIDA)
// ===============================
let itens: any[] = [];

try {
  const extracao = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Você é um extrator clínico de prescrições.
Retorne SOMENTE JSON puro.

Formato obrigatório:
[
  {
    "medicamento": "Nome",
    "dose": "Texto",
    "via": "Texto",
    "frequencia": "Texto"
  }
]

NÃO escreva explicações, títulos, comentários, observações.
Retorne apenas o JSON válido.
`
      },
      {
        role: "user",
        content: textoPrescricao
      }
    ],
  });

  let bruto = extracao.choices[0].message.content || "";

  // Remove qualquer coisa antes/depois do JSON
  bruto = bruto
    .replace(/^[^{\[]+/g, "")      // remove texto antes de JSON
    .replace(/[^}\]]+$/g, "")      // remove texto depois do JSON
    .trim();

  const parsed = JSON.parse(bruto);

  if (Array.isArray(parsed)) {
    itens = parsed;
  }
} catch (err) {
  console.error("Erro extraindo itens:", err);
}

// Se itens vier vazio:
if (!itens || itens.length === 0) {
  await supabase
    .from("prescricoes")
    .update({ status: "sem_itens" })
    .eq("id", prescricaoId);

  return NextResponse.json(
    { sucesso: true, prescricao_id: prescricaoId, itens: [] },
    { status: 200 }
  );
}


    // ===============================
    // 5) SALVAR CADA ITEM + PARECER
    // ===============================
    for (const item of itens) {
      const medicamento = item.medicamento || "";
      const dose = item.dose || "";
      const via = item.via || "";
      const frequencia = item.frequencia || "";

      if (!medicamento) continue;

      // 🔥 Gerar parecer seguro
      const parecer = await gerarParecer({
        medicamento,
        dose,
        via,
        frequencia,
      });

      const { error: itemError } = await supabase
        .from("itens_prescricao")
        .insert({
          prescricao_id: prescricaoId,
          medicamento,
          dose,
          via,
          frequencia,
          status: parecer.status,
          motivo: parecer.motivo,
        });

      if (itemError) console.error("Erro salvando item:", itemError);
    }

    // ===============================
    // 6) Finalizar prescrição
    // ===============================
    await supabase
      .from("prescricoes")
      .update({ status: "parecer_concluido" })
      .eq("id", prescricaoId);

    return NextResponse.json(
      { sucesso: true, prescricao_id: prescricaoId },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("ERRO GERAL:", err);
    return NextResponse.json(
      { error: err?.message || "Erro desconhecido." },
      { status: 500 }
    );
  }
}
