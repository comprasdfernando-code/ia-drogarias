import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("SUPABASE_URL não configurado");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_KEY/SERVICE_ROLE_KEY não configurado");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function normStatus(raw: any) {
  const s = String(raw || "").toUpperCase();

  // mapeia pro seu padrão interno
  if (s === "PAID") return "pago";
  if (s === "AUTHORIZED") return "autorizado";
  if (s === "DECLINED") return "recusado";
  if (s === "CANCELED" || s === "CANCELLED") return "cancelado";
  if (s.includes("WAIT")) return "aguardando";
  if (s.includes("ANALYSIS")) return "em_analise";

  return String(raw || "").toLowerCase() || "pendente";
}

async function safeJson(resp: Response) {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw_text: text };
  }
}

async function fetchPagBankOrder(pagbankId: string) {
  const token = process.env.PAGBANK_TOKEN;
  const baseUrl = (process.env.PAGBANK_BASE_URL || "https://sandbox.api.pagseguro.com").trim();

  if (!token) throw new Error("PAGBANK_TOKEN não configurado");

  const resp = await fetch(`${baseUrl}/orders/${encodeURIComponent(pagbankId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = await safeJson(resp);

  if (!resp.ok) {
    const msg =
      data?.error_messages?.[0]?.description ||
      data?.message ||
      data?.raw_text ||
      "Erro ao consultar pedido no PagBank";
    throw new Error(`${msg} (HTTP ${resp.status})`);
  }

  // Em geral o status de pagamento vem na charge
  const chargeStatus = data?.charges?.[0]?.status;
  const orderStatus = data?.status;

  return {
    raw: data,
    statusRaw: chargeStatus || orderStatus || "",
    pagbankOrderId: data?.id || pagbankId,
  };
}

/**
 * Aceita GET (recomendado): /api/pagbank/order-status?order_id=123
 * E também POST (compatível com seu uso atual): { "order_id": "123" }
 */

// ✅ GET (melhor pro polling)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const order_id = searchParams.get("order_id");

    if (!order_id) {
      return NextResponse.json({ ok: false, error: "order_id obrigatório" }, { status: 400 });
    }

    return await handle(order_id);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Falha geral", detalhe: String(e?.message || e) },
      { status: 500 }
    );
  }
}

// ✅ POST (mantém compatibilidade)
export async function POST(req: Request) {
  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json({ ok: false, error: "order_id obrigatório" }, { status: 400 });
    }

    return await handle(String(order_id));
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Falha geral", detalhe: String(e?.message || e) },
      { status: 500 }
    );
  }
}

async function handle(order_id: string) {
  const sb = supabaseAdmin();

  // 1) Busca a venda local
  const { data: venda, error } = await sb
    .from("vendas_site")
    .select("id,status,pagbank_id,paid_at")
    .eq("id", String(order_id))
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Erro ao consultar vendas_site", detalhe: error.message },
      { status: 500 }
    );
  }

  if (!venda) {
    return NextResponse.json({ ok: true, venda: null, status: "nao_encontrado" });
  }

  const statusLocal = String(venda.status || "").toLowerCase();

  // 2) Se já está pago localmente, pronto
  if (statusLocal === "pago" || statusLocal === "paid") {
    return NextResponse.json({ ok: true, venda, status: "pago", fonte: "supabase" });
  }

  // 3) Se não tem pagbank_id ainda, não tem como consultar PagBank
  if (!venda.pagbank_id) {
    return NextResponse.json({ ok: true, venda, status: statusLocal || "pendente", fonte: "supabase" });
  }

  // 4) Consulta PagBank e atualiza Supabase
  const consult = await fetchPagBankOrder(String(venda.pagbank_id));
  const statusNovo = normStatus(consult.statusRaw);

  // Atualiza se mudou ou se veio "pago"
  try {
    await sb
      .from("vendas_site")
      .update({
        status: statusNovo,
        paid_at: statusNovo === "pago" ? new Date().toISOString() : undefined,
      })
      .eq("id", String(order_id));
  } catch {
    // não derruba retorno
  }

  // Recarrega o registro atualizado (opcional, mas ajuda no front)
  const { data: venda2 } = await sb
    .from("vendas_site")
    .select("id,status,pagbank_id,paid_at")
    .eq("id", String(order_id))
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    venda: venda2 || venda,
    status: statusNovo,
    fonte: "pagbank",
    pagbank_status_raw: consult.statusRaw,
  });
}
