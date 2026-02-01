// app/api/pagbank/order-status/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL não configurado");
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

  // Em geral o status mais importante vem na charge
  const chargeStatus = data?.charges?.[0]?.status;
  const orderStatus = data?.status;

  return {
    raw: data,
    statusRaw: chargeStatus || orderStatus || "",
    pagbankOrderId: data?.id || pagbankId,
  };
}

/**
 * Alguns endpoints do PagBank retornam base64 como:
 * - text/plain: "iVBORw0K...."
 * - application/json: { "base64": "..." } ou { "qrcode": "..." }
 * - às vezes com prefixo data:image/png;base64,
 */
async function fetchQrBase64FromUrl(url: string, token: string) {
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json, text/plain, */*",
    },
    cache: "no-store",
  });

  const ct = (r.headers.get("content-type") || "").toLowerCase();
  const raw = (await r.text()).trim();
  if (!raw) return null;

  let b64: any = raw;

  if (ct.includes("application/json") || raw.startsWith("{")) {
    try {
      const j = JSON.parse(raw);
      b64 =
        j?.base64 ||
        j?.qrcode ||
        j?.qr_base64 ||
        j?.data?.base64 ||
        j?.data?.qrcode ||
        null;
    } catch {
      // segue com raw
      b64 = raw;
    }
  }

  const cleaned = String(b64 || "").replace(/^data:image\/png;base64,/i, "").trim();
  return cleaned || null;
}

function pickQrFromVenda(venda: any) {
  const qr_text = String(
    venda?.qr_text ||
      venda?.pix_copia_cola ||
      venda?.pix_qr_text ||
      venda?.pix_text ||
      ""
  );

  const qr_png_url = String(
    venda?.qr_png_url ||
      venda?.qr_png ||
      venda?.pix_qr_png_url ||
      venda?.pix_qr_png ||
      ""
  );

  const qr_base64 = String(
    venda?.qr_base64 ||
      venda?.pix_qr_base64 ||
      ""
  );

  return {
    qr_text: qr_text || "",
    qr_png_url: qr_png_url || "",
    qr_base64: qr_base64 || "",
  };
}

async function safeUpdateVenda(sb: any, vendaId: string, patch: Record<string, any>) {
  // tenta update; se der erro de coluna inexistente, tenta patch mínimo
  const up = await sb.from("vendas_site").update(patch).eq("id", vendaId);
  if (!up?.error) return;

  const msg = String(up.error.message || "");
  const code = String(up.error.code || "");

  // 42703 undefined_column
  if (code === "42703" || msg.toLowerCase().includes("column")) {
    const minimal: any = {};
    if ("status" in patch) minimal.status = patch.status;
    if ("paid_at" in patch) minimal.paid_at = patch.paid_at;
    if ("qr_base64" in patch) minimal.qr_base64 = patch.qr_base64;
    if ("qr_text" in patch) minimal.qr_text = patch.qr_text;
    if ("qr_png_url" in patch) minimal.qr_png_url = patch.qr_png_url;

    if (Object.keys(minimal).length > 0) {
      await sb.from("vendas_site").update(minimal).eq("id", vendaId);
    }
  }
}

/**
 * Aceita:
 * GET: /api/pagbank/order-status?order_id=FV_...
 * POST: { order_id: "FV_..." }
 */
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

export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
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
  const token = process.env.PAGBANK_TOKEN || "";

  // 1) Busca a venda local SEM usar coluna order_id (porque não existe)
  let venda: any = null;

  // prioriza: codigo = FV_...
  {
    const r = await sb.from("vendas_site").select("*").eq("codigo", order_id).limit(1).maybeSingle();
    if (r.error) {
      return NextResponse.json(
        { ok: false, error: "Erro ao consultar vendas_site", detalhe: r.error.message, col: "codigo" },
        { status: 500 }
      );
    }
    venda = r.data;
  }

  // fallback: tenta outras colunas SEM quebrar se não existir
  if (!venda) {
    const candidates = ["reference_id", "pagbank_order_id", "id"];
    for (const col of candidates) {
  const r = await sb
    .from("vendas_site")
    .select("*")
    .filter(col, "eq", order_id)
    .limit(1)
    .maybeSingle();

  if (r.error) {
    const msg = String(r.error.message || "");
    const code = String(r.error.code || "");

    // coluna não existe → ignora
    if (code === "42703" || msg.toLowerCase().includes("column")) continue;

    // id com uuid inválido → ignora
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


  // se não achou, não derruba polling (front fica em NOVO)
  if (!venda) {
    return NextResponse.json({
      ok: true,
      venda: null,
      status: "NOVO",
      fonte: "supabase",
      qr_text: "",
      qr_png_url: "",
      qr_base64: "",
      note: "Venda não encontrada ainda (verifique se codigo foi salvo em vendas_site)",
    });
  }

  const statusLocal = String(venda.status || "").toLowerCase();
  let { qr_text, qr_png_url, qr_base64 } = pickQrFromVenda(venda);

  // 2) Se já está pago localmente
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

  // 3) Se não tem pagbank_id, retorna o que tiver
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

  // 4) Consulta PagBank
  let consult: any;
  try {
    consult = await fetchPagBankOrder(String(venda.pagbank_id));
  } catch (e: any) {
    // mesmo se falhar, devolve o que temos local
    return NextResponse.json({
      ok: true,
      venda,
      status: statusLocal || "pendente",
      fonte: "supabase",
      pagbank_error: String(e?.message || e),
      qr_text,
      qr_png_url,
      qr_base64,
    });
  }

  const statusNovo = normStatus(consult.statusRaw);

  // 5) Se ainda não tem qr_base64, tenta buscar do PagBank e atualizar
  if (!qr_base64 && token) {
    try {
      const links: any[] = consult?.raw?.qr_codes?.[0]?.links || [];
      const base64Url = links.find((l) => String(l?.rel || "").toUpperCase() === "QRCODE.BASE64")?.href;
      const pngUrl = links.find((l) => String(l?.rel || "").toUpperCase() === "QRCODE.PNG")?.href;

      if (!qr_png_url && pngUrl) qr_png_url = String(pngUrl || "");
      if (!qr_text && consult?.raw?.qr_codes?.[0]?.text) qr_text = String(consult.raw.qr_codes[0].text || "");

      if (base64Url) {
        const b64 = await fetchQrBase64FromUrl(String(base64Url), token);
        if (b64) qr_base64 = b64;
      }

      // tenta salvar (se as colunas existirem)
      const patch: any = {};
      if (qr_text) patch.qr_text = qr_text;
      if (qr_png_url) patch.qr_png_url = qr_png_url;
      if (qr_base64) patch.qr_base64 = qr_base64;

      if (Object.keys(patch).length > 0) {
        await safeUpdateVenda(sb, String(venda.id), patch);
      }
    } catch {
      // ignora; segue com o que tiver
    }
  }

  // 6) Atualiza status/paid_at no supabase (não derruba)
  try {
    await safeUpdateVenda(sb, String(venda.id), {
      status: statusNovo,
      paid_at: statusNovo === "pago" ? new Date().toISOString() : null,
    });
  } catch {}

  // 7) Recarrega a venda (opcional)
  const r2 = await sb.from("vendas_site").select("*").eq("id", String(venda.id)).maybeSingle();
  const vfinal = r2?.data || venda;

  // recaptura QR do registro recarregado
  const picked = pickQrFromVenda(vfinal);
  qr_text = picked.qr_text || qr_text;
  qr_png_url = picked.qr_png_url || qr_png_url;
  qr_base64 = picked.qr_base64 || qr_base64;

  return NextResponse.json({
    ok: true,
    venda: vfinal,
    status: statusNovo,
    fonte: "pagbank",
    pagbank_status_raw: consult.statusRaw,
    qr_text,
    qr_png_url,
    qr_base64,
  });
}
}