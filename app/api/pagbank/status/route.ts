// app/api/pagbank/status/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function json(data: any, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // último caso (não ideal)
  if (!url || !key) throw new Error("Supabase env não configurado");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function readBody(req: Request) {
  try {
    const text = await req.text();
    if (!text?.trim()) return {};
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function tryTableByColumn(
  db: ReturnType<typeof supa>,
  table: string,
  column: string,
  value: string
) {
  try {
    const { data, error } = await db.from(table).select("*").eq(column, value).limit(1).maybeSingle();
    if (error) return null;
    return data || null;
  } catch {
    return null;
  }
}

async function tryTableById(db: ReturnType<typeof supa>, table: string, id: string) {
  try {
    const { data, error } = await db.from(table).select("*").eq("id", id).limit(1).maybeSingle();
    if (error) return null;
    return data || null;
  } catch {
    return null;
  }
}

async function tryPedidoItens(db: ReturnType<typeof supa>, pedido_id: string) {
  // tenta ler itens de uma tabela comum (se existir)
  const candidates = ["fv_pedidos_itens", "pedido_itens", "itens_pedido", "fv_itens_pedido"];
  for (const t of candidates) {
    try {
      const { data, error } = await db.from(t).select("*").eq("pedido_id", pedido_id);
      if (!error && Array.isArray(data)) return data;
    } catch {
      // ignora
    }
  }
  return null;
}

function normalizeVenda(row: any) {
  // devolve no formato que o CheckoutClient espera (sem forçar colunas)
  return {
    id: String(row?.id ?? row?.order_id ?? row?.pedido_id ?? ""),
    status: row?.status ?? row?.situacao ?? null,

    cliente_nome: row?.cliente_nome ?? row?.nome ?? null,
    cliente_email: row?.cliente_email ?? row?.email ?? null,
    cliente_tax_id: row?.cliente_tax_id ?? row?.cpf ?? row?.tax_id ?? null,
    cliente_phone: row?.cliente_phone ?? row?.telefone ?? row?.phone ?? null,

    itens: row?.itens ?? row?.items ?? row?.produtos ?? null,

    total_centavos: row?.total_centavos ?? row?.total_cents ?? null,
    total: row?.total ?? row?.valor_total ?? null,
    total_reais: row?.total_reais ?? null,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const order_id = searchParams.get("order_id") || "";
    const pedido_id = searchParams.get("pedido_id") || "";
    const venda_id = searchParams.get("venda_id") || "";

    return await handle({ order_id, pedido_id, venda_id });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await readBody(req);
    const order_id = String(b?.order_id || "");
    const pedido_id = String(b?.pedido_id || "");
    const venda_id = String(b?.venda_id || "");

    return await handle({ order_id, pedido_id, venda_id });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

async function handle({
  order_id,
  pedido_id,
  venda_id,
}: {
  order_id: string;
  pedido_id: string;
  venda_id: string;
}) {
  const db = supa();

  if (!order_id && !pedido_id && !venda_id) {
    return json({ ok: false, error: "Informe order_id, pedido_id ou venda_id" }, { status: 400 });
  }

  // 1) tenta por venda_id
  if (venda_id) {
    const row =
      (await tryTableById(db, "vendas_site", venda_id)) ||
      (await tryTableById(db, "fv_pedidos", venda_id)) ||
      (await tryTableById(db, "pedidos", venda_id));

    if (row) {
      const venda = normalizeVenda(row);
      // tenta anexar itens do pedido se não existir itens no row
      if (!venda.itens && pedido_id) {
        const itens = await tryPedidoItens(db, pedido_id);
        if (itens) venda.itens = itens;
      }
      return json({ ok: true, venda, order_id: order_id || row?.order_id || null });
    }
  }

  // 2) tenta por pedido_id
  if (pedido_id) {
    const row =
      (await tryTableById(db, "fv_pedidos", pedido_id)) ||
      (await tryTableById(db, "pedidos", pedido_id)) ||
      (await tryTableById(db, "vendas_site", pedido_id)); // caso id seja o pedido

    if (row) {
      const venda = normalizeVenda(row);
      const itens = await tryPedidoItens(db, pedido_id);
      if (itens && !venda.itens) venda.itens = itens;
      return json({ ok: true, venda, order_id: order_id || row?.order_id || null });
    }
  }

  // 3) tenta por order_id em colunas candidatas (sem quebrar se não existir)
  if (order_id) {
    const tables = ["vendas_site", "fv_pedidos", "pedidos"];
    const cols = ["order_id", "pagbank_order_id", "reference_id", "codigo", "id"];

    for (const t of tables) {
      for (const c of cols) {
        const row = await tryTableByColumn(db, t, c, order_id);
        if (row) {
          const venda = normalizeVenda(row);
          const pid = String(row?.pedido_id || pedido_id || "");
          if (!venda.itens && pid) {
            const itens = await tryPedidoItens(db, pid);
            if (itens) venda.itens = itens;
          }
          return json({ ok: true, venda, order_id });
        }
      }
    }
  }

  return json({ ok: false, error: "Venda não encontrada" }, { status: 404 });
}
