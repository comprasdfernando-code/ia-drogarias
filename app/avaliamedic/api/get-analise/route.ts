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

  const { data, error } = await supabase
    .from("analises_ia")
    .select("*")
    .eq("prescricao_id", prescricao_id)
    .single();

  return NextResponse.json(data || {});
}
