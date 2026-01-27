import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      id,
      nome,
      telefone,
      email,
      bloqueado,
      bloqueado_motivo,
    } = body as {
      id: string;
      nome?: string | null;
      telefone?: string | null;
      email?: string | null;
      bloqueado?: boolean;
      bloqueado_motivo?: string | null;
    };

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const payload: any = {};
    if (typeof nome !== "undefined") payload.nome = nome;
    if (typeof telefone !== "undefined") payload.telefone = telefone;
    if (typeof email !== "undefined") payload.email = email;

    if (typeof bloqueado === "boolean") {
      payload.bloqueado = bloqueado;
      payload.bloqueado_em = bloqueado ? new Date().toISOString() : null;
      payload.bloqueado_motivo = bloqueado ? (bloqueado_motivo || "Bloqueado pelo administrador") : null;
    }

    const { error } = await supabaseAdmin
      .from("usuarios")
      .update(payload)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro inesperado" }, { status: 500 });
  }
}
