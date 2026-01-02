export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const prescricao_id = searchParams.get("prescricao_id");

    if (!prescricao_id) {
      return NextResponse.json(
        { error: "prescricao_id não informado" },
        { status: 400 }
      );
    }

    // 🔹 Prescrição
    const { data: prescricao, error: erroPresc } = await supabase
      .from("prescricoes")
      .select("id,setor,idade,peso,status,criado_em")
      .eq("id", prescricao_id)
      .single();

    if (erroPresc || !prescricao) {
      return NextResponse.json(
        { error: "Prescrição não encontrada" },
        { status: 404 }
      );
    }

    // 🔹 Itens
    const { data: itens, error: erroItens } = await supabase
      .from("itens_prescricao")
      .select("id,medicamento,dose,via,frequencia,risco")
      .eq("prescricao_id", prescricao_id)
      .order("id", { ascending: true });

    if (erroItens) {
      return NextResponse.json(
        { error: erroItens.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      prescricao,
      relatorio: itens || [],
      itens_count: (itens || []).length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erro interno" },
      { status: 500 }
    );
  }
}
