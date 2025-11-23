import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const pagbankId = payload.id;
    const status = payload.charges?.[0]?.status;

    await supabase
      .from("payments_pagbank")
      .update({ status })
      .eq("pagbank_id", pagbankId);

    if (status === "PAID") {
      // Atualiza pedido como pago
      await supabase
        .from("orders")
        .update({ status: "pago" })
        .eq("pagbank_id", pagbankId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
