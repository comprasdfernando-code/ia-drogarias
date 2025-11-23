import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data } = await supabase
    .from("vendas_site")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json(data);
}
