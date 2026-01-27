import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { chamadoId, profissionalId, profissionalNome, profissionalUid } = await req.json();

    if (!chamadoId || !profissionalId || !profissionalUid) {
      return NextResponse.json({ ok: false, error: "Dados inválidos" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ precisa no env
    );

    // trava concorrência: só aceita se ainda estiver procurando ou SOLICITADO
    const { data, error } = await supabase
      .from("chamados")
      .update({
        status: "aceito",
        profissional_id: profissionalId,
        profissional_nome: profissionalNome || "Profissional",
        profissional_uid: profissionalUid,
      })
      .eq("id", chamadoId)
      .in("status", ["procurando", "SOLICITADO"])
      .is("profissional_uid", null)
      .select("id,status,profissional_uid")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ ok: false, reason: "ja_aceito" }, { status: 409 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
