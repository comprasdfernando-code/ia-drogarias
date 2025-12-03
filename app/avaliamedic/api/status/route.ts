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
    const id = searchParams.get("prescricao_id");

    if (!id) {
      return NextResponse.json(
        { error: "prescricao_id não informado" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("prescricoes")
      .select("status")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Falha ao buscar status" },
        { status: 500 }
      );
    }

    const concluido = data.status === "parecer_concluido";

    return NextResponse.json({
      status: data.status,
      concluido
    });

  } catch (e) {
    return NextResponse.json(
      { error: "Erro inesperado" },
      { status: 500 }
    );
  }
}
