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

function normStatus(s: any) {
  const x = String(s || "").toUpperCase();
  if (x === "PAID") return "pago";
  if (x === "AUTHORIZED") return "autorizado";
  if (x === "DECLINED") return "recusado";
  if (x === "CANCELED" || x === "CANCELLED") return "cancelado";
  if (x.includes("WAIT")) return "aguardando";
  if (x.includes("ANALYSIS")) return "em_analise";
  return x.toLowerCase();
}

export async function POST(req: Request) {
  try {
    const payload: any = await req.json();

    const referenceId =
      payload?.reference_id ||
      payload?.data?.reference_id ||
      payload?.order?.reference_id ||
      null;

    const pagbankOrderId =
      payload?.order_id ||
      payload?.data?.order_id ||
      payload?.order?.id ||
      null;

    const statusRaw =
      payload?.charges?.[0]?.status ||
      payload?.data?.charges?.[0]?.status ||
      payload?.status ||
      payload?.data?.status ||
      "";

    const status = normStatus(statusRaw);

    const sb = supabaseAdmin();

    // ✅ 1) Atualiza pela referência (id da venda)
    if (referenceId) {
      await sb
        .from("vendas_site")
        .update({
          status,
          pagbank_id: pagbankOrderId ? String(pagbankOrderId) : undefined,
          paid_at: status === "pago" ? new Date().toISOString() : undefined,
        })
        .eq("id", String(referenceId));

      if (status === "pago") {
        await sb.from("vendas_site_rastreamento").insert({
          venda_id: String(referenceId),
          etapa: 2,
          descricao: "Pagamento aprovado",
        });
      }

      return NextResponse.json({ ok: true });
    }

    // ✅ 2) Fallback: se não veio referência, tenta por pagbank_id
    if (pagbankOrderId) {
      await sb
        .from("vendas_site")
        .update({
          status,
          paid_at: status === "pago" ? new Date().toISOString() : undefined,
        })
        .eq("pagbank_id", String(pagbankOrderId));

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, warn: "Sem reference_id/order_id no payload" });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Falha no webhook", detalhe: String(e?.message || e) },
      { status: 500 }
    );
  }
}
