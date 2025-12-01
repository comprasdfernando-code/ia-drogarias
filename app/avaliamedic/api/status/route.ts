export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const prescricao_id = searchParams.get("prescricao_id");

  if (!prescricao_id) {
    return NextResponse.json({ error: "ID não informado" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("prescricoes")
    .select("status")
    .eq("id", prescricao_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: data.status });
}
