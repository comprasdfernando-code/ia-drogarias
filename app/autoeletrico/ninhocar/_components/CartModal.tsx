"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "./CartContext";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CartModal({ open, onClose }: Props) {
  const cart = useCart();

  const [clienteNome, setClienteNome] = useState("");
  const [clienteWhats, setClienteWhats] = useState("");
  const [pagamento, setPagamento] = useState("PIX");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const total = useMemo(() => cart.subtotal, [cart.subtotal]);

  async function finalizar() {
    setErr(null);
    setOkId(null);

    if (cart.items.length === 0) {
      setErr("Seu carrinho está vazio.");
      return;
    }

    setSaving(true);
    try {
      // 1) cria comanda
      const { data: comanda, error: e1 } = await supabase
        .from("ninhocar_comandas")
        .insert({
          status: "ABERTA",
          origem: "LOJA",
          forma_pagamento: pagamento,
          observacao: obs || null,
          cliente_nome: clienteNome || null,
          cliente_whatsapp: clienteWhats || null,
          subtotal: Number(cart.subtotal),
          total: Number(total),
        })
        .select("id")
        .single();

      if (e1) throw e1;
      if (!comanda?.id) throw new Error("Falha ao criar comanda.");

      // 2) insere itens
      const itensPayload = cart.items.map((it) => ({
        comanda_id: comanda.id,
        produto_id: it.produto_id,
        nome: it.nome,
        qtd: it.qtd,
        preco: Number(it.preco),
        subtotal: Number(it.preco) * Number(it.qtd),
      }));

      const { error: e2 } = await supabase
        .from("ninhocar_comanda_itens")
        .insert(itensPayload);

      if (e2) throw e2;

      // 3) (opcional) dar baixa simples no estoque (um update por item)
      // se você preferir trigger no banco depois, eu ajusto.
      for (const it of cart.items) {
        // busca estoque atual e atualiza
        const { data: p, error: e3 } = await supabase
          .from("ninhocar_produtos")
          .select("estoque")
          .eq("id", it.produto_id)
          .single();
        if (e3) continue;
        const novo = Math.max(0, Number(p?.estoque || 0) - Number(it.qtd || 0));
        await supabase.from("ninhocar_produtos").update({ estoque: novo }).eq("id", it.produto_id);
      }

      cart.clear();
      setOkId(comanda.id);
    } catch (e: any) {
      setErr(e?.message || "Erro ao finalizar comanda.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end md:items-center justify-center p-3">
      <div className="w-full md:max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-bold text-gray-900">Carrinho</div>
          <button onClick={onClose} className="px-3 py-1 rounded-lg border text-sm">
            Fechar
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-auto">
          {okId ? (
            <div className="rounded-xl border bg-green-50 p-4">
              <div className="font-bold text-green-800">Comanda criada com sucesso!</div>
              <div className="text-sm text-green-700 mt-1">
                Código: <span className="font-mono font-semibold">{okId}</span>
              </div>
              <div className="text-sm text-green-700 mt-2">
                Agora o <b>Caixa</b> já consegue ver essa venda.
              </div>
            </div>
          ) : null}

          {err ? (
            <div className="rounded-xl border bg-red-50 p-3 text-sm text-red-700 mb-3">{err}</div>
          ) : null}

          <div className="space-y-3">
            {cart.items.map((it) => (
              <div key={it.produto_id} className="flex items-center justify-between gap-3 border rounded-xl p-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{it.nome}</div>
                  <div className="text-xs text-gray-600">
                    {it.qtd} × {brl(Number(it.preco))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => cart.dec(it.produto_id)} className="w-9 h-9 rounded-xl border">
                    −
                  </button>
                  <div className="w-8 text-center font-semibold">{it.qtd}</div>
                  <button onClick={() => cart.inc(it.produto_id)} className="w-9 h-9 rounded-xl border">
                    +
                  </button>
                  <button
                    onClick={() => cart.remove(it.produto_id)}
                    className="px-3 h-9 rounded-xl border text-sm"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}

            {cart.items.length === 0 ? (
              <div className="text-sm text-gray-500">Carrinho vazio.</div>
            ) : null}
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-3">
            <div className="border rounded-xl p-3">
              <div className="text-sm font-semibold mb-2">Dados do cliente (opcional)</div>
              <input
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                placeholder="Nome"
                className="w-full border rounded-xl px-3 py-2 text-sm mb-2"
              />
              <input
                value={clienteWhats}
                onChange={(e) => setClienteWhats(e.target.value)}
                placeholder="WhatsApp (somente números ou livre)"
                className="w-full border rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div className="border rounded-xl p-3">
              <div className="text-sm font-semibold mb-2">Pagamento / Observação</div>
              <select
                value={pagamento}
                onChange={(e) => setPagamento(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm mb-2"
              >
                <option value="PIX">PIX</option>
                <option value="CARTAO">Cartão</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="OUTRO">Outro</option>
              </select>

              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Observação (opcional)"
                className="w-full border rounded-xl px-3 py-2 text-sm min-h-[84px]"
              />
            </div>
          </div>

          <div className="mt-4 border rounded-xl p-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-xl font-black">{brl(Number(total))}</div>
          </div>
        </div>

        <div className="p-4 border-t flex items-center justify-between gap-3">
          <button
            onClick={() => cart.clear()}
            className="px-4 py-2 rounded-xl border text-sm font-semibold"
            disabled={saving || cart.items.length === 0}
          >
            Limpar
          </button>

          <button
            onClick={finalizar}
            disabled={saving || cart.items.length === 0}
            className={[
              "px-5 py-2 rounded-xl text-sm font-bold",
              saving || cart.items.length === 0 ? "bg-gray-200 text-gray-500" : "bg-black text-white",
            ].join(" ")}
          >
            {saving ? "Salvando..." : "Finalizar e gerar comanda"}
          </button>
        </div>
      </div>
    </div>
  );
}
