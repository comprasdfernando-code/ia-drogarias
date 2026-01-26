import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("SUPABASE_URL não configurado");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_KEY não configurado");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function buildPhones(phoneRaw?: string) {
  const d = onlyDigits(phoneRaw || "");
  // espera algo tipo: 11999998888 (DDD + número)
  if (d.length < 10) return undefined;

  const area = d.slice(0, 2);
  const number = d.slice(2);

  return [
    {
      country: "55",
      area,
      number,
      type: "MOBILE",
    },
  ];
}

function addMinutesISO(minutes: number) {
  const dt = new Date(Date.now() + minutes * 60 * 1000);
  return dt.toISOString();
}

function pickQrLinks(orderData: any) {
  const qr = orderData?.qr_codes?.[0];
  const links: any[] = Array.isArray(qr?.links) ? qr.links : [];

  const png = links.find((l) => String(l?.rel || "").toUpperCase() === "QRCODE.PNG");
  const b64 = links.find((l) => String(l?.rel || "").toUpperCase() === "QRCODE.BASE64");

  return {
    qr_text: qr?.text || null,
    qr_png_url: png?.href || null,
    qr_base64_url: b64?.href || null,
  };
}

export async function POST(req: Request) {
  try {
    const token = process.env.PAGBANK_TOKEN;
    const baseUrl = (process.env.PAGBANK_BASE_URL || "https://sandbox.api.pagseguro.com").trim();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://iadrogarias.com.br").trim();

    if (!token) {
      return NextResponse.json({ ok: false, error: "PAGBANK_TOKEN não configurado" }, { status: 500 });
    }

    const body = await req.json();

    const order_id = body?.order_id;
    const forma_pagamento = String(body?.forma_pagamento || "PIX").toUpperCase(); // PIX | CREDIT_CARD
    const cliente = body?.cliente || {};
    const itens = body?.itens || body?.items || [];

    if (!order_id || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ ok: false, error: "Dados insuficientes (order_id/itens)" }, { status: 400 });
    }

    const items = itens.map((i: any) => ({
      reference_id: String(i?.reference_id || i?.ean || i?.id || i?.sku || "item"),
      name: String(i?.name || i?.nome || "Item"),
      quantity: Number(i?.quantity || i?.qtd || 1),
      unit_amount: Number(i?.unit_amount || i?.preco_centavos || i?.unitAmount || 0), // centavos
    }));

    const total = items.reduce((acc: number, it: any) => acc + it.unit_amount * it.quantity, 0);

    // ===== cliente (PagBank exige tax_id no PIX; e phone ajuda bastante)
    const customerTaxId = onlyDigits(cliente?.tax_id || cliente?.cpf || "");
    const customerPhones = buildPhones(cliente?.phone || cliente?.whatsapp || "");

    if (forma_pagamento === "PIX" && !customerTaxId) {
      return NextResponse.json(
        { ok: false, error: "CPF (tax_id) é obrigatório para gerar PIX." },
        { status: 400 }
      );
    }

    // ===== monta payload e chama PagBank
    let pagbankResp: Response;
    let pagbankData: any;

    if (forma_pagamento === "PIX") {
      const payloadPIX = {
        reference_id: String(order_id),
        customer: {
          name: cliente?.name || "Cliente",
          email: cliente?.email || "cliente@iadrogarias.com",
          tax_id: customerTaxId,
          ...(customerPhones ? { phones: customerPhones } : {}),
        },
        items,
        notification_urls: [`${siteUrl}/api/pagbank/webhook`],
        qr_codes: [
          {
            amount: { value: total },
            expiration_date: addMinutesISO(60), // 60 min
          },
        ],
      };

      pagbankResp = await fetch(`${baseUrl}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payloadPIX),
        cache: "no-store",
      });

      pagbankData = await pagbankResp.json();

      if (!pagbankResp.ok || !pagbankData?.id) {
        return NextResponse.json(
          { ok: false, error: "Erro ao criar pedido PIX no PagBank", status: pagbankResp.status, dados: pagbankData },
          { status: 500 }
        );
      }

      // extrai do qr_codes (NOVO)
      const qr = pickQrLinks(pagbankData);

      // salva no supabase (não derruba se falhar)
      try {
        const sb = supabaseAdmin();
        await sb
          .from("vendas_site")
          .update({
            pagbank_id: pagbankData.id,
            status: "pendente",
          })
          .eq("id", order_id);
      } catch (e: any) {
        // não quebra o fluxo
      }

      return NextResponse.json({
        ok: true,
        pagbank_id: pagbankData.id,
        status: "PENDING",
        qr_text: qr.qr_text,
        qr_png_url: qr.qr_png_url,
        qr_base64_url: qr.qr_base64_url,
        raw: pagbankData,
      });
    }

    if (forma_pagamento === "CREDIT_CARD") {
      const encrypted = body?.card?.encrypted;
      const holderName = body?.card?.holder_name || cliente?.name;
      const holderCpf = onlyDigits(body?.card?.holder_cpf || body?.card?.holder_tax_id || cliente?.tax_id || cliente?.cpf || "");

      if (!encrypted || !holderName || !holderCpf) {
        return NextResponse.json(
          { ok: false, error: "Para cartão: envie card.encrypted, card.holder_name e card.holder_cpf" },
          { status: 400 }
        );
      }

      // (mantido seu modelo com charges)
      const payloadCARD = {
        reference_id: String(order_id),
        customer: {
          name: cliente?.name || "Cliente",
          email: cliente?.email || "cliente@iadrogarias.com",
          tax_id: customerTaxId || holderCpf, // garante tax_id
          ...(customerPhones ? { phones: customerPhones } : {}),
        },
        items,
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
              holder: { name: String(holderName), tax_id: holderCpf },
            },
            notification_urls: [`${siteUrl}/api/pagbank/webhook`],
          },
        ],
      };

      pagbankResp = await fetch(`${baseUrl}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payloadCARD),
        cache: "no-store",
      });

      pagbankData = await pagbankResp.json();

      if (!pagbankResp.ok || !pagbankData?.id) {
        return NextResponse.json(
          { ok: false, error: "Erro ao criar pedido Cartão no PagBank", status: pagbankResp.status, dados: pagbankData },
          { status: 500 }
        );
      }

      try {
        const sb = supabaseAdmin();
        await sb
          .from("vendas_site")
          .update({
            pagbank_id: pagbankData.id,
            status: "pendente",
          })
          .eq("id", order_id);
      } catch (e: any) {}

      return NextResponse.json({
        ok: true,
        pagbank_id: pagbankData.id,
        status: pagbankData?.status || "PROCESSING",
        raw: pagbankData,
      });
    }

    return NextResponse.json(
      { ok: false, error: "forma_pagamento inválida (use PIX ou CREDIT_CARD)" },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Falha geral ao criar ordem PagBank", detalhe: String(e?.message || e) },
      { status: 500 }
    );
  }
}
