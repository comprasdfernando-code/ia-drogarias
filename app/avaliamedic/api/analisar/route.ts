export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ============================================================
// 0) CLIENTES SUPABASE + OPENAI
// ============================================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ============================================================
// ROTA PRINCIPAL — POST
// ============================================================
export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const setor = form.get("setor") as string;
    const idade = form.get("idade") as string;
    const peso = form.get("peso") as string;
    const arquivo = form.get("arquivo") as unknown as File;

    if (!arquivo) {
      return NextResponse.json({ error: "Arquivo não recebido." }, { status: 400 });
    }

    // ============================================================
    // 1) UPLOAD DO ARQUIVO NO STORAGE
    // ============================================================
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

    // ============================================================
    // 2) REGISTRAR PRESCRIÇÃO NO BANCO
    // ============================================================
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

    // ============================================================
    // 3) OCR — GPT-4o Vision (2025)
    // ============================================================
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
            { type: "text", text: "Leia totalmente esta prescrição e extraia todo o conteúdo legível." },
            { type: "image_url", image_url: { url: arquivo_url } }
          ]
        }
      ]
    });

    const textoPrescricao = ocr.choices[0].message.content;

    // ============================================================
    // 4) EXTRAÇÃO DE ITENS
    // ============================================================
    const extracao = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
            Extraia os itens da prescrição. Retorne estritamente JSON:
            [
              { "medicamento": "", "dose": "", "via": "", "frequencia": "" }
            ]
          `
        },
        {
          role: "user",
          content: textoPrescricao
        }
      ]
    });

    const itens = JSON.parse(extracao.choices[0].message.content);

    // ============================================================
    // 5) FUNÇÃO PARA BUSCA VETORIAL
    // ============================================================
    async function buscarContexto(medicamento: string) {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/avaliamedic/api/busca-vetorial`,
        {
          method: "POST",
          body: JSON.stringify({ query: medicamento }),
          headers: { "Content-Type": "application/json" }
        }
      );

      const json = await resp.json();
      return json.resultados || [];
    }

    // ============================================================
    // 6) ANÁLISE CLÍNICA DE CADA ITEM
    // ============================================================
    const analiseFinal: any[] = [];

    for (const item of itens) {
      const contexto = await buscarContexto(item.medicamento);

      const analise = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
              Você é uma IA farmacêutica clínica hospitalar.
              Analise o item considerando:
              - protocolos hospitalares
              - peso do paciente (mg/kg): ${peso}
              - vias seguras
              - incompatibilidades
              - riscos em UTI / neonatal / obstetrícia
              Retorne estritamente JSON:
              {
                "status": "ok" | "atencao" | "risco_alto" | "risco_grave",
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

              CONTEXTO:
              ${contexto.map((c: any) => c.conteudo).join("\n\n")}
            `
          }
        ]
      });

      const resultado = JSON.parse(analise.choices[0].message.content);

      analiseFinal.push({
        ...item,
        status: resultado.status,
        motivo: resultado.motivo
      });
    }

    // ============================================================
    // 7) SALVAR RELATÓRIO
    // ============================================================
    await supabase.from("analises_ia").insert({
      prescricao_id: prescricaoId,
      relatorio_json: analiseFinal,
      alertas: analiseFinal.filter((i) => i.status !== "ok")
    });

    // ============================================================
    // 8) SALVAR ITENS
    // ============================================================
    for (const item of analiseFinal) {
      await supabase.from("itens_prescricao").insert({
        prescricao_id: prescricaoId,
        medicamento: item.medicamento,
        dose: item.dose,
        via: item.via,
        frequencia: item.frequencia,
        risco: item.status
      });
    }

    // ============================================================
    // 9) STATUS FINAL
    // ============================================================
    await supabase
      .from("prescricoes")
      .update({ status: "aguardando_parecer" })
      .eq("id", prescricaoId);

    return NextResponse.json({
      sucesso: true,
      prescricao_id: prescricaoId
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erro desconhecido" },
      { status: 500 }
    );
  }
}
