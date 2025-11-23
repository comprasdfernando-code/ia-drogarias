import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      order_id,
      forma_pagamento,
      cliente,
      itens,
    } = body;

    if (!order_id || !itens || itens.length === 0) {
      return NextResponse.json(
        { error: "Dados insuficientes para criar pedido" },
        { status: 400 }
      );
    }

    // SOMA TOTAL
    const total = itens.reduce(
      (acc, item) => acc + item.unit_amount * item.quantity,
      0
    );

    // ===== PAGBANK – CRIAR ORDEM =====
    const response = await fetch("https://api.pagbank.com.br/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAGBANK_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference_id: String(order_id),
        customer: {
          name: cliente?.name || "Cliente IA Drogarias",
          email: cliente?.email || "cliente@iadrogarias.com",
        },
        itens,
        charges: [
          {
            amount: {
              value: total,
              currency: "BRL",
            },
            payment_method: {
              type: "PIX",
              expires_in: 3600,
            },
            notification_urls: [
              `${process.env.NEXT_PUBLIC_SITE_URL}/api/pagbank/webhook`,
            ],
          },
          {
            amount: {
              value: total,
              currency: "BRL",
            },
            payment_method: {
              type: "CREDIT_CARD",
              installments: 1,
              capture: true,
            },
            notification_urls: [
              `${process.env.NEXT_PUBLIC_SITE_URL}/api/pagbank/webhook`,
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!data.id) {
      return NextResponse.json(
        { error: "Erro ao gerar pagamento", detalhes: data },
        { status: 400 }
      );
    }

    // Identificações úteis
    const charge_pix = data.charges?.find((c) => c.payment_method?.type === "PIX");
    const charge_card = data.charges?.find(
      (c) => c.payment_method?.type === "CREDIT_CARD"
    );

    // QR Code (PIX)
    const qr_base64 =
      charge_pix?.payment_method?.qr_code_base64 || null;

    // URL para pagamento com cartão
    const checkout_url =
      charge_card?.links?.find((l) => l.rel === "payment")?.href || null;

    // Salvar no SUPABASE
    await supabase
      .from("vendas_site")
      .update({
        pagbank_id: data.id,
        status: "pendente",
      })
      .eq("id", order_id);

    return NextResponse.json({
      ok: true,
      pagbank_id: data.id,
      qr_base64,
      checkout_url,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Falha geral ao criar ordem PagBank", detalhes: String(e) },
      { status: 500 }
    );
  }
}
