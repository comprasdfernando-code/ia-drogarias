"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "../../_components/CartProvider";

type Produto = {
  id: string;
  nome: string;
  marca?: string | null;
  descricao?: string | null;
  preco: number;
  estoque: number;
  imagem_url?: string | null;
  ean?: string | null;
};

function brl(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProdutoPage() {
  const params = useParams();
  const router = useRouter();
  const id = useMemo(() => String((params as any)?.id || ""), [params]);

  const { addItem } = useCart();

  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        if (!id) throw new Error("Produto inválido (id vazio).");

        const { data, error } = await supabase
          .from("glow10_produtos")
          .select("id,nome,marca,descricao,preco,estoque,imagem_url,ean")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("Produto não encontrado.");

        if (alive) setProduto(data as Produto);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Erro ao carregar produto.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  function onAdd() {
    if (!produto) return;
    if ((produto.estoque ?? 0) <= 0) return;

    addItem({
      produto_id: produto.id,
      nome: produto.nome,
      preco_unit: Number(produto.preco) || 0,
      quantidade: 1,
      foto_url: produto.imagem_url || null,
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">Carregando produto...</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="text-lg font-semibold">Não deu pra abrir esse produto</div>
          <div className="text-white/70">{err}</div>

          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="rounded-xl px-4 py-2 bg-white text-black font-semibold"
            >
              Voltar
            </button>

            <button
              onClick={() => location.reload()}
              className="rounded-xl px-4 py-2 bg-white/10 border border-white/15 text-white"
            >
              Tentar de novo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!produto) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-zinc-900/40 border border-white/10 overflow-hidden">
          <div className="relative w-full aspect-square bg-black/30">
            {produto.imagem_url ? (
              <Image
                src={produto.imagem_url}
                alt={produto.nome}
                fill
                className="object-contain p-6"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40">
                Sem foto
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs text-white/60 uppercase">{produto.marca || " "}</div>
          <h1 className="text-2xl font-bold leading-tight">{produto.nome}</h1>

          <div className="text-3xl font-extrabold">{brl(produto.preco)}</div>
          <div className="text-sm text-white/60">Estoque: {produto.estoque ?? 0}</div>

          {produto.descricao ? (
            <p className="text-white/75 leading-relaxed">{produto.descricao}</p>
          ) : null}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onAdd}
              disabled={(produto.estoque ?? 0) <= 0}
              className="flex-1 rounded-xl py-3 font-semibold bg-white text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {(produto.estoque ?? 0) > 0 ? "Adicionar ao carrinho" : "Sem estoque"}
            </button>

            <button
              onClick={() => router.push("/loja/glow10")}
              className="rounded-xl px-4 py-3 bg-white/10 border border-white/15 text-white"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
