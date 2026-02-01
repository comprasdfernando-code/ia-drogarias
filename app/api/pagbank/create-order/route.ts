// app/api/pagbank/create-order/route.ts
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
  if (!serviceKey)
    throw new Error("SUPABASE_SERVICE_KEY/SERVICE_ROLE_KEY não configurado");

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

  // alguns retornos vêm como "QRCODE.PNG" e "QRCODE.BASE64"
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

/**
 * ✅ UPSERT por "codigo" (porque sua vendas_site NÃO tem order_id)
 * - Se existir linha com codigo=FV_..., atualiza
 * - Se não existir, insere
 * - Se alguma coluna do patch não existir, tenta novamente com patch mínimo
 *
 * ✅ Corrigido:
 * - Não faz mais "update" em tabela vazia e só depois "insert" (corrida e duplicidade).
 * - Primeiro faz um SELECT, depois UPDATE ou INSERT.
 * - Tolerante a colunas inexistentes (42703).
 */
async function upsertVendaByCodigo(codigo: string, patch: Record<string, any>) {
  const sb = supabaseAdmin();
  const table = sb.from("vendas_site") as any;

  const full = { ...patch, codigo };

  // 1) verifica se existe
  const chk = await table.select("id").eq("codigo", codigo).limit(1).maybeSingle();

  // Se der erro de coluna "codigo" inexistente (muito raro), não derruba checkout
  if (chk?.error) {
    const msg = String(chk.error.message || "");
    const code = String(chk.error.code || "");
    if (code === "42703" || msg.toLowerCase().includes("column")) return;
    return;
  }

  // helpers para tentar write com fallback minimal
  async function tryUpdate(payload: any) {
    const r = await table.update(payload).eq("codigo", codigo);
    if (!r?.error) return;

    const msg = String(r.error.message || "");
    const code = String(r.error.code || "");

    if (code === "42703" || msg.toLowerCase().includes("column")) {
      const minimal: any = {
        codigo,
        status: patch?.status ?? "pendente",
        pagbank_id: patch?.pagbank_id ?? null,
      };
      await table.update(minimal).eq("codigo", codigo);
    }
  }

  async function tryInsert(payload: any) {
    const r = await table.insert([payload]);
    if (!r?.error) return;

    const msg = String(r.error.message || "");
    const code = String(r.error.code || "");

    if (code === "42703" || msg.toLowerCase().includes("column")) {
      const minimal: any = {
        codigo,
        status: patch?.status ?? "pendente",
        pagbank_id: patch?.pagbank_id ?? null,
      };
      await table.insert([minimal]);
    }
  }

  // 2) update ou insert
  if (chk?.data?.id) {
    await tryUpdate(full);
  } else {
    await tryInsert(full);
  }
}

