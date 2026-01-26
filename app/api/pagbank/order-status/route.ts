import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("SUPABASE_URL não configurado");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_KEY não configurado");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json({ error: "order_id obrigatório" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("vendas_site")
      .select("id,status,pagbank_id")
      .eq("id", String(order_id))
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Erro ao consultar", detalhe: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, venda: data || null });
  } catch (e: any) {
    return NextResponse.json({ error: "Falha geral", detalhe: String(e?.message || e) }, { status: 500 });
  }
}
