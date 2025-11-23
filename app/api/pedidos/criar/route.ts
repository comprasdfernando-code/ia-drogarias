import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const body = await req.json();
  const { cliente_nome, cliente_telefone, endereco, itens, total } = body;

  // Criar venda no e-commerce
  const { data: venda, error } = await supabase
    .from("vendas_site")
    .insert([
      {
        cliente_nome,
        cliente_telefone,
        endereco,
        total,
        status: "pendente",
        etapa: 1,
      }
    ])
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 400 });

  // Inserir itens
  const itensFormatados = itens.map((i: any) => ({
    venda_id: venda.id,
    nome: i.nome,
    qtd: i.qtd,
    preco: i.preco
  }));

  await supabase.from("vendas_site_itens").insert(itensFormatados);

  // Registrar rastreamento
  await supabase.from("vendas_site_rastreamento").insert([
    {
      venda_id: venda.id,
      etapa: 1,
      descricao: "Pedido recebido"
    }
  ]);

  return NextResponse.json({
    ok: true,
    venda_id: venda.id
  });
}
