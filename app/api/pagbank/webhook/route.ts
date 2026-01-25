import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase env vars ausentes (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const payload = await req.json();

    const orderId = payload?.id || null;
    const charge = payload?.charges?.[0] || null;
    const chargeId = charge?.id || null;

    // status vem tipo "PAID", "WAITING", "CANCELED"...
    const status = String(charge?.status || payload?.status || "").toUpperCase();

    if (!orderId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // ✅ log do webhook (se você criou a tabela)
    await supabaseAdmin.from("pagbank_webhook_logs").insert({
      pagbank_order_id: orderId,
      pagbank_charge_id: chargeId,
      status: status || null,
      payload,
    });

    // ✅ tenta achar a venda pelo order_id
    const { data: venda } = await supabaseAdmin
      .from("vendas_site")
      .select("id, etapa")
      .eq("pagbank_order_id", orderId)
      .maybeSingle();

    // atualiza venda
    await supabaseAdmin
      .from("vendas_site")
      .update({
        status_pagamento: status || null,
        pagbank_charge_id: chargeId,
        updated_at: new Date().toISOString(),
      })
      .eq("pagbank_order_id", orderId);

    // se pago: avança etapa e registra rastreamento
    if (status === "PAID" && venda?.id) {
      await supabaseAdmin
        .from("vendas_site")
        .update({ etapa: 2 })
        .eq("id", venda.id);

      // se você tem essa tabela, mantém:
      await supabaseAdmin.from("vendas_site_rastreamento").insert({
        venda_id: venda.id,
        etapa: 2,
        descricao: "Pagamento aprovado (PagBank)",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Falha webhook PagBank", detalhes: String(e) },
      { status: 500 }
    );
  }
}
