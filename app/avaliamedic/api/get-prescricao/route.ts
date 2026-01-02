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
      return NextResponse.json({ error: "ID não enviado" }, { status: 400 });
    }

    // 1) Buscar prescrição
    const { data: prescricao, error: erroPresc } = await supabase
      .from("prescricoes")
      .select("*")
      .eq("id", prescricao_id)
      .single();

    if (erroPresc) {
      return NextResponse.json({ error: erroPresc.message }, { status: 500 });
    }

    // 2) Buscar itens vinculados à prescrição
    const { data: itens, error: erroItens } = await supabase
      .from("itens_prescricao")
      .select("*")
      .eq("prescricao_id", prescricao_id)
      .order("criado_em", { ascending: true }); // se não existir criado_em, pode remover

    if (erroItens) {
      return NextResponse.json({ error: erroItens.message }, { status: 500 });
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
