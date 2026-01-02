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

function parseJSONSeguro(texto: string): any[] {
  try {
    const json = JSON.parse(texto);

    // IA pode retornar: [ ... ]
    if (Array.isArray(json)) return json;

    // ou: { itens: [ ... ] }
    if (json && Array.isArray(json.itens)) return json.itens;

    return [];
  } catch {
    return [];
  }
}

async function atualizarStatus(prescricaoId: string, status: string) {
  await supabase.from("prescricoes").update({ status }).eq("id", prescricaoId);
}

// ===============================
// GERAR PARECER
// ===============================
async function gerarParecer(item: {
  medicamento: string;
  dose?: string;
  via?: string;
  frequencia?: string;
}) {
  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Você é um farmacêutico clínico hospitalar.
Responda SOMENTE JSON (sem texto):

{
  "status": "",
  "motivo": ""
}

O motivo deve ser curto, técnico e objetivo.
`,
        },
        {
          role: "user",
          content: `
Medicamento: ${item.medicamento || ""}
Dose: ${item.dose || ""}
Via: ${item.via || ""}
Frequência: ${item.frequencia || ""}
`,
        },
      ],
    });

    const bruto = limparJSON(resp.choices[0].message.content || "");
    const json = JSON.parse(bruto);

    if (json?.status && json?.motivo) return json;

    return {
      status: "Indefinido",
      motivo: "Não foi possível interpretar automaticamente.",
    };
  } catch {
    return {
      status: "Indefinido",
      motivo: "Falha na análise automática.",
    };
  }
}

// ===============================
// POST
// ===============================
export async function POST(req: Request) {
  let prescricaoId: string | null = null;

  try {
    const form = await req.formData();
    const setor = (form.get("setor") as string) || "";
    const idadeRaw = form.get("idade") as string;
    const pesoRaw = form.get("peso") as string;
    const arquivo = form.get("arquivo") as File;

    if (!arquivo) {
      return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
    }

    // Se você quiser aceitar PDF de verdade, precisa converter PDF->imagem.
    // Por enquanto, é melhor bloquear (senão o OCR por imagem vai falhar).
    if (arquivo.type === "application/pdf") {
      return NextResponse.json(
        { error: "Por enquanto, envie foto (JPG/PNG). PDF ainda não suportado." },
        { status: 400 }
      );
    }

    const idade = idadeRaw ? Number(idadeRaw) : null;
    const peso = pesoRaw ? Number(pesoRaw) : null;

    // ===============================
    // 1) UPLOAD
    // ===============================
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const fileName = `prescricoes/${Date.now()}-${arquivo.name}`;

    const { error: uploadError } = await supabase.storage
      .from("avaliamedic")
      .upload(fileName, buffer, {
        contentType: arquivo.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Erro ao enviar arquivo", details: uploadError.message },
        { status: 500 }
      );
    }

    const arquivo_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avaliamedic/${fileName}`;

    // ===============================
    // 2) REGISTRO
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
      .select("id")
      .single();

    if (prescError || !prescricao?.id) {
      return NextResponse.json(
        { error: "Erro ao registrar prescrição", details: prescError?.message },
        { status: 500 }
      );
    }

    prescricaoId = prescricao.id;

    // ===============================
    // 3) OCR TURBO
    // ===============================
    let textoOCR = "";

    try {
      const ocr = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
Você é um OCR médico avançado.
Leia receitas manuscritas, borradas ou escaneadas.
Retorne TODO o texto legível, sem interpretar.
`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Leia a prescrição médica:" },
              { type: "image_url", image_url: { url: arquivo_url } },
            ],
          },
        ],
      });

      textoOCR = ocr.choices[0].message.content || "";
    } catch {
      await atualizarStatus(prescricaoId, "erro_ocr");
      return NextResponse.json(
        { error: "Falha ao processar OCR", prescricao_id: prescricaoId },
        { status: 500 }
      );
    }

    await supabase
      .from("prescricoes")
      .update({ texto_ocr: textoOCR })
      .eq("id", prescricaoId);

    // ===============================
    // 4) EXTRAÇÃO
    // ===============================
    let itens: any[] = [];

    try {
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

Não escreva nada fora do JSON.
`,
          },
          { role: "user", content: textoOCR },
        ],
      });

      const bruto = limparJSON(extracao.choices[0].message.content || "");
      itens = parseJSONSeguro(bruto);
    } catch {
      await atualizarStatus(prescricaoId, "erro_extracao");
      return NextResponse.json(
        { error: "Falha ao extrair itens", prescricao_id: prescricaoId },
        { status: 500 }
      );
    }

    // ===============================
    // 5) VALIDAR ITENS
    // ===============================
    const itensValidos = (itens || []).filter(
      (x) => x && typeof x.medicamento === "string" && x.medicamento.trim()
    );

    if (itensValidos.length === 0) {
      await atualizarStatus(prescricaoId, "sem_itens");

      // ✅ IMPORTANTE: devolve prescricao_id pro front não travar
      return NextResponse.json(
        {
          sucesso: true,
          prescricao_id: prescricaoId,
          status: "sem_itens",
          motivo: "Nenhum medicamento identificado",
        },
        { status: 200 }
      );
    }

    // ===============================
    // 6) SALVAR ITENS + PARECER
    // ===============================
    for (const item of itensValidos) {
      const medicamento = (item.medicamento || "").trim();

      const payload = {
        prescricao_id: prescricaoId,
        medicamento,
        dose: item.dose || "",
        via: item.via || "não informada",
        frequencia: item.frequencia || "",
      };

      const parecer = await gerarParecer(payload);

      await supabase.from("itens_prescricao").insert({
        ...payload,
        status: parecer.status,
        motivo: parecer.motivo,
      });
    }

    // ===============================
    // 7) FINAL
    // ===============================
    await atualizarStatus(prescricaoId, "parecer_concluido");

    // ✅ AGORA SEMPRE devolve prescricao_id
    return NextResponse.json(
      { sucesso: true, prescricao_id: prescricaoId, status: "parecer_concluido" },
      { status: 200 }
    );
  } catch (err: any) {
    // Se já criou prescrição, marca erro geral
    if (prescricaoId) await atualizarStatus(prescricaoId, "erro_geral");

    return NextResponse.json(
      { error: err?.message || "Erro interno", prescricao_id: prescricaoId },
      { status: 500 }
    );
  }
}
