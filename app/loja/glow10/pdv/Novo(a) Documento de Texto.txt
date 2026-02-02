"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import CartModal from "../_components/CartModal";
import { useCartUI } from "../_components/CartProvider";

function brl(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

export default function Glow10PDV() {
  const { items, openCart, addItem } = useCartUI();

  const cartCount = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.quantidade) || 0), 0),
    [items]
  );

  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function buscarEAdicionar() {
    const c = onlyDigits(codigo.trim());
    if (!c) return;

    setLoading(true);
    setMsg(null);
    try {
      // tenta achar por EAN ou codigo_interno
      const { data, error } = await supabase
        .from("mk_produtos")
        .select("id,nome,preco,quantidade,foto_url,ean,codigo_interno,ativo")
        .eq("ativo", true)
        .or(`ean.eq.${c},codigo_interno.eq.${c}`)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Produto não encontrado (EAN/código interno).");
      if (Number(data.quantidade ?? 0) <= 0) throw new Error("Sem estoque.");

      addItem({
        produto_id: String(data.id),
        nome: String(data.nome ?? ""),
        preco_unit: Number(data.preco ?? 0),
        quantidade: 1,
        foto_url: data.foto_url ?? null,
      });

      setCodigo("");
      setMsg(`Adicionado: ${data.nome} (${brl(data.preco)})`);
      openCart();
    } catch (e: any) {
      setMsg(e?.message || "Erro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <CartModal mode="PDV" />

      <header className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold">PDV — Glow10</div>
          <div className="text-white/60 text-sm">Leitura rápida • EAN / código interno</div>
        </div>

        <button
          onClick={openCart}
          className="rounded-2xl bg-white text-black font-bold px-5 py-3"
        >
          Carrinho ({cartCount})
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-16">
        <div className="rounded-3xl bg-zinc-900/40 border border-white/10 p-5">
          <div className="text-sm text-white/60 mb-2">Bipou o leitor? Cole/digite o EAN ou código interno:</div>

          <div className="flex gap-2">
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscarEAdicionar()}
              placeholder="EAN ou código interno..."
              className="flex-1 rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10"
            />
            <button
              onClick={buscarEAdicionar}
              disabled={loading}
              className="rounded-2xl bg-white px-5 py-3 font-bold text-black disabled:opacity-50"
            >
              {loading ? "Buscando..." : "Adicionar"}
            </button>
          </div>

          {msg ? (
            <div className="mt-3 text-sm text-white/80">{msg}</div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
