"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import HeaderPremium from "../../../_components/HeaderPremium";

export default function NovoProduto() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [nome, setNome] = useState("");
  const [marca, setMarca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ean, setEan] = useState("");
  const [descricao, setDescricao] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");

  const [preco, setPreco] = useState("0");
  const [promoAtiva, setPromoAtiva] = useState(false);
  const [precoPromo, setPrecoPromo] = useState("");
  const [quantidade, setQuantidade] = useState("0");
  const [ativo, setAtivo] = useState(true);

  async function salvar() {
    if (!nome.trim()) return alert("Informe o nome do produto.");
    setLoading(true);

    try {
      const payload: any = {
        nome: nome.trim(),
        marca: marca.trim() || null,
        categoria: categoria.trim() || null,
        ean: ean.trim() || null,
        descricao: descricao.trim() || null,
        foto_url: fotoUrl.trim() || null,
        preco: Number(preco || 0),
        promo_ativa: !!promoAtiva,
        preco_promocional: promoAtiva && precoPromo ? Number(precoPromo) : null,
        quantidade: Number(quantidade || 0),
        ativo: !!ativo,
      };

      const { data, error } = await supabase.from("mk_produtos").insert(payload).select("id").single();
      if (error) throw error;

      router.push(`/loja/glow10/admin/produtos/${data!.id}`);
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderPremium />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-semibold">Novo produto</h1>
        <p className="text-white/70 mt-1">Se não tiver EAN, o sistema gera código interno de 5 dígitos automaticamente.</p>

        <div className="mt-6 space-y-4">
          <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 space-y-3">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do produto *"
              className="w-full rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 outline-none"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Marca"
                className="w-full rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 outline-none"
              />
              <input
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Categoria (ex: Batom, Base, Skincare)"
                className="w-full rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 outline-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={ean}
                onChange={(e) => setEan(e.target.value)}
                placeholder="EAN (opcional)"
                className="w-full rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 outline-none"
              />
              <input
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                placeholder="Foto URL (opcional)"
                className="w-full rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 outline-none"
              />
            </div>

            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição (opcional)"
              className="w-full min-h-[110px] rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 outline-none"
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <input
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="Preço"
                className="w-full rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 outline-none"
              />
              <input
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="Quantidade (estoque)"
                className="w-full rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 outline-none"
              />
              <label className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                <span className="text-sm text-white/80">Ativo</span>
                <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                <span className="text-sm text-white/80">Promo ativa</span>
                <input type="checkbox" checked={promoAtiva} onChange={(e) => setPromoAtiva(e.target.checked)} />
              </label>

              <input
                value={precoPromo}
                onChange={(e) => setPrecoPromo(e.target.value)}
                placeholder="Preço promocional"
                disabled={!promoAtiva}
                className="w-full rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <button
            disabled={loading}
            onClick={salvar}
            className="w-full rounded-2xl bg-white py-3 font-semibold text-black disabled:opacity-50"
          >
            {loading ? "Salvando…" : "Salvar produto"}
          </button>
        </div>
      </div>
    </div>
  );
}
