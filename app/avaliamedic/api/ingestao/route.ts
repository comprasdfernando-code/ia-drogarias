import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    // Receber o FormData
    const form = await req.formData();

    const categoria = form.get("categoria") as string;
    const arquivo = form.get("arquivo") as File | null;

    if (!arquivo) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // ================================
    // 1) Upload do arquivo no Supabase
    // ================================

    const fileBytes = Buffer.from(await arquivo.arrayBuffer());
    const fileName = `${categoria}/${Date.now()}-${arquivo.name}`;

    const { data: upload, error: uploadError } = await supabase.storage
      .from("avaliamedic-enciclopedia")
      .upload(fileName, fileBytes);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const arquivo_url =
      process.env.NEXT_PUBLIC_SUPABASE_URL +
      `/storage/v1/object/public/avaliamedic-enciclopedia/${fileName}`;

    // ================================
    // 2) OCR + Extração de Texto
    // ================================

    const ocr = await openai.chat.completions.create({
      model: "gpt-4o-mini-vision",
      messages: [
        {
          role: "system",
          content:
            "Você é uma IA especializada em ler PDFs clínicos, protocolos e bulas. Extraia SOMENTE o texto limpo."
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Faça OCR completo deste arquivo PDF."
            },
            {
              type: "input_file",
              file_url: arquivo_url
            }
          ]
        }
      ]
    });

    const textoExtraido = ocr.choices[0].message.content;

    // ================================
    // 3) Salvar texto no banco
    // ================================

    const { data: conhecimento, error: insertError } = await supabase
      .from("conhecimento_clinico")
      .insert({
        titulo: arquivo.name.replace(".pdf", ""),
        categoria,
        arquivo_url,
        texto_extraido: textoExtraido
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const conhecimentoId = conhecimento.id;

    // ================================
    // 4) Gerar Embeddings
    // ================================

    // quebra o texto em blocos de 500 tokens
    const blocos = textoExtraido.match(/(.|[\r\n]){1,800}/g) || [];

    for (const bloco of blocos) {
      const embeddingRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: bloco
      });

      const embedding = embeddingRes.data[0].embedding;

      await supabase.from("conhecimento_vetores").insert({
        conhecimento_id: conhecimentoId,
        conteudo: bloco,
        embedding
      });
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: "Arquivo ingerido com sucesso",
      conhecimento_id: conhecimentoId
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro desconhecido" },
      { status: 500 }
    );
  }
}
