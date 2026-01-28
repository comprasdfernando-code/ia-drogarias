import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { email, nome, whatsapp, crf, area, cidade, origem } = (await req.json()) as {
      email?: string | null;
      nome?: string | null;
      whatsapp?: string | null;
      crf?: string | null;
      area?: string | null;
      cidade?: string | null;
      origem?: string | null;
    };

    if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // acha user_id no Auth pelo email (pra vincular)
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

    const authUser = list?.users?.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    const user_id = authUser?.id || null;

    // tenta achar registro por email
    const { data: existing, error: exErr } = await supabaseAdmin
      .from("cadastros_profissionais")
      .select("id,email,user_id")
      .eq("email", email)
      .maybeSingle();

    // payload
    const payload: any = {
      email,
      nome: nome ?? null,
      whatsapp: whatsapp ?? null,
      crf: crf ?? null,
      area: area ?? null,
      cidade: cidade ?? null,
      origem: origem ?? null,
    };
    if (user_id) payload.user_id = user_id;

    // update se existe
    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from("cadastros_profissionais")
        .update(payload)
        .eq("id", existing.id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, action: "updated" });
    }

    // insert se não existe
    const { error } = await supabaseAdmin.from("cadastros_profissionais").insert(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, action: "inserted" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro inesperado" }, { status: 500 });
  }
}
