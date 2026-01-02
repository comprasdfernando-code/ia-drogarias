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

async function atualizarStatus(prescricaoId: string, status: string, extra?: any) {
  const payload = extra ? { status, ...extra } : { status };
  const { error } = await supabase.from("prescricoes").update(payload).eq("id", prescricaoId);
  if (error) console.error("❌ ERRO atualizando status:", status, error.message);
}

function asNumberOrNull(v?: string | null) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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
  } catch (e) {
    console.error("❌ Erro gerarParecer:", e);
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
    const idade = asNumberOrNull(form.get("idade") as string);
    const peso = asNumberOrNull(form.get("peso") as string);
    const arquivo = form.get("arquivo") as File;

    if (!arquivo) {
      return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
    }

    // (opcional) bloquear PDF por enquanto (OCR é por imagem)
    if (arquivo.type === "application/pdf") {
      return NextResponse.json(
        { error: "Por enquanto, envie foto (JPG/PNG). PDF ainda não suportado." },
        { status: 400 }
      );
    }

    // ===============================
    // 1) UPLOAD
    // ===============================
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const safeName = arquivo.name?.replace(/[^\w.\-() ]/g, "_") || "arquivo.jpg";
    const fileName = `prescricoes/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("avaliamedic")
      .upload(fileName, buffer, {
        contentType: arquivo.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError.message);
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
      console.error("❌ Erro criar prescrição:", prescError?.message);
      return NextResponse.json(
        { error: "Erro ao registrar prescrição", details: prescError?.message },
        { status: 500 }
      );
    }

    prescricaoId = prescricao.id;
    console.log("✅ prescricaoId:", prescricaoId);

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
              { type: "text", text: "Leia a prescrição médica e transcreva todo o texto legível:" },
              { type: "image_url", image_url: { url: arquivo_url } },
            ],
          },
        ],
      });

      textoOCR = ocr.choices[0].message.content || "";
    } catch (e) {
      console.error("❌ OCR falhou:", e);
      await atualizarStatus(prescricaoId, "erro_ocr");
      return NextResponse.json(
        { error: "Falha ao processar OCR", prescricao_id: prescricaoId },
        { status: 500 }
      );
    }

    // salva OCR no banco
    const { error: upOcrErr } = await supabase
      .from("prescricoes")
      .update({ texto_ocr: textoOCR })
      .eq("id", prescricaoId);

    if (upOcrErr) {
      console.error("❌ Erro salvando texto_ocr:", upOcrErr.message);
      // não derruba o fluxo, mas loga
    }

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
Você é uma IA especialista em farmacologia hospitalar.
Extraia MEDICAMENTOS mesmo quando o texto está incompleto/confuso (OCR ruim).

REGRAS:
- Extraia medicamento, dose, via e frequência quando possível.
- Se a via não aparecer, use "não informada".
- Se a frequência não aparecer, deixe "".
- Ignore cabeçalhos e dados administrativos.

RETORNE APENAS JSON no formato:

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
      console.error("❌ Extração falhou:", e);
      await atualizarStatus(prescricaoId, "erro_extracao");
      return NextResponse.json(
        { error: "Falha ao extrair itens", prescricao_id: prescricaoId },
        { status: 500 }
      );
    }

    // ===============================
    // 5) VALIDAR ITENS
    // ===============================
    const itensValidos = (itens || [])
      .map((x) => ({
        medicamento: (x?.medicamento || "").toString().trim(),
        dose: (x?.dose || "").toString().trim(),
        via: (x?.via || "não informada").toString().trim() || "não informada",
        frequencia: (x?.frequencia || "").toString().trim(),
      }))
      .filter((x) => x.medicamento.length > 0);

    if (itensValidos.length === 0) {
      await atualizarStatus(prescricaoId, "sem_itens", { itens_count: 0 });

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
    // 6) SALVAR ITENS + PARECER (COM ERRO CHECK)
    // ===============================
    let salvos = 0;
    const errosInsert: string[] = [];

    for (const item of itensValidos) {
      const parecer = await gerarParecer(item);

      const payload = {
        prescricao_id: prescricaoId,
        medicamento: item.medicamento,
        dose: item.dose,
        via: item.via,
        frequencia: item.frequencia,
        status: parecer.status,
        motivo: parecer.motivo,
      };

      const { error: insErr } = await supabase.from("itens_prescricao").insert(payload);

      if (insErr) {
        console.error("❌ Erro insert item:", insErr.message, payload);
        errosInsert.push(insErr.message);
      } else {
        salvos++;
      }
    }

    // Se nada salvou, não pode marcar parecer_concluido
    if (salvos === 0) {
      await atualizarStatus(prescricaoId, "erro_salvar_itens", {
        itens_count: 0,
        erro_detalhe: errosInsert.slice(0, 1)[0] || "Falha ao salvar itens",
      });

      return NextResponse.json(
        {
          sucesso: false,
          prescricao_id: prescricaoId,
          status: "erro_salvar_itens",
          error: "Falha ao salvar itens no banco",
        },
        { status: 500 }
      );
    }

    // Conta itens no banco (garantia)
    const { count } = await supabase
      .from("itens_prescricao")
      .select("*", { count: "exact", head: true })
      .eq("prescricao_id", prescricaoId);

    const itensCountFinal = count ?? salvos;

    // ===============================
    // 7) FINAL
    // ===============================
    await atualizarStatus(prescricaoId, "parecer_concluido", { itens_count: itensCountFinal });

    // ✅ SEMPRE devolve prescricao_id
    return NextResponse.json(
      {
        sucesso: true,
        prescricao_id: prescricaoId,
        status: "parecer_concluido",
        itens_count: itensCountFinal,
        avisos: errosInsert.length ? ["Alguns itens falharam ao salvar."] : [],
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ ERRO GERAL:", err);

    if (prescricaoId) {
      await atualizarStatus(prescricaoId, "erro_geral", {
        erro_detalhe: err?.message || "Erro interno",
      });
    }

    return NextResponse.json(
      { error: err?.message || "Erro interno", prescricao_id: prescricaoId },
      { status: 500 }
    );
  }
}
