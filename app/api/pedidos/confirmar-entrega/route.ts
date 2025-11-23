import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const body = await req.json();
  const id = body.id;

  await supabase
    .from("vendas_site")
    .update({ status: "entregue", etapa: 4 })
    .eq("id", id);

  await supabase.from("vendas_site_rastreamento").insert({
    venda_id: id,
    etapa: 4,
    descricao: "Pedido entregue ao cliente"
  });

  return NextResponse.json({ ok: true });
}
