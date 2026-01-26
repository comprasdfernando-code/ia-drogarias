import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function toCents(v: any) {
  const n = Number(v || 0);
  return Math.round(n * 100);
}

function onlyDigits(v: any) {
  return String(v ?? "").replace(/\D/g, "");
}

function isValidCpfDigits(cpf: string) {
  // validação simples: 11 dígitos e não todos iguais
  if (!cpf || cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  return true;
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

    // ✅ CPF obrigatório para PagBank (customer.tax_id)
    const cpfDigits = onlyDigits(cliente?.cpf);
    if (!isValidCpfDigits(cpfDigits)) {
      return NextResponse.json(
        { error: "CPF do cliente é obrigatório (11 dígitos) para pagamento" },
        { status: 400 }
      );
    }

    // PagBank espera "items" com unit_amount em centavos (inteiro)
    const items = itens.map((i: any) => {
      const q = Number(i?.quantity || i?.qtd || 1) || 1;

      // tenta achar centavos direto
      let unit = i?.unit_amount ?? i?.preco_centavos ?? i?.unitAmount;

      // se vier em reais (ex: 3.99) converte p/ centavos
      // heurística: se for number e não for inteiro, converte; se for string com vírgula/ponto, converte
      if (unit == null) {
        // tenta campos comuns em reais
        const precoReais = i?.preco ?? i?.valor ?? i?.price ?? 0;
        unit = toCents(precoReais);
      } else {
        const unitNum = Number(unit);
        if (!Number.isFinite(unitNum)) {
          unit = 0;
        } else if (!Number.isInteger(unitNum)) {
          unit = toCents(unitNum);
        } else {
          unit = unitNum;
        }
      }

      return {
        reference_id: String(i?.reference_id || i?.ean || i?.id || i?.sku || "item"),
        name: String(i?.name || i?.nome || "Item"),
        quantity: q,
        unit_amount: Number(unit) || 0,
      };
    });

    // valida unit_amount
    const badItem = items.find((it: any) => !it.unit_amount || it.unit_amount <= 0 || !it.quantity || it.quantity <= 0);
    if (badItem) {
      return NextResponse.json(
        { error: "Item inválido (unit_amount/quantity)", item: badItem },
        { status: 400 }
      );
    }

    const total = items.reduce((acc: number, it: any) => acc + it.unit_amount * it.quantity, 0);

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
      // Cartão direto via API: precisa do encrypted do front
      const encrypted = body?.card?.encrypted;
      const holder = body?.card?.holder_name || cliente?.name;

      // se não vier holder_cpf, usa o cpf do cliente
      const holderCpfDigits = onlyDigits(body?.card?.holder_cpf || cliente?.cpf);

      if (!encrypted || !holder || !isValidCpfDigits(holderCpfDigits)) {
        return NextResponse.json(
          { error: "Para cartão: envie card.encrypted, card.holder_name e card.holder_cpf (11 dígitos)" },
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
            holder: { name: String(holder), tax_id: holderCpfDigits },
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
          // ✅ NUNCA mandar undefined/null. Sempre string 11 dígitos.
          tax_id: cpfDigits,
        },
        items,
        charges,
      }),
      cache: "no-store",
    });

    let data: any = null;
    try {
      data = await resp.json();
    } catch {
      data = null;
    }

    if (!resp.ok || !data?.id) {
      // devolve o status real do PagBank pra você enxergar (sem mascarar tudo em 500)
      return NextResponse.json(
        { error: "Erro ao criar pedido PagBank", status: resp.status, dados: data },
        { status: resp.status >= 400 && resp.status <= 599 ? resp.status : 500 }
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
