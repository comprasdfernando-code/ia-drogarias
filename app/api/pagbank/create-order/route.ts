import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function onlyDigits(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    // PagBank espera items com unit_amount em centavos
    const items = itens.map((i: any) => ({
      reference_id: String(i?.reference_id || i?.ean || i?.id || i?.sku || "item"),
      name: String(i?.name || i?.nome || "Item"),
      quantity: Number(i?.quantity || i?.qtd || 1),
      unit_amount: Number(i?.unit_amount || i?.preco_centavos || i?.unitAmount || 0),
    }));

    const total = items.reduce((acc: number, it: any) => acc + it.unit_amount * it.quantity, 0);

    // -------- customer (tax_id obrigatório no /orders)
    const customerTaxId = onlyDigits(cliente?.tax_id || cliente?.cpf);
    if (!customerTaxId) {
      return NextResponse.json(
        { error: "CPF obrigatório (cliente.cpf ou cliente.tax_id)" },
        { status: 400 }
      );
    }

    const rawPhone = onlyDigits(cliente?.phone || cliente?.whatsapp || "");
    // tenta quebrar em DDD + número (Brasil)
    const phone11 = rawPhone.startsWith("55") ? rawPhone.slice(2) : rawPhone; // remove 55 se veio
    const area = phone11.length >= 10 ? phone11.slice(0, 2) : "11";
    const number = phone11.length >= 10 ? phone11.slice(2) : "999998888";

    const payloadBase: any = {
      reference_id: String(order_id),
      customer: {
        name: String(cliente?.name || "Cliente"),
        email: String(cliente?.email || "cliente@iadrogarias.com"),
        tax_id: customerTaxId,
        phones: [
          {
            country: "55",
            area,
            number,
            type: "MOBILE",
          },
        ],
      },
      items,
      notification_urls: [`${siteUrl}/api/pagbank/webhook`],
    };

    // -------- PIX (usa qr_codes no /orders)
    let payload: any = payloadBase;

    if (forma_pagamento === "PIX") {
      const expiresIn = Number(body?.expires_in || 3600); // segundos
      const exp = new Date(Date.now() + expiresIn * 1000).toISOString();

      payload = {
        ...payloadBase,
        qr_codes: [
          {
            amount: { value: total },
            expiration_date: exp,
          },
        ],
      };
    } else if (forma_pagamento === "CREDIT_CARD") {
      // Mantive seu fluxo de cartão (encrypted precisa vir do front)
      const encrypted = body?.card?.encrypted;
      const holder = body?.card?.holder_name || cliente?.name;
      const cpf = body?.card?.holder_cpf || cliente?.cpf || cliente?.tax_id;

      if (!encrypted || !holder || !cpf) {
        return NextResponse.json(
          { error: "Para cartão: envie card.encrypted, card.holder_name e card.holder_cpf" },
          { status: 400 }
        );
      }

      payload = {
        ...payloadBase,
        charges: [
          {
            reference_id: `card-${order_id}`,
            description: `Pedido ${order_id} (Cartão)`,
            amount: { value: total, currency: "BRL" },
            payment_method: {
              type: "CREDIT_CARD",
              installments: Number(body?.card?.installments || 1),
              capture: true,
              card: { encrypted },
              holder: { name: String(holder), tax_id: onlyDigits(cpf) },
            },
            notification_urls: [`${siteUrl}/api/pagbank/webhook`],
          },
        ],
      };
    } else {
      return NextResponse.json(
        { error: "forma_pagamento inválida (use PIX ou CREDIT_CARD)" },
        { status: 400 }
      );
    }

    // -------- cria pedido
    const resp = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data: any = await resp.json();

    if (!resp.ok || !data?.id) {
      return NextResponse.json(
        { error: "Erro ao criar pedido PagBank", status: resp.status, dados: data },
        { status: 500 }
      );
    }

    // -------- extrai QR do retorno correto (qr_codes)
    const qr = Array.isArray(data?.qr_codes) ? data.qr_codes[0] : null;
    const qr_text = qr?.text || null;

    const qr_png_url =
      qr?.links?.find((l: any) => l?.rel === "QRCODE.PNG")?.href || null;

    const qr_base64_url =
      qr?.links?.find((l: any) => l?.rel === "QRCODE.BASE64")?.href || null;

    // -------- salva no supabase (server-side)
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
      qr_text,
      qr_png_url,
      qr_base64_url,
      raw: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Falha geral ao criar ordem PagBank", detalhe: String(e?.message || e) },
      { status: 500 }
    );
  }
}
