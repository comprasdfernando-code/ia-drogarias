import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  const { data } = await supabase
    .from("vendas_site")
    .select("status")
    .eq("id", orderId)
    .single();

  return NextResponse.json({ status: data?.status || "pendente" });
}
