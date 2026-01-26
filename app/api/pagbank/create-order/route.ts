import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function onlyDigits(s: any) {
  return String(s || "").replace(/\D/g, "");
}

function splitPhoneBR(phone: any) {
  // Espera algo tipo: 11999998888 (11 + 9 dígitos) ou com máscara
  const d = onlyDigits(phone);
  const area = d.length >= 2 ? d.slice(0, 2) : "11";
  const number = d.length > 2 ? d.slice(2) : "999999999";
  return { country: "55", area, number, type: "MOBILE" as const };
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

    // items (centavos)
    const items = itens.map((i: any) => ({
      reference_id: String(i?.reference_id || i?.ean || i?.id || i?.sku || "item"),
      name: String(i?.name || i?.nome || "Item"),
      quantity: Number(i?.quantity || i?.qtd || 1),
      unit_amount: Number(i?.unit_amount ?? i?.preco_centavos ?? i?.unitAmount ?? 0),
    }));

    const total = items.reduce((acc: number, it: any) => acc + it.unit_amount * it.quantity, 0);

    // customer
    const tax_id =
      onlyDigits(cliente?.cpf) ||
      onlyDigits(cliente?.tax_id) ||
      ""; // obrigatório no PIX (e geralmente recomendado sempre)

    if (!tax_id) {
      return NextResponse.json(
        { error: "CPF obrigatório: envie cliente.cpf ou cliente.tax_id (somente números)" },
        { status: 400 }
      );
    }

    const customer: any = {
      name: cliente?.name || "Cliente",
      email: cliente?.email || "cliente@iadrogarias.com",
      tax_id,
    };

    // phone opcional, mas no seu teste ele ajudou e é bom manter
    if (cliente?.phone) {
      customer.phones = [splitPhoneBR(cliente.phone)];
    }

    // ====== MONTA PAYLOAD ======
    let payload: any = {
      reference_id: String(order_id),
      customer,
      items,
      notification_urls: [`${siteUrl}/api/pagbank/webhook`],
    };

    if (forma_pagamento === "PIX") {
      // ✅ MODELO QUE DEU 201 NO SEU LOG (qr_codes)
      const expiresMinutes = Number(body?.pix?.expires_minutes || 60);
      const exp = new Date(Date.now() + expiresMinutes * 60 * 1000).toISOString();

      payload.qr_codes = [
        {
          amount: { value: total },
          expiration_date: exp,
        },
      ];
    } else if (forma_pagamento === "CREDIT_CARD") {
      // Cartão via Orders + Charges (precisa encrypted do front)
      const encrypted = body?.card?.encrypted;
      const holder = body?.card?.holder_name || cliente?.name;
      const cpf = body?.card?.holder_cpf || tax_id;

      if (!encrypted || !holder || !cpf) {
        return NextResponse.json(
          { error: "Para cartão: envie card.encrypted, card.holder_name e card.holder_cpf" },
          { status: 400 }
        );
      }

      payload.charges = [
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
      ];
    } else {
      return NextResponse.json(
        { error: "forma_pagamento inválida (use PIX ou CREDIT_CARD)" },
        { status: 400 }
      );
    }

    // ====== CHAMA PAGBANK ======
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

    // PIX infos
    const qr0 = data?.qr_codes?.[0];
    const qr_text = qr0?.text || null;
    const qr_links = qr0?.links || null;

    // salva no supabase
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
      qr_text,     // copia e cola
      qr_links,    // links p/ PNG e BASE64 (no sandbox)
      raw: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Falha geral ao criar ordem PagBank", detalhe: String(e?.message || e) },
      { status: 500 }
    );
  }
}
