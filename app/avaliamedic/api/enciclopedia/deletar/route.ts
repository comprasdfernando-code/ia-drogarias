export const dynamic = "force-dynamic";
export const runtime = "nodejs";


import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);


export async function POST(req: Request) {
  const { id, arquivo_url } = await req.json();

  if (!id || !arquivo_url) {
    return NextResponse.json(
      { error: "ID ou arquivo não informado" },
      { status: 400 }
    );
  }

  // Extrair o path exato do arquivo
  const path = arquivo_url.split("/storage/v1/object/public/avaliamedic-enciclopedia/")[1];

  // Apagar do storage
  await supabase.storage
    .from("avaliamedic-enciclopedia")
    .remove([path]);

  // Apagar do banco
  await supabase
    .from("conhecimento_clinico")
    .delete()
    .eq("id", id);

  return NextResponse.json({ sucesso: true });
}
