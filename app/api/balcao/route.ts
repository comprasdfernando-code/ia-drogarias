import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function json(data: any, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function supaAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // último caso (não ideal)
  if (!url || !key) throw new Error("Supabase env não configurado");
  return createClient(url, key, { auth: { persistSession: false } });
}

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Body inválido." }, { status: 400 });

    const cliente_nome = String(body.cliente_nome || "").trim();
    const cliente_whatsapp = onlyDigits(String(body.cliente_whatsapp || ""));
    const motivo = String(body.motivo || "").trim();
    const mensagem = String(body.mensagem || "").trim();
    const anexo_url = body.anexo_url ? String(body.anexo_url) : null;
    const anexo_path = body.anexo_path ? String(body.anexo_path) : null;

    if (cliente_nome.length < 2) return json({ error: "Nome inválido." }, { status: 400 });
    if (cliente_whatsapp.length < 10) return json({ error: "WhatsApp inválido." }, { status: 400 });
    if (!motivo) return json({ error: "Motivo inválido." }, { status: 400 });
    if (mensagem.length < 5) return json({ error: "Mensagem muito curta." }, { status: 400 });

    const supabase = supaAdmin();

    const { data, error } = await supabase
      .from("balcao_atendimentos")
      .insert({
        cliente_nome,
        cliente_whatsapp,
        motivo,
        mensagem,
        anexo_url,
        anexo_path,
      })
      .select("id, protocolo")
      .single();

    if (error) {
      console.error(error);
      return json({ error: "Erro ao salvar no banco." }, { status: 500 });
    }

    return json({ ok: true, id: data.id, protocolo: data.protocolo });
  } catch (e: any) {
    console.error(e);
    return json({ error: "Erro interno." }, { status: 500 });
  }
}
