import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function toCents(v: any) {
  const n = Number(v || 0);
  return Math.round(n * 100);
}

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("SUPABASE_URL não configurado");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_KEY não configurado");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const token = process.env.PAGBANK_TOKEN;
    const baseUrl = (process.env.PAGBANK_BASE_URL || "https://sandbox.api.pagseguro.com").trim();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://iadrogarias.com.br").trim();

    if (!token) {
      return NextResponse.json({ error: "PAGBANK_TOKEN não configurado" }, { status: 500 });
    }

    const body = await req.json();

    const order_id = body?.order_id;
    const forma_pagamento = String(body?.forma_pagamento || "PIX").toUpperCase(); // PIX | CREDIT_CARD
    const cliente = body?.cliente || {};
    const itens = body?.itens || body?.items || [];

    if (!order_id || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ error: "Dados insuficientes (order_id/itens)" }, { status: 400 });
    }

    // PagBank espera "items"
    const items = itens.map((i: any) => ({
      reference_id: String(i?.reference_id || i?.ean || i?.id || i?.sku || "item"),
      name: String(i?.name || i?.nome || "Item"),
      quantity: Number(i?.quantity || i?.qtd || 1),
      unit_amount: Number(i?.unit_amount || i?.preco_centavos || i?.unitAmount || 0), // em centavos
    }));

    const total = items.reduce((acc: number, it: any) => acc + (it.unit_amount * it.quantity), 0);

    // Monta charges conforme método
    let charges: any[] = [];

    if (forma_pagamento === "PIX") {
      charges = [
        {
          reference_id: `pix-${order_id}`,
          description: `Pedido ${order_id} (PIX)`,
          amount: { value: total, currency: "BRL" },
          payment_method: { type: "PIX", expires_in: 3600 },
          notification_urls: [`${siteUrl}/api/pagbank/webhook`],
        },
      ];
    } else if (forma_pagamento === "CREDIT_CARD") {
      // Se você for pagar com cartão direto via API, precisa vir o "encrypted" do front
      const encrypted = body?.card?.encrypted;
      const holder = body?.card?.holder_name || cliente?.name;
      const cpf = body?.card?.holder_cpf || cliente?.cpf;

      if (!encrypted || !holder || !cpf) {
        return NextResponse.json(
          { error: "Para cartão: envie card.encrypted, card.holder_name e card.holder_cpf" },
          { status: 400 }
        );
      }

      charges = [
        {
          reference_id: `card-${order_id}`,
          description: `Pedido ${order_id} (Cartão)`,
          amount: { value: total, currency: "BRL" },
          payment_method: {
            type: "CREDIT_CARD",
            installments: Number(body?.card?.installments || 1),
            capture: true,
            card: { encrypted },
            holder: { name: String(holder), tax_id: String(cpf).replace(/\D/g, "") },
          },
          notification_urls: [`${siteUrl}/api/pagbank/webhook`],
        },
      ];
    } else {
      return NextResponse.json({ error: "forma_pagamento inválida (use PIX ou CREDIT_CARD)" }, { status: 400 });
    }

    // Cria pedido no PagBank
    const resp = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        reference_id: String(order_id),
        customer: {
          name: cliente?.name || "Cliente",
          email: cliente?.email || "cliente@iadrogarias.com",
          tax_id: cliente?.cpf ? String(cliente.cpf).replace(/\D/g, "") : undefined,
        },
        items,
        charges,
      }),
      cache: "no-store",
    });

    const data: any = await resp.json();

    if (!resp.ok || !data?.id) {
      return NextResponse.json(
        { error: "Erro ao criar pedido PagBank", status: resp.status, dados: data },
        { status: 500 }
      );
    }

    // pega informações úteis (PIX)
    const chargePix = data?.charges?.find((c: any) => c?.payment_method?.type === "PIX");
    const qr_base64 = chargePix?.payment_method?.qr_code_base64 || null;
    const qr_text = chargePix?.payment_method?.qr_code || null;

    // salva no supabase (server-side)
    const sb = supabaseAdmin();
    await sb
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
      qr_text,
      raw: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Falha geral ao criar ordem PagBank", detalhe: String(e?.message || e) },
      { status: 500 }
    );
  }
}
