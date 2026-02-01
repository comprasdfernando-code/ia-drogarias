// app/api/pagbank/order-status/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("SUPABASE_URL não configurado");
  if (!serviceKey)
    throw new Error("SUPABASE_SERVICE_KEY/SERVICE_ROLE_KEY não configurado");

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
  const baseUrl = (
    process.env.PAGBANK_BASE_URL || "https://sandbox.api.pagseguro.com"
  ).trim();

  if (!token) throw new Error("PAGBANK_TOKEN não configurado");

  const resp = await fetch(
    `${baseUrl}/orders/${encodeURIComponent(pagbankId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

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
 * E também POST (compatível): { "order_id": "123" }
 */

// ✅ GET (melhor pro polling)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const order_id = searchParams.get("order_id");

    if (!order_id) {
      return NextResponse.json(
        { ok: false, error: "order_id obrigatório" },
        { status: 400 }
      );
    }

    return await handle(String(order_id));
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
      return NextResponse.json(
        { ok: false, error: "order_id obrigatório" },
        { status: 400 }
      );
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

  const isUUID = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      s
    );

  // 1) Busca a venda local (sem quebrar por UUID inválido)
  let venda: any = null;

  // A) se for UUID, tenta por id
  if (isUUID(order_id)) {
    const r = await sb
      .from("vendas_site")
      .select("*")
      .eq("id", order_id)
      .maybeSingle();

    if (r.error) {
      return NextResponse.json(
        { ok: false, error: "Erro ao consultar vendas_site", detalhe: r.error.message },
        { status: 500 }
      );
    }
    venda = r.data;
  }

  // B) se não achou, tenta por colunas texto
  if (!venda) {
    const candidates = ["order_id", "codigo", "reference_id", "pagbank_order_id", "id"];

    for (const col of candidates) {
      const r = await sb
        .from("vendas_site")
        .select("*")
        .eq(col, order_id)
        .limit(1)
        .maybeSingle();

      if (r.error) {
        // se col == id e vier UUID inválido, ignora
        const msg = String(r.error.message || "");
        if (col === "id" && msg.toLowerCase().includes("uuid")) continue;

        return NextResponse.json(
          { ok: false, error: "Erro ao consultar vendas_site", detalhe: r.error.message, col },
          { status: 500 }
        );
      }

      if (r.data) {
        venda = r.data;
        break;
      }
    }
  }

  // se não achou, não quebra polling
  if (!venda) {
    return NextResponse.json({
      ok: true,
      venda: null,
      status: "NOVO",
      fonte: "supabase",
      qr_text: "",
      qr_png_url: "",
      qr_base64: "",
      note: "Venda não encontrada ainda",
    });
  }

  const statusLocal = String(venda.status || "").toLowerCase();

  // pega qr se existir na tabela (ajuste os nomes se os seus forem outros)
  const qr_text = String(
    venda.qr_text || venda.pix_copia_cola || venda.pix_qr_text || venda.pix_text || ""
  );
  const qr_png_url = String(
    venda.qr_png_url || venda.qr_png || venda.pix_qr_png_url || venda.pix_qr_png || ""
  );
  const qr_base64 = String(venda.qr_base64 || venda.pix_qr_base64 || "");

  // 2) Se já está pago localmente, pronto
  if (statusLocal === "pago" || statusLocal === "paid") {
    return NextResponse.json({
      ok: true,
      venda,
      status: "pago",
      fonte: "supabase",
      qr_text,
      qr_png_url,
      qr_base64,
    });
  }

  // 3) Se não tem pagbank_id ainda, não tem como consultar PagBank
  if (!venda.pagbank_id) {
    return NextResponse.json({
      ok: true,
      venda,
      status: statusLocal || "pendente",
      fonte: "supabase",
      qr_text,
      qr_png_url,
      qr_base64,
    });
  }

  // 4) Consulta PagBank e atualiza Supabase
  const consult = await fetchPagBankOrder(String(venda.pagbank_id));
  const statusNovo = normStatus(consult.statusRaw);

  // atualiza pelo ID REAL da linha (venda.id), não pelo order_id da URL
  try {
    await sb
      .from("vendas_site")
      .update({
        status: statusNovo,
        paid_at: statusNovo === "pago" ? new Date().toISOString() : null,
      })
      .eq("id", String(venda.id));
  } catch {
    // não derruba retorno
  }

  // recarrega
  const { data: venda2 } = await sb
    .from("vendas_site")
    .select("*")
    .eq("id", String(venda.id))
    .maybeSingle();

  const vfinal = venda2 || venda;

  return NextResponse.json({
    ok: true,
    venda: vfinal,
    status: statusNovo,
    fonte: "pagbank",
    pagbank_status_raw: consult.statusRaw,
    qr_text: String(
      vfinal.qr_text || vfinal.pix_copia_cola || vfinal.pix_qr_text || vfinal.pix_text || ""
    ),
    qr_png_url: String(
      vfinal.qr_png_url || vfinal.qr_png || vfinal.pix_qr_png_url || vfinal.pix_qr_png || ""
    ),
    qr_base64: String(vfinal.qr_base64 || vfinal.pix_qr_base64 || ""),
  });
}
