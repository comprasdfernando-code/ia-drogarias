import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function getBaseUrl() {
  return process.env.PAGBANK_BASE_URL || "https://sandbox.api.pagseguro.com";
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase env vars ausentes (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

type Item = {
  reference_id?: string;
  name: string;
  quantity: number;
  unit_amount: number; // centavos
};

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const body = await req.json();

    const {
      order_id,
      forma_pagamento, // "PIX" | "CREDIT_CARD"
      cliente,
      items,           // ✅ obrigatório (API usa items)
      card,            // { encrypted, holder_name, holder_tax_id }
      shipping,        // opcional
    } = body;

    if (!order_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Dados insuficientes para criar pedido (order_id/items)" },
        { status: 400 }
      );
    }

    const forma = String(forma_pagamento || "PIX").toUpperCase();

    // total em centavos
    const total = (items as Item[]).reduce(
      (acc, item) => acc + Number(item.unit_amount || 0) * Number(item.quantity || 0),
      0
    );

    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ error: "Total inválido" }, { status: 400 });
    }

    // ✅ monta charge conforme forma
    const charge =
      forma === "CREDIT_CARD"
        ? {
            reference_id: `charge-${order_id}`,
            description: `Pedido ${order_id}`,
            amount: { value: total, currency: "BRL" },
            payment_method: {
              type: "CREDIT_CARD",
              installments: 1,
              capture: true,
              card: {
                encrypted: card?.encrypted, // vem do SDK no front
                holder: {
                  name: card?.holder_name || cliente?.name || "Cliente",
                  tax_id: onlyDigits(card?.holder_tax_id || cliente?.tax_id || ""),
                },
              },
            },
          }
        : {
            reference_id: `charge-${order_id}`,
            description: `Pedido ${order_id}`,
            amount: { value: total, currency: "BRL" },
            payment_method: {
              type: "PIX",
              expires_in: 3600,
            },
          };

    if (forma === "CREDIT_CARD" && !card?.encrypted) {
      return NextResponse.json(
        { error: "Cartão não criptografado: 'card.encrypted' ausente" },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_SITE_URL não configurado" },
        { status: 500 }
      );
    }

    const payload = {
      reference_id: String(order_id),
      customer: {
        name: cliente?.name || "Cliente IA Drogarias",
        email: cliente?.email || "cliente@iadrogarias.com",
        tax_id: cliente?.tax_id ? onlyDigits(cliente.tax_id) : undefined,
        phones: cliente?.phone
          ? [
              {
                country: "55",
                area: onlyDigits(cliente.phone).slice(0, 2),
                number: onlyDigits(cliente.phone).slice(2),
                type: "MOBILE",
              },
            ]
          : undefined,
      },
      items,
      shipping: shipping || undefined,
      notification_urls: [`${siteUrl}/api/pagbank/webhook`],
      charges: [charge], // ✅ uma charge somente
    };

    const resp = await fetch(`${getBaseUrl()}/orders`, {
  method: "POST",
  headers: {
    Authorization: `token=${process.env.PAGBANK_TOKEN}`,

    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

let data: any = null;
try {
  data = await resp.json();
} catch {
  data = null;
}

if (!resp.ok) {
  console.error("❌ PagBank ERROR", {
    status: resp.status,
    payload_enviado: payload,
    resposta: data,
  });

  return NextResponse.json(
    {
      error: "Erro PagBank",
      status: resp.status,
      resposta: data,
    },
    { status: 400 }
  );
}

if (!data?.id) {
  console.error("❌ PagBank SEM ID", data);

  return NextResponse.json(
    { error: "Resposta inválida PagBank", resposta: data },
    { status: 400 }
  );
}


    const charge0 = data.charges?.[0] || null;

    const pix_qr_base64 = charge0?.payment_method?.qr_code_base64 || null;
    const pix_copia_cola = charge0?.payment_method?.qr_code || null;

    // ✅ salva na vendas_site
    const upd = await supabaseAdmin
      .from("vendas_site")
      .update({
        pagbank_order_id: data.id,
        pagbank_charge_id: charge0?.id || null,
        status_pagamento: String(charge0?.status || "WAITING").toUpperCase(),
        forma_pagamento: forma,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    // se não achou pedido pelo id
    if (upd.error) {
      return NextResponse.json(
        { error: "PagBank ok, mas falhou ao atualizar vendas_site", detalhes: upd.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      pagbank_order_id: data.id,
      pagbank_charge_id: charge0?.id || null,
      status: charge0?.status || null,
      pix_qr_base64,
      pix_copia_cola,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Falha geral ao criar ordem PagBank", detalhes: String(e) },
      { status: 500 }
    );
  }
}
