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

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function makeCodigo() {
  // FV_1700000000000_ab12cd
  const rand = Math.random().toString(16).slice(2, 8);
  return `FV_${Date.now()}_${rand}`;
}

export async function POST(req: Request) {
  try {
    const sb = supabaseAdmin();
    const body = await req.json();

    const cliente = body?.cliente || {};
    const itens = body?.itens || body?.items || [];
    const endereco = body?.endereco || null;

    if (!Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ ok: false, error: "Itens vazios" }, { status: 400 });
    }

    const codigo = String(body?.order_id || "").trim() || makeCodigo();

    // normaliza total (centavos)
    const items = itens.map((i: any, idx: number) => ({
      reference_id: String(i?.reference_id || i?.ean || i?.id || `item-${idx + 1}`),
      nome: String(i?.name || i?.nome || "Item"),
      quantidade: Math.max(1, Number(i?.quantity || i?.qtd || 1)),
      unit_amount: Math.max(0, Number(i?.unit_amount || i?.preco_centavos || 0)),
    }));

    const total_centavos = items.reduce((acc: number, it: any) => acc + it.unit_amount * it.quantidade, 0);

    // 1) cria venda (pedido-first)
    const insVenda = await sb
      .from("vendas_site")
      .insert([{
        codigo,
        status: "pedido_criado",              // ✅ independente do PagBank
        total_centavos,
        total: total_centavos / 100,
        cliente_nome: cliente?.name || cliente?.nome || null,
        cliente_email: cliente?.email || null,
        cliente_phone: onlyDigits(cliente?.phone || cliente?.whatsapp || ""),
        cliente_tax_id: onlyDigits(cliente?.tax_id || cliente?.cpf || ""),
        endereco: endereco ? JSON.stringify(endereco) : null,  // se quiser salvar tudo junto
      }])
      .select("id,codigo")
      .maybeSingle();

    if (insVenda?.error || !insVenda?.data?.id) {
      return NextResponse.json(
        { ok: false, error: "Falha ao criar venda", detalhe: insVenda?.error?.message },
        { status: 500 }
      );
    }

    const venda_id = insVenda.data.id;

    // 2) cria itens do pedido (se você tiver tabela de itens; ajuste nome se necessário)
    // Se sua tabela for outra (ex: vendas_site_itens), troca aqui.
    const itensPayload = items.map((it: any) => ({
      venda_id,
      codigo, // opcional, ajuda debugar
      reference_id: it.reference_id,
      nome: it.nome,
      quantidade: it.quantidade,
      unit_amount: it.unit_amount,
      subtotal_centavos: it.unit_amount * it.quantidade,
    }));

    // Se você ainda não tem tabela de itens, comente esse insert por enquanto.
    const insItens = await sb.from("vendas_itens").insert(itensPayload);

    // se não existir tabela/colunas, não derruba o checkout
    // (depois a gente cria certinho com login/RLS)
    // @ts-ignore
    if (insItens?.error) {
      // segue mesmo assim
    }

    return NextResponse.json({ ok: true, codigo, venda_id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Falha geral ao criar pedido", detalhe: String(e?.message || e) },
      { status: 500 }
    );
  }
}
