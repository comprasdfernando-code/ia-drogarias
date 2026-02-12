// app/api/pagbank/create-card/route.ts
import { NextResponse } from "next/server";

function json(data: any, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function readBody(req: Request) {
  try {
    const t = await req.text();
    return t ? JSON.parse(t) : {};
  } catch {
    return {};
  }
}

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

export async function POST(req: Request) {
  const body = await readBody(req);

  const token = process.env.PAGBANK_TOKEN || process.env.PAGBANK_BEARER_TOKEN;
  if (!token) return json({ ok: false, error: "PAGBANK_TOKEN não configurado" }, { status: 500 });

  const order_id = String(body?.order_id || "");
  const cliente = body?.cliente || {};
  const items = Array.isArray(body?.items) ? body.items : [];
  const total_centavos = Number(body?.total_centavos || 0);

  const card = body?.card || {};
  const cpf = onlyDigits(String(cliente?.tax_id || ""));

  if (!order_id) return json({ ok: false, error: "order_id obrigatório" }, { status: 400 });
  if (cpf.length !== 11) return json({ ok: false, error: "CPF inválido" }, { status: 400 });
  if (!items.length) return json({ ok: false, error: "items vazio" }, { status: 400 });
  if (!total_centavos || total_centavos <= 0) return json({ ok: false, error: "total inválido" }, { status: 400 });

  // ⚠️ Em produção: trocar isso por "encrypted" vindo do SDK PagBank
  const number = onlyDigits(String(card?.number || ""));
  const exp_month = onlyDigits(String(card?.exp_month || ""));
  const exp_year = onlyDigits(String(card?.exp_year || ""));
  const security_code = onlyDigits(String(card?.security_code || ""));
  const holder_name = String(card?.holder_name || "").trim();
  const installments = Number(card?.installments || 1) || 1;

  if (!holder_name) return json({ ok: false, error: "holder_name obrigatório" }, { status: 400 });
  if (number.length < 13) return json({ ok: false, error: "card number inválido" }, { status: 400 });
  if (exp_month.length !== 2) return json({ ok: false, error: "exp_month inválido" }, { status: 400 });
  if (exp_year.length !== 2) return json({ ok: false, error: "exp_year inválido" }, { status: 400 });
  if (security_code.length < 3) return json({ ok: false, error: "cvv inválido" }, { status: 400 });

  // Montagem genérica de charge com cartão
  // Obs: endpoints/estrutura exata podem variar conforme sua integração atual.
  // Aqui o objetivo é: gerar tentativa real de cartão e retornar erro do PagBank claramente.
  const payload = {
    reference_id: order_id,
    customer: {
      name: String(cliente?.name || "Cliente"),
      email: String(cliente?.email || "cliente@iadrogarias.com"),
      tax_id: cpf,
      phones: cliente?.phone
        ? [{ country: "55", area: String(cliente.phone).slice(0, 2), number: String(cliente.phone).slice(2) }]
        : undefined,
    },
    items: items.map((it: any) => ({
      reference_id: String(it.reference_id),
      name: String(it.name),
      quantity: Number(it.quantity) || 1,
      unit_amount: Number(it.unit_amount) || 0,
    })),
    charges: [
      {
        reference_id: order_id,
        description: "Compra Farmácia Virtual",
        amount: { value: total_centavos, currency: "BRL" },
        payment_method: {
          type: "CREDIT_CARD",
          installments,
          capture: true,
          card: {
            number,
            exp_month,
            exp_year,
            security_code,
            holder: { name: holder_name },
          },
        },
      },
    ],
  };

  try {
    // 🔁 ATENÇÃO: ajuste a URL conforme seu ambiente (sandbox/prod)
    const base = process.env.PAGBANK_API_BASE || "https://api.pagseguro.com";
    const url = `${base}/orders`;

    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const txt = await r.text();
    let j: any = null;
    try {
      j = JSON.parse(txt);
    } catch {}

    if (!r.ok) {
      return json(
        {
          ok: false,
          error: "PagBank recusou",
          status: r.status,
          detalhe: j || txt?.slice(0, 500),
        },
        { status: 400 }
      );
    }

    return json({ ok: true, data: j });
  } catch (e: any) {
    return json({ ok: false, error: "Falha de rede", detalhe: String(e?.message || e) }, { status: 500 });
  }
}
