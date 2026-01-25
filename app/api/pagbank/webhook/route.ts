import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // ✅ headers úteis do PagBank
    const productOrigin = req.headers.get("x-product-origin"); // ORDER / CHECKOUT
    const productId = req.headers.get("x-product-id");
    // docs citam confirmação via SHA256 (assunto chato no sandbox)
    // const authenticity = req.headers.get("x-authenticity-token");
    // const signature = req.headers.get("x-payload-signature");

    const payload = await req.json();

    // payload típico de ORDER vem com charges/status
    const orderId = payload?.id || null;
    const charge = payload?.charges?.[0];
    const chargeId = charge?.id || null;
    const status = String(charge?.status || payload?.status || "").toUpperCase();

    if (!orderId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // ✅ atualiza venda pela order_id do pagbank
    const { data: venda } = await supabaseAdmin
      .from("vendas_site")
      .select("id")
      .eq("pagbank_order_id", orderId)
      .maybeSingle();

    await supabaseAdmin
      .from("vendas_site")
      .update({
        status_pagamento: status || null,
        pagbank_charge_id: chargeId,
        pagbank_product_origin: productOrigin,
        pagbank_product_id: productId,
        updated_at: new Date().toISOString(),
      })
      .eq("pagbank_order_id", orderId);

    // log (opcional, mas MUITO bom pra debugar)
    await supabaseAdmin.from("pagbank_webhook_logs").insert({
      pagbank_order_id: orderId,
      pagbank_charge_id: chargeId,
      status: status || null,
      payload,
    });

    // ✅ se pago, avança etapa
    if (status === "PAID" && venda?.id) {
      await supabaseAdmin
        .from("vendas_site")
        .update({ etapa: 2 })
        .eq("id", venda.id);

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
