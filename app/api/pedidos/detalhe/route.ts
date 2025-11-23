import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const { data: venda } = await supabase
    .from("vendas_site")
    .select("*")
    .eq("id", id)
    .single();

  const { data: itens } = await supabase
    .from("vendas_site_itens")
    .select("*")
    .eq("venda_id", id);

  return NextResponse.json({
    ...venda,
    itens
  });
}
