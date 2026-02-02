"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useCartUI } from "./CartProvider";

function brl(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CartModal() {
  const { items, isOpen, closeCart, inc, dec, remove, subtotal, clear } = useCartUI();
  const [loading, setLoading] = useState(false);
  const [clienteNome, setClienteNome] = useState("");
  const [clienteWhats, setClienteWhats] = useState("");

  const cartCount = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.quantidade) || 0), 0),
    [items]
  );

  async function finalizar() {
    if (items.length === 0) return;

    setLoading(true);
    try {
      const total = subtotal;

      const { data: venda, error: e1 } = await supabase
        .from("mk_vendas")
        .insert({
          status: "CRIADA",
          cliente_nome: clienteNome || null,
          cliente_whatsapp: clienteWhats || null,
          subtotal,
          total,
        })
        .select("id")
        .single();

      if (e1 || !venda) throw e1 || new Error("Falha ao criar venda");

      const itensInsert = items.map((it) => ({
        venda_id: venda.id,
        produto_id: it.produto_id,
        nome_snapshot: it.nome,
        preco_unit: it.preco_unit,
        quantidade: it.quantidade,
      }));

      const { error: e2 } = await supabase.from("mk_venda_itens").insert(itensInsert);
      if (e2) throw e2;

      for (const it of items) {
        const { error: e3 } = await supabase.rpc("mk_debitar_estoque_simplificado", {
          p_produto_id: it.produto_id,
          p_qtd: it.quantidade,
        });
        if (e3) throw e3;
      }

      clear();
      closeCart();
      alert(`Pedido criado! (#${String(venda.id).slice(0, 8)})\nAgora envie pro Caixa no Painel.`);
    } catch (err: any) {
      alert(err?.message || "Erro ao finalizar");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-lg rounded-3xl bg-zinc-950 text-white ring-1 ring-white/10 p-5">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold">Seu carrinho ({cartCount})</div>
          <button onClick={closeCart} className="text-white/70 hover:text-white">
            Fechar
          </button>
        </div>

        <div className="mt-4 space-y-3 max-h-[45vh] overflow-auto pr-1">
          {items.map((it) => (
            <div key={it.produto_id} className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
              <div className="flex items-start justify-between gap-3">
                {it.foto_url ? (
                  <div className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-black/40 ring-1 ring-white/10">
                    <Image src={it.foto_url} alt={it.nome} fill className="object-contain p-2" sizes="64px" />
                  </div>
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="font-medium line-clamp-2">{it.nome}</div>
                  <div className="text-white/70">{brl(it.preco_unit)}</div>

                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => dec(it.produto_id)} className="rounded-xl bg-white/10 px-3 py-1">
                      -
                    </button>
                    <span className="min-w-[24px] text-center">{it.quantidade}</span>
                    <button onClick={() => inc(it.produto_id)} className="rounded-xl bg-white/10 px-3 py-1">
                      +
                    </button>

                    <button onClick={() => remove(it.produto_id)} className="ml-2 text-white/60 hover:text-white">
                      Remover
                    </button>
                  </div>
                </div>

                <div className="font-semibold">{brl(it.preco_unit * it.quantidade)}</div>
              </div>
            </div>
          ))}

          {items.length === 0 && <div className="text-white/70">Carrinho vazio.</div>}
        </div>

        <div className="mt-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Nome (opcional)"
              className="rounded-2xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10"
            />
            <input
              value={clienteWhats}
              onChange={(e) => setClienteWhats(e.target.value)}
              placeholder="WhatsApp (opcional)"
              className="rounded-2xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10"
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-white/70">Subtotal</div>
            <div className="text-lg font-bold">{brl(subtotal)}</div>
          </div>

          <button
            disabled={items.length === 0 || loading}
            onClick={finalizar}
            className="mt-3 w-full rounded-2xl bg-white py-3 font-semibold text-black disabled:opacity-50"
          >
            {loading ? "Finalizando…" : "Finalizar pedido"}
          </button>

          <div className="mt-2 text-xs text-white/50">* Pagamento será confirmado no Caixa.</div>
        </div>
      </div>
    </div>
  );
}
