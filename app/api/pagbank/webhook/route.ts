import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("SUPABASE_URL não configurado");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_KEY não configurado");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/**
 * Webhook PagBank:
 * - você configurou notification_urls no pedido
 * - aqui a gente recebe os eventos e atualiza sua tabela
 *
 * Obs: o formato exato do payload pode variar por produto (PIX/Orders).
 * Por isso, este webhook é "tolerante": tenta extrair campos úteis
 * e registra o payload pra auditoria.
 */
export async function POST(req: Request) {
  try {
    const sb = supabaseAdmin();

    const payload = await req.json().catch(() => ({}));
    const raw = payload || {};

    // Tenta extrair o que normalmente vem
    const event = String(raw?.event || raw?.type || raw?.notification_type || "").toUpperCase();
    const status = String(raw?.status || raw?.data?.status || raw?.charge?.status || "").toUpperCase();

    // IDs PagBank que podem vir:
    const pagbankOrderId =
      raw?.id ||
      raw?.order_id ||
      raw?.data?.id ||
      raw?.data?.order_id ||
      raw?.resource?.id ||
      null;

    // Seu reference_id (você manda "123" etc)
    const referenceId =
      raw?.reference_id ||
      raw?.data?.reference_id ||
      raw?.resource?.reference_id ||
      null;

    // ✅ decisão de "pago"
    // Dependendo do produto, pode vir PAID / PAID_OUT / CONFIRMED etc.
    const isPaid =
      status === "PAID" ||
      status === "PAID_OUT" ||
      status === "CONFIRMED" ||
      event.includes("PAID") ||
      event.includes("CONFIRMED");

    const newStatus = isPaid ? "pago" : (status ? status.toLowerCase() : "notificado");

    // 1) salva log (recomendado)
    // crie essa tabela se quiser: pagbank_webhooks (id uuid, created_at, payload jsonb)
    // se não existir, comente o bloco.
    try {
      await sb.from("pagbank_webhooks").insert({ payload: raw });
    } catch {
      // ok não ter tabela
    }

    // 2) atualiza sua venda
    // Preferência: achar por pagbank_id; fallback: por reference_id (= seu order_id)
    if (pagbankOrderId) {
      await sb
        .from("vendas_site")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("pagbank_id", String(pagbankOrderId));
    }

    if (referenceId) {
      await sb
        .from("vendas_site")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", String(referenceId));
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Falha no webhook", detalhe: String(e?.message || e) },
      { status: 500 }
    );
  }
}

// opcional: PagBank pode pingar GET
export async function GET() {
  return NextResponse.json({ ok: true });
}
