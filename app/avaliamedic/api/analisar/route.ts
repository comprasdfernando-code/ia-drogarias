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
// HELPERS
// ===============================
function limparJSON(texto: string): string {
  if (!texto) return "";
  return texto.replace(/json/gi, "").replace(/```/g, "").trim();
}

function parseJSONSeguro(texto: string): any {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

// ==========================================================
// 🔥 Função que gera status + motivo automaticamente
// ==========================================================
async function gerarParecer(item: any) {
  try {
    const resposta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Você é um farmacêutico clínico. 
Analise o item a seguir e responda SOMENTE JSON:

{
 "status": "",
 "motivo": ""
}

Status pode ser: "Adequado", "Dose alta", "Dose baixa", 
"Frequência inadequada", "Via inadequada",
"Precisa de monitoramento", "Risco aumentado", etc.

Motivo deve ser curto, objetivo e técnico.
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

    const json = parseJSONSeguro(bruto);

    if (json && json.status)
      return json;

    return {
      status: "Indefinido",
      motivo: "Não foi possível interpretar."
    };

  } catch {
    return {
      status: "Indefinido",
      motivo: "Erro ao gerar parecer."
    };
  }
}

// ==========================================================
// 🔥 ROTA PRINCIPAL
// ==========================================================
export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const setor = form.get("setor") as string;
    const idade = form.get("idade") as string;
    const peso = form.get("peso") as string;
    const arquivo: File = form.get("arquivo") as any;

    if (!arquivo) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    // ===============================
    // 1) Upload da imagem no Storage
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
      return NextResponse.json(
        { error: "Erro ao enviar arquivo" },
        { status: 500 }
      );
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
        status: "em_analise"
      })
      .select()
      .single();

    if (prescError) {
      return NextResponse.json(
        { error: "Erro ao registrar prescrição" },
        { status: 500 }
      );
    }

    const prescricaoId = prescricao.id;

    // ===============================
    // 3) OCR - Ler texto da imagem
    // ===============================
    let textoPrescricao = "";

    try {
      const ocr = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Extraia todo o texto legível contido na prescrição. Retorne somente o texto."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Leia a prescrição:" },
              { type: "image_url", image_url: { url: arquivo_url } }
            ]
          }
        ]
      });

      textoPrescricao = ocr.choices[0].message.content || "";

      // 🔥 SALVAR O TEXTO DO OCR !!!
      await supabase
        .from("prescricoes")
        .update({ texto_ocr: textoPrescricao })
        .eq("id", prescricaoId);

    } catch (err) {
      await supabase
        .from("prescricoes")
        .update({ status: "erro_ocr" })
        .eq("id", prescricaoId);

      return NextResponse.json(
        { error: "Falha ao processar OCR" },
        { status: 500 }
      );
    }

    // ===============================
    // 4) Extrair os itens
    // ===============================
    let itens: any[] = [];

    try {
      const extracao = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: `
Você é uma IA especialista em farmacologia hospitalar.
Seu trabalho é extrair MEDICAMENTOS mesmo quando o texto está incompleto, confuso,
misturado ou mal formatado (como OCR de receita médica).

REGRAS IMPORTANTES:
- Identifique medicamento mesmo com texto parcial (ex: "Amox 500" → Amoxicilina 500mg)
- Identifique dose mesmo se vier sem unidade (ex: "1" → "1 comprimido")
- Identifique frequência mesmo se vier truncada (ex: "8 e" → "8/8h")
- Se a via não aparecer, coloque via = "não informada"
- Formate tudo de forma coerente e clínica.
- Ignore frases como "Tipo de uso", "Interno", "Hospital", "Uso contínuo", etc.

RETORNE APENAS JSON NO FORMATO:

[
  {
    "medicamento": "",
    "dose": "",
    "via": "",
    "frequencia": ""
  }
]

NÃO escreva explicações.
NÃO escreva nada fora do JSON.
`
    },
    {
      role: "user",
      content: `Texto da receita (OCR): ${textoPrescricao}`
    }
  ]
});

let bruto = extracao.choices[0].message.content || "";
bruto = limparJSON(bruto);

itens = parseJSONSeguro(bruto) || [];


    } catch {
      await supabase
        .from("prescricoes")
        .update({ status: "erro_extracao" })
        .eq("id", prescricaoId);

      return NextResponse.json(
        { error: "Falha ao extrair itens" },
        { status: 500 }
      );
    }

    // ===============================
    // 5) Gerar parecer e salvar os itens
    // ===============================
    for (const item of itens) {
      const medicamento = item.medicamento || "";
      if (!medicamento) continue;

      const parecer = await gerarParecer(item);

      await supabase.from("itens_prescricao").insert({
        prescricao_id: prescricaoId,
        medicamento,
        dose: item.dose || "",
        via: item.via || "",
        frequencia: item.frequencia || "",
        status: parecer.status,
        motivo: parecer.motivo
      });
    }

    // ===============================
    // 6) Finalizar
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
    return NextResponse.json(
      { error: err?.message || "Erro desconhecido" },
      { status: 500 }
    );
  }
}
