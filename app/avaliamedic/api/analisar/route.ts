export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

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
    if (Array.isArray(json)) return json;
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
// GERAR PARECER (risco + motivo)
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
Responda SOMENTE JSON:

{
  "risco": "ok | dose_alta | dose_baixa | frequencia_inadequada | via_inadequada | monitoramento | risco_aumentado",
  "motivo": "curto, técnico e objetivo"
}

Regras:
- Se faltar informação, use "monitoramento".
- Use "ok" se estiver adequado.
- Não escreva nada fora do JSON.
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

    const riscosValidos = [
      "ok",
      "dose_alta",
      "dose_baixa",
      "frequencia_inadequada",
      "via_inadequada",
      "monitoramento",
      "risco_aumentado",
    ];

    const risco = riscosValidos.includes(String(json?.risco || ""))
      ? String(json.risco)
      : "monitoramento";

    const motivo = String(json?.motivo || "Avaliar clinicamente.");

    return { risco, motivo };
  } catch {
    return {
      risco: "monitoramento",
      motivo: "Falha na análise automática; avaliar clinicamente.",
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

    // (PDF real exigiria conversão p/ imagem; por enquanto bloqueia)
    if (arquivo.type === "application/pdf") {
      return NextResponse.json(
        { error: "Por enquanto, envie foto (JPG/PNG). PDF ainda não suportado." },
        { status: 400 }
      );
    }

    const idade = idadeRaw ? Number(idadeRaw) : null;
    const peso = pesoRaw ? Number(pesoRaw) : null;

    // 1) UPLOAD
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

    // 2) REGISTRO
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

    // 3) OCR TURBO
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

    // 4) EXTRAÇÃO
    let itens: any[] = [];
    try {
      const extracao = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
Você é uma IA especialista em farmacologia hospitalar.
Extraia MEDICAMENTOS mesmo quando o texto está incompleto, confuso ou mal formatado (OCR ruim).

RETORNE APENAS JSON:

[
  { "medicamento": "", "dose": "", "via": "", "frequencia": "" }
]

Regras:
- Se a via não aparecer: via = "não informada"
- Não escreva nada fora do JSON.
`,
          },
          { role: "user", content: `Texto OCR:\n${textoOCR}` },
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

    // 5) VALIDAR ITENS
    const itensValidos = (itens || []).filter(
      (x) => x && typeof x.medicamento === "string" && x.medicamento.trim()
    );

    if (itensValidos.length === 0) {
      await atualizarStatus(prescricaoId, "sem_itens");
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

    // 6) SALVAR ITENS + PARECER
    for (const item of itensValidos) {
      const medicamento = (item.medicamento || "").trim();

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
          risco: parecer.risco,     // ✅ coluna existe
          motivo: parecer.motivo,   // ✅ coluna criada no SQL
        });

      if (insertError) {
        await atualizarStatus(prescricaoId, "erro_salvar_itens");
        return NextResponse.json(
          {
            error: "Falha ao salvar itens no banco",
            details: insertError.message,
            prescricao_id: prescricaoId,
          },
          { status: 500 }
        );
      }
    }

    // 7) FINAL
    await atualizarStatus(prescricaoId, "parecer_concluido");

    return NextResponse.json(
      { sucesso: true, prescricao_id: prescricaoId, status: "parecer_concluido" },
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
