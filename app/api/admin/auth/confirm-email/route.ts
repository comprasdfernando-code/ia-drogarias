import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string };

    if (!email) {
      return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1) encontra o usuário no Auth
    // (listUsers é paginado; aqui buscamos nas primeiras 1000 — suficiente pro seu cenário agora)
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }

    const user = list?.users?.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado no Auth" }, { status: 404 });
    }

    // 2) confirma o e-mail
    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, user_id: user.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro inesperado" }, { status: 500 });
  }
}
