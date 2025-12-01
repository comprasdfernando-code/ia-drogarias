export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      prescricao_id,
      status_final,
      parecer,
      orientacao_enfermagem,
      observacao_medico,
      criado_por,
    } = body;

    if (!prescricao_id) {
      return NextResponse.json(
        { error: "ID da prescrição é obrigatório" },
        { status: 400 }
      );
    }

    // 1. Salvar parecer no banco
    const { error: insertError } = await supabase
      .from("parecer_farmaceutico")
      .insert({
        prescricao_id,
        status_final,
        parecer,
        orientacao_enfermagem,
        observacao_medico,
        criado_por,
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // 2. Atualizar status da prescrição
    const { error: updateError } = await supabase
      .from("prescricoes")
      .update({
        status: "finalizado",
      })
      .eq("id", prescricao_id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ sucesso: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro inesperado" },
      { status: 500 }
    );
  }
}
