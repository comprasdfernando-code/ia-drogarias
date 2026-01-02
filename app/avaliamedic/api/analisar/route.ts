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
    if (json && Array.isArray((json as any).itens)) return (json as any).itens;

    return [];
  } catch {
    return [];
  }
}

async function atualizarStatus(prescricaoId: string, status: string) {
  await supabase.from("prescricoes").update({ status }).eq("id", prescricaoId);
}

// ===============================
// GERAR PARECER -> retorna SOMENTE "risco"
// (porque sua tabela itens_prescricao tem coluna "risco")
// ===============================
async function gerarParecer(item: {
  medicamento: string;
  dose?: string;
  via?: string;
  frequencia?: string;
}): Promise<{ risco: string }> {
  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Você é um farmacêutico clínico hospitalar.

Classifique o risco do item e responda SOMENTE JSON:

{ "risco": "" }

Use APENAS estes valores (snake_case):
ok
dose_alta
dose_baixa
frequencia_inadequada
via_inadequada
monitoramento
risco_aumentado

Se não der pra concluir, use "monitoramento".
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

    const risco = typeof json?.risco === "string" ? json.risco.trim() : "";
    const permitido = new Set([
      "ok",
      "dose_alta",
      "dose_baixa",
      "frequencia_inadequada",
      "via_inadequada",
      "monitoramento",
      "risco_aumentado",
    ]);

    return { risco: permitido.has(risco) ? risco : "monitoramento" };
  } catch {
    return { risco: "monitoramento" };
  }
}

// ===============================
// POST /avaliamedic/api/analisar
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

    // ⚠️ PDF: só funciona se você converter PDF -> imagem.
    // Se ainda não implementou conversão, bloqueia para não falhar no OCR visual.
    if (arquivo.type === "application/pdf") {
      return NextResponse.json(
        {
          error:
            "PDF ainda não suportado nesta rota. Envie uma foto (JPG/PNG) por enquanto.",
        },
        { status: 400 }
      );
    }

    const idade = idadeRaw ? Number(idadeRaw) : null;
    const peso = pesoRaw ? Number(pesoRaw) : null;

    // ===============================
    // 1) UPLOAD STORAGE
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
    // 2) CRIAR PRESCRIÇÃO
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
    // 3) OCR TURBO (visão)
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
Leia receitas manuscritas, borradas, inclinadas ou com baixa qualidade.
Retorne TODO o texto legível, mantendo quebras de linha.
NÃO interprete, NÃO resuma, NÃO explique.
`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Leia a prescrição médica na imagem:" },
              { type: "image_url", image_url: { url: arquivo_url } },
            ],
          },
        ],
      });

      textoOCR = ocr.choices[0].message.content || "";
    } catch (e) {
      await atualizarStatus(prescricaoId, "erro_ocr");
      return NextResponse.json(
        { error: "Falha ao processar OCR", prescricao_id: prescricaoId },
        { status: 500 }
      );
    }

    // salva o OCR no banco (você confirmou que tem texto_ocr na tabela prescricoes)
    await supabase
      .from("prescricoes")
      .update({ texto_ocr: textoOCR })
      .eq("id", prescricaoId);

    // ===============================
    // 4) EXTRAIR ITENS (robusto)
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
Extraia medicamentos mesmo com OCR ruim (abreviações, texto quebrado, incompleto).

REGRAS:
- Se não tiver via: "não informada"
- Se não tiver frequência: deixe "" (vazio)
- Se não tiver dose: deixe "" (vazio)
- Ignore cabeçalhos (ex: "Tipo de uso", "Hospital", "Receituário", CRM etc.)

RETORNE APENAS JSON:

[
  { "medicamento": "", "dose": "", "via": "", "frequencia": "" }
]

NÃO escreva nada fora do JSON.
`,
          },
          { role: "user", content: `Texto OCR:\n${textoOCR}` },
        ],
      });

      const bruto = limparJSON(extracao.choices[0].message.content || "");
      itens = parseJSONSeguro(bruto);
    } catch (e) {
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

      // ✅ sempre devolve prescricao_id pro front poder abrir relatório
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
    // 6) SALVAR ITENS + RISCO
    // (coluna existente no seu schema: risco)
    // ===============================
    for (const item of itensValidos) {
      const medicamento = (item.medicamento || "").trim();
      if (!medicamento) continue;

      const payload = {
        medicamento,
        dose: item.dose || "",
        via: item.via || "não informada",
        frequencia: item.frequencia || "",
      };

      const parecer = await gerarParecer(payload);

      const { error: insertError } = await supabase
        .from("itens_prescricao")
        .insert({
          prescricao_id: prescricaoId,
          medicamento: payload.medicamento,
          dose: payload.dose,
          via: payload.via,
          frequencia: payload.frequencia,
          risco: parecer.risco, // ✅ ALINHADO AO BANCO
        });

      if (insertError) {
        console.error("❌ ERRO AO INSERIR ITEM:", insertError);
        throw new Error(insertError.message);
      }
    }

    // ===============================
    // 7) FINALIZAR
    // ===============================
    await atualizarStatus(prescricaoId, "parecer_concluido");

    return NextResponse.json(
      {
        sucesso: true,
        prescricao_id: prescricaoId,
        status: "parecer_concluido",
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (prescricaoId) await atualizarStatus(prescricaoId, "erro_geral");

    return NextResponse.json(
      { error: err?.message || "Erro interno", prescricao_id: prescricaoId },
      { status: 500 }
    );
  }
}
