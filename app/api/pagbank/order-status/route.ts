// app/api/pagbank/order-status/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  // geralmente o status mais útil vem na charge
  const chargeStatus = data?.charges?.[0]?.status;
  const orderStatus = data?.status;

  return {
    raw: data,
    statusRaw: chargeStatus || orderStatus || "",
    pagbankOrderId: data?.id || pagbankId,
  };
}

function isUUID(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

/**
 * GET: /api/pagbank/order-status?order_id=FV_...
 * POST: { "order_id": "FV_..." }
 */

// ✅ GET (recomendado para polling)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const order_id = String(searchParams.get("order_id") || "").trim();

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

// ✅ POST (compatível)
export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({} as any));
    const order_id = String(b?.order_id || "").trim();

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

async function handle(order_id: string) {
  const sb = supabaseAdmin();
  const table = sb.from("vendas_site") as any;

  // 1) Busca a venda local (sem quebrar por UUID inválido)
  let venda: any = null;

  // A) se for UUID, tenta por id
  if (isUUID(order_id)) {
    const r = await table.select("*").eq("id", order_id).maybeSingle();

    if (r.error) {
      return NextResponse.json(
        { ok: false, error: "Erro ao consultar vendas_site", detalhe: r.error.message },
        { status: 500 }
      );
    }
    venda = r.data;
  }

  // B) se não achou, tenta por colunas texto (inclui "codigo")
  if (!venda) {
    const candidates = ["codigo", "reference_id", "pagbank_order_id", "id"];
    for (const col of candidates) {
      const r = await table.select("*").eq(col, order_id).limit(1).maybeSingle();

      if (r.error) {
        const msg = String(r.error.message || "").toLowerCase();
        const code = String(r.error.code || "");

        // se col == id e vier erro de UUID inválido, ignora e tenta próxima
        if (col === "id" && (code === "22P02" || msg.includes("uuid"))) continue;

        // se coluna não existe, ignora e tenta próxima
        if (code === "42703" || msg.includes("column")) continue;

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

  // ✅ se não achou, NÃO quebra o checkout/polling
  if (!venda) {
    return NextResponse.json({
      ok: true,
      venda: null,
      status: "NOVO",
      fonte: "supabase",
      qr_text: "",
      qr_png_url: "",
      qr_base64: "",
      note: "Venda não encontrada ainda (aguardando create-order gravar em vendas_site.codigo)",
    });
  }

  const statusLocal = String(venda.status || "").toLowerCase();

  // qr se existir na tabela (nomes que você gravou no create-order)
  const qr_text = String(venda.qr_text || venda.pix_copia_cola || venda.pix_qr_text || venda.pix_text || "");
  const qr_png_url = String(venda.qr_png_url || venda.qr_png || venda.pix_qr_png_url || venda.pix_qr_png || "");
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
  let consult: any;
  try {
    consult = await fetchPagBankOrder(String(venda.pagbank_id));
  } catch (e: any) {
    // se PagBank falhar, não derruba o front
    return NextResponse.json({
      ok: true,
      venda,
      status: statusLocal || "pendente",
      fonte: "supabase",
      qr_text,
      qr_png_url,
      qr_base64,
      pagbank_error: String(e?.message || e),
    });
  }

  const statusNovo = normStatus(consult.statusRaw);

  // atualiza pelo ID REAL da linha (venda.id)
  try {
    await table
      .update({
        status: statusNovo,
        paid_at: statusNovo === "pago" ? new Date().toISOString() : null,
      })
      .eq("id", String(venda.id));
  } catch {
    // não derruba retorno
  }

  // recarrega
  const { data: venda2 } = await table.select("*").eq("id", String(venda.id)).maybeSingle();
  const vfinal = venda2 || venda;

  return NextResponse.json({
    ok: true,
    venda: vfinal,
    status: statusNovo,
    fonte: "pagbank",
    pagbank_status_raw: consult.statusRaw,
    qr_text: String(vfinal.qr_text || vfinal.pix_copia_cola || vfinal.pix_qr_text || vfinal.pix_text || ""),
    qr_png_url: String(vfinal.qr_png_url || vfinal.qr_png || vfinal.pix_qr_png_url || vfinal.pix_qr_png || ""),
    qr_base64: String(vfinal.qr_base64 || vfinal.pix_qr_base64 || ""),
  });
}
