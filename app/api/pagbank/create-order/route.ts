import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("SUPABASE_URL não configurado");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_KEY não configurado");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function onlyDigits(v: any) {
  return String(v || "").replace(/\D/g, "");
}

function addSecondsISO(seconds: number) {
  const d = new Date(Date.now() + seconds * 1000);
  return d.toISOString(); // PagBank aceita ISO (ex: 2026-01-26T14:15:59.000Z)
}

export async function POST(req: Request) {
  try {
    const token = (process.env.PAGBANK_TOKEN || "").trim();
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

    // customer.tax_id é obrigatório (11 dígitos CPF / 14 dígitos CNPJ)
    const taxId = onlyDigits(cliente?.tax_id || cliente?.cpf);

    if (!taxId) {
      return NextResponse.json(
        { error: "customer.tax_id obrigatório (CPF/CNPJ). Envie cliente.tax_id ou cliente.cpf" },
        { status: 400 }
      );
    }

    // PagBank espera items com unit_amount em centavos
    const items = itens.map((i: any) => ({
      reference_id: String(i?.reference_id || i?.ean || i?.id || i?.sku || "item"),
      name: String(i?.name || i?.nome || "Item"),
      quantity: Number(i?.quantity || i?.qtd || 1),
      unit_amount: Number(i?.unit_amount || i?.preco_centavos || i?.unitAmount || 0), // centavos
    }));

    const total = items.reduce((acc: number, it: any) => acc + it.unit_amount * it.quantity, 0);

    // Monta payload base
    const payloadBase: any = {
      reference_id: String(order_id),
      customer: {
        name: String(cliente?.name || "Cliente"),
        email: String(cliente?.email || "cliente@iadrogarias.com"),
        tax_id: taxId,
        // phones opcional (se você tiver no front)
        ...(cliente?.phone
          ? {
              phones: [
                {
                  country: "55",
                  area: onlyDigits(cliente.phone).slice(0, 2) || "11",
                  number: onlyDigits(cliente.phone).slice(2) || "999999999",
                  type: "MOBILE",
                },
              ],
            }
          : {}),
      },
      items,
      notification_urls: [`${siteUrl}/api/pagbank/webhook`],
    };

    let payloadFinal: any = payloadBase;

    if (forma_pagamento === "PIX") {
      // ✅ PIX por QR Code: NÃO usa charges. Usa qr_codes.
      payloadFinal = {
        ...payloadBase,
        qr_codes: [
          {
            amount: { value: total },
            // você pode controlar a expiração aqui
            expiration_date: addSecondsISO(3600), // 1h
          },
        ],
      };
    } else if (forma_pagamento === "CREDIT_CARD") {
      // cartão via API precisa vir o encrypted do front
      const encrypted = body?.card?.encrypted;
      const holderName = body?.card?.holder_name || cliente?.name;
      const holderCpf = body?.card?.holder_cpf || cliente?.cpf || cliente?.tax_id;

      if (!encrypted || !holderName || !holderCpf) {
        return NextResponse.json(
          { error: "Para cartão: envie card.encrypted, card.holder_name e card.holder_cpf" },
          { status: 400 }
        );
      }

      payloadFinal = {
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
              holder: { name: String(holderName), tax_id: onlyDigits(holderCpf) },
            },
          },
        ],
      };
    } else {
      return NextResponse.json(
        { error: "forma_pagamento inválida (use PIX ou CREDIT_CARD)" },
        { status: 400 }
      );
    }

    // Chamada PagBank
    const resp = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payloadFinal),
      cache: "no-store",
    });

    const data: any = await resp.json().catch(() => null);

    if (!resp.ok || !data?.id) {
      return NextResponse.json(
        { error: "Erro ao criar pedido PagBank", status: resp.status, dados: data },
        { status: 500 }
      );
    }

    // PIX: o retorno costuma vir em data.qr_codes
    const qr = data?.qr_codes?.[0] || null;

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
      qr_codes: data?.qr_codes || null,
      qr, // atalho
      raw: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Falha geral ao criar ordem PagBank", detalhe: String(e?.message || e) },
      { status: 500 }
    );
  }
}