export async function POST(req: Request) {
  try {
    const token = process.env.PAGBANK_TOKEN;

    // sandbox por padrão
    const baseUrl = (process.env.PAGBANK_BASE_URL || "https://sandbox.api.pagseguro.com").trim();

    // ✅ padroniza URL pública
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.iadrogarias.com.br").trim();

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "PAGBANK_TOKEN não configurado" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const order_id = String(body?.order_id || "").trim(); // FV_...
    const forma_pagamento = String(body?.forma_pagamento || "PIX").toUpperCase();
    const cliente = body?.cliente || {};
    const itens = body?.itens || body?.items || [];

    if (!order_id || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Dados insuficientes (order_id/itens)" },
        { status: 400 }
      );
    }

    // 🔒 normaliza itens: unit_amount SEMPRE em centavos
    const items = itens.map((i: any, idx: number) => ({
      reference_id: String(i?.reference_id || i?.ean || i?.id || i?.sku || `item-${idx + 1}`),
      name: String(i?.name || i?.nome || "Item"),
      quantity: Math.max(1, Number(i?.quantity || i?.qtd || 1)),
      unit_amount: Math.max(
        0,
        Number(i?.unit_amount || i?.preco_centavos || i?.unitAmount || 0)
      ),
    }));

    const total = items.reduce((acc: number, it: any) => acc + it.unit_amount * it.quantity, 0);

    // Se total zerado, não chama PagBank (evita erro)
    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json(
        { ok: false, error: "Total inválido/zerado. Verifique unit_amount dos itens (centavos)." },
        { status: 400 }
      );
    }

    const customerTaxId = onlyDigits(cliente?.tax_id || cliente?.cpf || "");
    const customerPhones = buildPhones(cliente?.phone || cliente?.whatsapp || "");

    // PIX exige CPF
    if (forma_pagamento === "PIX" && (!customerTaxId || customerTaxId.length !== 11)) {
      return NextResponse.json(
        { ok: false, error: "CPF (tax_id) é obrigatório (11 dígitos) para gerar PIX." },
        { status: 400 }
      );
    }

    // ================== PIX (qr_codes) ==================
    if (forma_pagamento === "PIX") {
      const payloadPIX: any = {
        reference_id: String(order_id), // FV_...
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
          {
            ok: false,
            error: "Erro ao criar pedido PIX no PagBank",
            status: resp.status,
            dados: data,
          },
          { status: 500 }
        );
      }

      const qr = pickQrLinks(data);

      // ✅ pega o BASE64 no BACKEND para evitar CORB no navegador
      let qr_base64: string | null = null;
      try {
        if (qr.qr_base64_url) {
          const r2 = await fetch(qr.qr_base64_url, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "text/plain",
            },
            cache: "no-store",
          });
          const txt = (await r2.text()).trim();
          if (txt) qr_base64 = txt;
        }
      } catch {
        // se falhar, segue
      }

      // ✅ UPSERT em vendas_site usando "codigo" = FV_...
      await upsertVendaByCodigo(order_id, {
        pagbank_id: data.id,
        status: "pendente_pix",
        qr_text: qr.qr_text,
        qr_png_url: qr.qr_png_url,
        qr_base64: qr_base64,
      });

      return NextResponse.json({
        ok: true,
        pagbank_id: data.id,
        status: "PENDING",
        qr_text: qr.qr_text,
        qr_png_url: qr.qr_png_url,
        qr_base64_url: qr.qr_base64_url,
        qr_base64, // ✅ use isso no front
      });
    }

    // ================== CARTÃO ==================
    if (forma_pagamento === "CREDIT_CARD") {
      const encrypted = body?.card?.encrypted;
      const holder = body?.card?.holder_name || cliente?.name;
      const cpf = onlyDigits(
        body?.card?.holder_cpf ||
          body?.card?.holder_tax_id ||
          cliente?.tax_id ||
          cliente?.cpf ||
          ""
      );

      if (!encrypted || !holder || !cpf) {
        return NextResponse.json(
          {
            ok: false,
            error: "Para cartão: envie card.encrypted, card.holder_name e card.holder_cpf",
          },
          { status: 400 }
        );
      }

      if (cpf.length !== 11) {
        return NextResponse.json(
          { ok: false, error: "CPF do titular inválido (precisa ter 11 dígitos)" },
          { status: 400 }
        );
      }

      const payloadCARD: any = {
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
          {
            ok: false,
            error: "Erro ao criar pedido Cartão no PagBank",
            status: resp.status,
            dados: data,
          },
          { status: 500 }
        );
      }

      await upsertVendaByCodigo(order_id, {
        pagbank_id: data.id,
        status: "pendente_cartao",
      });

      return NextResponse.json({
        ok: true,
        pagbank_id: data.id,
        status: data?.status || "PROCESSING",
      });
    }

    return NextResponse.json(
      { ok: false, error: "forma_pagamento inválida" },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Falha geral ao criar ordem PagBank",
        detalhe: String(e?.message || e),
      },
      { status: 500 }
    );
  }
}
