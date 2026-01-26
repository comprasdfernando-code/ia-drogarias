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
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_KEY/SERVICE_ROLE_KEY não configurado");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function buildPhones(phoneRaw?: string) {
  const d = onlyDigits(phoneRaw || "");
  if (d.length < 10) return undefined;

  const area = d.slice(0, 2);
  const number = d.slice(2);

  return [{ country: "55", area, number, type: "MOBILE" }];
}

function addMinutesISO(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
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

async function safeJson(resp: Response) {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw_text: text };
  }
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
    const forma_pagamento = String(body?.forma_pagamento || "PIX").toUpperCase();
    const cliente = body?.cliente || {};
    const itens = body?.itens || body?.items || [];

    if (!order_id || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ ok: false, error: "Dados insuficientes (order_id/itens)" }, { status: 400 });
    }

    const items = itens.map((i: any) => ({
      reference_id: String(i?.reference_id || i?.ean || i?.id || i?.sku || "item"),
      name: String(i?.name || i?.nome || "Item"),
      quantity: Number(i?.quantity || i?.qtd || 1),
      unit_amount: Number(i?.unit_amount || i?.preco_centavos || i?.unitAmount || 0),
    }));

    const total = items.reduce((acc: number, it: any) => acc + it.unit_amount * it.quantity, 0);

    const customerTaxId = onlyDigits(cliente?.tax_id || cliente?.cpf || "");
    const customerPhones = buildPhones(cliente?.phone || cliente?.whatsapp || "");

    if (forma_pagamento === "PIX" && !customerTaxId) {
      return NextResponse.json({ ok: false, error: "CPF (tax_id) é obrigatório para gerar PIX." }, { status: 400 });
    }

    // ================== PIX (NOVO: qr_codes) ==================
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
            expiration_date: addMinutesISO(60),
          },
        ],
      };

      const resp = await fetch(`${baseUrl}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payloadPIX),
        cache: "no-store",
      });

      const data = await safeJson(resp);

      if (!resp.ok || !data?.id) {
        return NextResponse.json(
          { ok: false, error: "Erro ao criar pedido PIX no PagBank", status: resp.status, dados: data },
          { status: 500 }
        );
      }

      const qr = pickQrLinks(data);

      // update supabase (não derruba)
      try {
        const sb = supabaseAdmin();
        await sb.from("vendas_site").update({ pagbank_id: data.id, status: "pendente" }).eq("id", order_id);
      } catch {}

      return NextResponse.json({
        ok: true,
        pagbank_id: data.id,
        status: "PENDING",
        qr_text: qr.qr_text,
        qr_png_url: qr.qr_png_url,
        qr_base64_url: qr.qr_base64_url,
      });
    }

    // ================== CARTÃO (mantido) ==================
    if (forma_pagamento === "CREDIT_CARD") {
      const encrypted = body?.card?.encrypted;
      const holder = body?.card?.holder_name || cliente?.name;
      const cpf = onlyDigits(body?.card?.holder_cpf || body?.card?.holder_tax_id || cliente?.tax_id || cliente?.cpf || "");

      if (!encrypted || !holder || !cpf) {
        return NextResponse.json(
          { ok: false, error: "Para cartão: envie card.encrypted, card.holder_name e card.holder_cpf" },
          { status: 400 }
        );
      }

      const payloadCARD = {
        reference_id: String(order_id),
        customer: {
          name: cliente?.name || "Cliente",
          email: cliente?.email || "cliente@iadrogarias.com",
          tax_id: customerTaxId || cpf,
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
              holder: { name: String(holder), tax_id: cpf },
            },
            notification_urls: [`${siteUrl}/api/pagbank/webhook`],
          },
        ],
      };

      const resp = await fetch(`${baseUrl}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payloadCARD),
        cache: "no-store",
      });

      const data = await safeJson(resp);

      if (!resp.ok || !data?.id) {
        return NextResponse.json(
          { ok: false, error: "Erro ao criar pedido Cartão no PagBank", status: resp.status, dados: data },
          { status: 500 }
        );
      }

      try {
        const sb = supabaseAdmin();
        await sb.from("vendas_site").update({ pagbank_id: data.id, status: "pendente" }).eq("id", order_id);
      } catch {}

      return NextResponse.json({ ok: true, pagbank_id: data.id, status: data?.status || "PROCESSING" });
    }

    return NextResponse.json({ ok: false, error: "forma_pagamento inválida" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Falha geral ao criar ordem PagBank", detalhe: String(e?.message || e) },
      { status: 500 }
    );
  }
}
