"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useCartUI } from "./CartProvider";

function brl(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Props = {
  mode: "ECOMMERCE" | "PDV";
};

export default function CartModal({ mode }: Props) {
  const { items, isOpen, closeCart, inc, dec, remove, subtotal, clear } = useCartUI();

  const [loading, setLoading] = useState(false);

  // cliente
  const [clienteNome, setClienteNome] = useState("");
  const [clienteWhats, setClienteWhats] = useState("");

  // pagamento
  const [pagamento, setPagamento] = useState<"pix" | "cartao" | "dinheiro">("pix");

  // entrega (só e-commerce)
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [complemento, setComplemento] = useState("");
  const [referencia, setReferencia] = useState("");
  const [taxaEntrega, setTaxaEntrega] = useState<number>(0);

  const cartCount = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.quantidade) || 0), 0),
    [items]
  );

  const total = useMemo(() => {
    const t = Number(subtotal || 0) + (mode === "ECOMMERCE" ? Number(taxaEntrega || 0) : 0);
    return Number.isFinite(t) ? t : Number(subtotal || 0);
  }, [subtotal, taxaEntrega, mode]);

  async function finalizar() {
    if (items.length === 0) return;

    // validações do e-commerce (só entrega)
    if (mode === "ECOMMERCE") {
      if (!endereco.trim() || !bairro.trim() || !numero.trim()) {
        alert("Preencha Endereço, Número e Bairro (entrega obrigatória).");
        return;
      }
    }

    setLoading(true);
    try {
      // 1) cria venda
      const { data: venda, error: e1 } = await supabase
        .from("mk_vendas")
        .insert({
          status: "CRIADA",
          canal: mode,
          cliente_nome: clienteNome || null,
          cliente_whatsapp: clienteWhats || null,

          subtotal,
          total,

          pagamento_metodo: pagamento,

          entrega_tipo: mode === "ECOMMERCE" ? "entrega" : null,
          entrega_endereco: mode === "ECOMMERCE" ? endereco : null,
          entrega_numero: mode === "ECOMMERCE" ? numero : null,
          entrega_bairro: mode === "ECOMMERCE" ? bairro : null,
          entrega_complemento: mode === "ECOMMERCE" ? complemento : null,
          entrega_referencia: mode === "ECOMMERCE" ? referencia : null,
          entrega_taxa: mode === "ECOMMERCE" ? Number(taxaEntrega || 0) : null,
        })
        .select("id")
        .single();

      if (e1 || !venda) throw e1 || new Error("Falha ao criar venda");

      // 2) itens
      const itensInsert = items.map((it) => ({
        venda_id: venda.id,
        produto_id: it.produto_id,
        nome_snapshot: it.nome,
        preco_unit: it.preco_unit,
        quantidade: it.quantidade,
      }));

      const { error: e2 } = await supabase.from("mk_venda_itens").insert(itensInsert);
      if (e2) throw e2;

      // 3) debita estoque
      for (const it of items) {
        const { error: e3 } = await supabase.rpc("mk_debitar_estoque_simplificado", {
          p_produto_id: it.produto_id,
          p_qtd: it.quantidade,
        });
        if (e3) throw e3;
      }

      clear();
      closeCart();

      alert(
        `Pedido criado! (#${String(venda.id).slice(0, 8)})\n` +
          (mode === "ECOMMERCE"
            ? "Aguardando confirmação de pagamento no Caixa."
            : "Envie pro Caixa/Painel para confirmar pagamento.")
      );
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
          <div className="text-xl font-semibold">
            {mode === "ECOMMERCE" ? "Seu pedido" : "PDV • Carrinho"} ({cartCount})
          </div>
          <button onClick={closeCart} className="text-white/70 hover:text-white">
            Fechar
          </button>
        </div>

        {/* ITENS */}
        <div className="mt-4 space-y-3 max-h-[40vh] overflow-auto pr-1">
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

        {/* CHECKOUT */}
        <div className="mt-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 space-y-3">
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

          {/* ENDEREÇO (só e-commerce) */}
          {mode === "ECOMMERCE" ? (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Endereço (rua/av.) *"
                  className="sm:col-span-2 rounded-2xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10"
                />
                <input
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Número *"
                  className="rounded-2xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Bairro *"
                  className="rounded-2xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10"
                />
                <input
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Complemento (opcional)"
                  className="rounded-2xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10"
                />
              </div>

              <input
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Referência (opcional)"
                className="rounded-2xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10"
              />

              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={taxaEntrega}
                  onChange={(e) => setTaxaEntrega(Number(e.target.value))}
                  type="number"
                  step="0.01"
                  placeholder="Taxa de entrega (opcional)"
                  className="rounded-2xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10"
                />
                <div className="text-xs text-white/60 flex items-center">
                  * Por enquanto: somente <b className="ml-1">entrega</b>, sem retirada.
                </div>
              </div>
            </>
          ) : null}

          {/* PAGAMENTO */}
          <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <div className="text-sm font-semibold mb-2">Forma de pagamento</div>
            <div className="flex flex-wrap gap-2">
              {(["pix", "cartao", "dinheiro"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPagamento(m)}
                  className={`rounded-xl px-3 py-2 text-sm border ${
                    pagamento === m ? "bg-white text-black border-white" : "bg-transparent border-white/15 text-white"
                  }`}
                >
                  {m === "pix" ? "PIX" : m === "cartao" ? "Cartão" : "Dinheiro"}
                </button>
              ))}
            </div>
          </div>

          {/* TOTAL */}
          <div className="flex items-center justify-between">
            <div className="text-white/70">Subtotal</div>
            <div className="font-bold">{brl(subtotal)}</div>
          </div>

          {mode === "ECOMMERCE" ? (
            <div className="flex items-center justify-between">
              <div className="text-white/70">Entrega</div>
              <div className="font-bold">{brl(taxaEntrega || 0)}</div>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <div className="text-white/70">Total</div>
            <div className="text-lg font-extrabold">{brl(total)}</div>
          </div>

          <button
            disabled={items.length === 0 || loading}
            onClick={finalizar}
            className="mt-2 w-full rounded-2xl bg-white py-3 font-semibold text-black disabled:opacity-50"
          >
            {loading ? "Finalizando…" : mode === "ECOMMERCE" ? "Finalizar pedido" : "Finalizar (PDV)"}
          </button>

          <div className="text-xs text-white/50">
            * Pagamento será confirmado no Caixa (fluxo PDV).
          </div>
        </div>
      </div>
    </div>
  );
}
