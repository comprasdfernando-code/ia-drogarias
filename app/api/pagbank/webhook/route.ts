import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("SUPABASE_URL não configurado");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_KEY não configurado");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    // Se você estiver usando um “segredo seu” no webhook:
    const secret = req.headers.get("x-webhook-secret");
    const expected = process.env.PAGBANK_WEBHOOK_SECRET;

    if (expected && secret !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: any = await req.json();

    // Pode variar conforme o evento; aqui tentamos capturar o id do pedido/cobrança
    const pagbankId = payload?.id || payload?.order_id || payload?.reference_id;
    const statusRaw = payload?.charges?.[0]?.status || payload?.status || "";
    const status = String(statusRaw).toLowerCase();

    if (!pagbankId) {
      return NextResponse.json({ ok: true, warn: "Sem id no payload" });
    }

    const sb = supabaseAdmin();

    await sb
      .from("vendas_site")
      .update({
        status,
        etapa: status === "paid" ? 2 : undefined,
        pagbank_id: String(pagbankId),
      })
      .eq("pagbank_id", String(pagbankId));

    if (status === "paid") {
      await sb.from("vendas_site_rastreamento").insert({
        venda_id: String(pagbankId),
        etapa: 2,
        descricao: "Pagamento aprovado",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Falha no webhook", detalhe: String(e?.message || e) },
      { status: 500 }
    );
  }
}
