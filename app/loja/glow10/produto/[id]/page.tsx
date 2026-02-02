"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function genInternal5() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export default function AdminProdutoForm() {
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => String((params as any)?.id || ""), [params]);
  const isNew = id === "novo" || !id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!isNew);

  const [nome, setNome] = useState("");
  const [marca, setMarca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ean, setEan] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState<number>(0);
  const [quantidade, setQuantidade] = useState<number>(0);
  const [ativo, setAtivo] = useState<boolean>(true);
  const [promoAtiva, setPromoAtiva] = useState<boolean>(false);
  const [precoPromocional, setPrecoPromocional] = useState<number>(0);

  useEffect(() => {
    if (isNew) return;

    let alive = true;

    async function load() {
      try {
        setInitialLoading(true);
        const { data, error } = await supabase
          .from("mk_produtos")
          .select("id,nome,marca,categoria,ean,foto_url,descricao,preco,quantidade,ativo,promo_ativa,preco_promocional")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("Produto não encontrado.");

        if (!alive) return;

        setNome(data.nome ?? "");
        setMarca(data.marca ?? "");
        setCategoria(data.categoria ?? "");
        setEan(data.ean ?? "");
        setFotoUrl(data.foto_url ?? "");
        setDescricao(data.descricao ?? "");
        setPreco(Number(data.preco ?? 0));
        setQuantidade(Number(data.quantidade ?? 0));
        setAtivo(Boolean(data.ativo ?? true));
        setPromoAtiva(Boolean(data.promo_ativa ?? false));
        setPrecoPromocional(Number(data.preco_promocional ?? 0));
      } catch (e: any) {
        alert(e?.message || "Erro ao carregar produto");
        router.push("/loja/glow10/admin");
      } finally {
        if (alive) setInitialLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id, isNew, router]);

  async function salvar() {
    if (!nome.trim()) return alert("Nome do produto é obrigatório.");

    setLoading(true);
    try {
      const eanDigits = onlyDigits(ean);
      const eanFinal = eanDigits.length ? eanDigits : null;

      // se não tiver EAN, gera código interno 5 dígitos
      const codigoInterno = eanFinal ? null : genInternal5();

      const payload: any = {
        nome: nome.trim(),
        marca: marca.trim() || null,
        categoria: categoria.trim() || null,
        ean: eanFinal,
        codigo_interno: codigoInterno, // se sua tabela usar outro nome, ajuste aqui
        foto_url: fotoUrl.trim() || null,
        descricao: descricao.trim() || null,
        preco: Number(preco) || 0,
        quantidade: Number(quantidade) || 0,
        ativo: Boolean(ativo),
        promo_ativa: Boolean(promoAtiva),
        preco_promocional: promoAtiva ? Number(precoPromocional) || 0 : null,
      };

      if (isNew) {
        const { error } = await supabase.from("mk_produtos").insert(payload);
        if (error) throw error;
        alert("Produto criado!");
        router.push("/loja/glow10/admin");
      } else {
        const { error } = await supabase.from("mk_produtos").update(payload).eq("id", id);
        if (error) throw error;
        alert("Produto atualizado!");
        router.push("/loja/glow10/admin");
      }
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return <div className="min-h-screen bg-black text-white p-8">Carregando…</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">{isNew ? "Novo produto" : "Editar produto"}</h1>
        <p className="text-white/60 mt-2">
          Se não tiver EAN, o sistema gera código interno de 5 dígitos automaticamente.
        </p>

        <div className="mt-6 rounded-3xl bg-zinc-900/40 border border-white/10 p-5 space-y-3">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do produto *"
            className="w-full rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10"
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              placeholder="Marca"
              className="rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10"
            />
            <input
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Categoria (ex: Batom, Base, Skincare)"
              className="rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={ean}
              onChange={(e) => setEan(e.target.value)}
              placeholder="EAN (opcional)"
              className="rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10"
            />
            <input
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              placeholder="Foto URL (opcional)"
              className="rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10"
            />
          </div>

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            className="w-full min-h-[120px] rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10"
          />

          <div className="grid sm:grid-cols-3 gap-3">
            <input
              value={preco}
              onChange={(e) => setPreco(Number(e.target.value))}
              placeholder="Preço"
              type="number"
              step="0.01"
              className="rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10"
            />
            <input
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              placeholder="Estoque"
              type="number"
              className="rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10"
            />
            <label className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <span>Ativo</span>
              <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <span>Promo ativa</span>
              <input type="checkbox" checked={promoAtiva} onChange={(e) => setPromoAtiva(e.target.checked)} />
            </label>

            <input
              value={precoPromocional}
              onChange={(e) => setPrecoPromocional(Number(e.target.value))}
              placeholder="Preço promocional"
              type="number"
              step="0.01"
              disabled={!promoAtiva}
              className="rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10 disabled:opacity-50"
            />
          </div>
        </div>

        <button
          disabled={loading}
          onClick={salvar}
          className="mt-6 w-full rounded-2xl bg-white py-4 font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Salvando…" : "Salvar produto"}
        </button>
      </div>
    </div>
  );
}
