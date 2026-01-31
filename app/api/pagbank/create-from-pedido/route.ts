// app/api/pagbank/create-from-pedido/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function toCentavos(v: any) {
  const n = Number(v || 0);
  return Math.round(n * 100);
}

/**
 * ✅ AQUI você liga no seu PagBank de verdade e retorna o order_id real.
 * Por enquanto está placeholder pra não quebrar o build.
 */
async function createPagbankOrder(payload: any): Promise<string> {
  if (!payload?.items?.length) throw new Error("Sem itens para pagamento.");
  return `ORDER_${Date.now()}`; // placeholder
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const pedido_id = body?.pedido_id ? String(body.pedido_id) : null;
    const grupo_id = body?.grupo_id ? String(body.grupo_id) : null;

    if (!pedido_id && !grupo_id) {
      return NextResponse.json(
        { ok: false, error: "pedido_id ou grupo_id é obrigatório." },
        { status: 400 }
      );
    }

    // 1) busca pedidos
    let query = supabaseAdmin
      .from("fv_pedidos")
      .select(
        // ✅ REMOVIDO: total_centavos (não existe no seu banco)
        "id,grupo_id,status,cliente_nome,cliente_email,cliente_cpf,cliente_whatsapp,pagamento,tipo_entrega,endereco,numero,bairro,itens,total"
      );

    if (pedido_id) query = query.eq("id", pedido_id);
    else query = query.eq("grupo_id", grupo_id);

    const { data, error } = await query;
    if (error) throw error;

    const pedidos = Array.isArray(data) ? data : [];
    if (!pedidos.length) {
      return NextResponse.json({ ok: false, error: "Pedido não encontrado." }, { status: 404 });
    }

    // 2) se grupo_id, somamos tudo num pagamento só
    const p0 = pedidos[0] as any;

    const itensAll: any[] = [];
    let totalCentavos = 0;

    for (const p of pedidos as any[]) {
      const itens = Array.isArray(p?.itens) ? p.itens : [];

      if (itens.length) {
        for (const it of itens) {
          const qty = Number(it?.qtd || it?.quantity || 1);

          // tenta pegar centavos do item; se não tiver, converte do preço em reais
          const unit =
            it?.preco_centavos != null
              ? Number(it.preco_centavos)
              : it?.unit_amount != null
              ? Number(it.unit_amount)
              : toCentavos(it?.preco || 0);

          itensAll.push({
            reference_id: String(it?.ean || it?.reference_id || it?.id || `item-${itensAll.length + 1}`),
            name: String(it?.nome || it?.name || "Item"),
            quantity: qty,
            unit_amount: unit,
          });

          totalCentavos += qty * unit;
        }
      } else {
        // fallback: usa o total do pedido (em reais)
        totalCentavos += toCentavos(p?.total || 0);
      }
    }

    // 3) cliente
    const cliente = {
      name: p0?.cliente_nome || "Cliente",
      email: p0?.cliente_email || "cliente@iadrogarias.com",
      tax_id: onlyDigits(p0?.cliente_cpf || ""),
      phone: onlyDigits(p0?.cliente_whatsapp || ""),
    };

    if (!cliente.tax_id || cliente.tax_id.length !== 11) {
      return NextResponse.json({ ok: false, error: "CPF do cliente inválido/ausente." }, { status: 400 });
    }

    // 4) cria order no PagBank
    const order_id = await createPagbankOrder({
      cliente,
      items: itensAll,
      total_centavos: totalCentavos,
      pedido_id: p0?.id,
      grupo_id: p0?.grupo_id || grupo_id || null,
    });

    return NextResponse.json({
      ok: true,
      order_id,
      pedido_id: p0?.id,
      grupo_id: p0?.grupo_id || grupo_id || null,
      pedido: {
        ...p0,
        itens: p0?.itens || [],
      },
    });
  } catch (e: any) {
    console.error("create-from-pedido error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
