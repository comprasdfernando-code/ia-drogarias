import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ só no server
);

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function getBaseUrl() {
  // ✅ controla por env (sandbox/prod)
  // sandbox: https://sandbox.api.pagseguro.com
  // prod:    https://api.pagseguro.com (ou conforme sua conta)
  return process.env.PAGBANK_BASE_URL || "https://sandbox.api.pagseguro.com";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      order_id,
      forma_pagamento, // "PIX" | "CREDIT_CARD"
      cliente,
      items,           // ✅ nome correto
      card,            // { encrypted, holder_name, holder_tax_id, holder_phone? }
      shipping,        // opcional (endereço)
    } = body;

    if (!order_id || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Dados insuficientes para criar pedido" },
        { status: 400 }
      );
    }

    const forma = String(forma_pagamento || "PIX").toUpperCase();

    // total em centavos (unit_amount já deve vir em centavos)
    const total = items.reduce(
      (acc: number, item: any) => acc + Number(item.unit_amount || 0) * Number(item.quantity || 0),
      0
    );

    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ error: "Total inválido" }, { status: 400 });
    }

    // ✅ monta charge conforme forma escolhida
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
                encrypted: card?.encrypted, // ✅ encryptedCard do SDK
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
        { error: "Cartão não criptografado (encrypted) ausente" },
        { status: 400 }
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
      items, // ✅
      shipping: shipping || undefined,
      notification_urls: [
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/pagbank/webhook`,
      ],
      charges: [charge], // ✅ só 1 charge
    };

    const resp = await fetch(`${getBaseUrl()}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAGBANK_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok || !data?.id) {
      return NextResponse.json(
        { error: "Erro ao gerar pagamento", detalhes: data },
        { status: 400 }
      );
    }

    // ✅ pega infos úteis (PIX)
    const charge0 = data.charges?.[0];
    const pixQrBase64 = charge0?.payment_method?.qr_code_base64 || null;
    const pixCopiaCola = charge0?.payment_method?.qr_code || null;

    // ✅ status inicial
    await supabaseAdmin
      .from("vendas_site")
      .update({
        pagbank_order_id: data.id,
        pagbank_charge_id: charge0?.id || null,
        status_pagamento: String(charge0?.status || "WAITING"),
        forma_pagamento: forma,
      })
      .eq("id", order_id);

    return NextResponse.json({
      ok: true,
      pagbank_order_id: data.id,
      pagbank_charge_id: charge0?.id || null,
      status: charge0?.status || null,
      pix_qr_base64: pixQrBase64,
      pix_copia_cola: pixCopiaCola,
      raw: data,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Falha geral ao criar ordem PagBank", detalhes: String(e) },
      { status: 500 }
    );
  }
}
