"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient"; // ajuste se seu path for outro

const WHATSAPP = "5511948343725";

type FVProduto = {
  id: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;
  pmc: number | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  destaque_home: boolean | null;
  ativo: boolean | null;
  imagens: string[] | null;
};

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

function buildWhatsAppLink(numeroE164: string, msg: string) {
  const clean = numeroE164.replace(/\D/g, "");
  const text = encodeURIComponent(msg);
  return `https://wa.me/${clean}?text=${text}`;
}

export default function FarmaciaVirtualHome() {
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  // home (categorias)
  const [homeProdutos, setHomeProdutos] = useState<FVProduto[]>([]);
  // resultados da busca
  const [resultado, setResultado] = useState<FVProduto[]>([]);

  // carrega um lote “home-friendly”: destaque primeiro e depois por categoria/nome
  useEffect(() => {
    async function loadHome() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("fv_produtos")
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens"
          )
          .eq("ativo", true)
          .order("destaque_home", { ascending: false })
          .order("categoria", { ascending: true })
          .order("nome", { ascending: true })
          .limit(1200); // suficiente pra montar 6 categorias * 6 itens com folga

        if (error) throw error;
        setHomeProdutos((data || []) as FVProduto[]);
      } catch (e) {
        console.error("Erro loadHome:", e);
      } finally {
        setLoading(false);
      }
    }
    loadHome();
  }, []);

  // busca por nome ou EAN
  useEffect(() => {
    async function search() {
      const t = busca.trim();
      if (!t) {
        setResultado([]);
        return;
      }

      setLoading(true);
      try {
        const digits = t.replace(/\D/g, "");
        let query = supabase
          .from("fv_produtos")
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens"
          )
          .eq("ativo", true)
          .limit(80);

        // se for só número -> tenta EAN exato + fallback nome
        if (digits.length >= 8 && digits.length <= 14) {
          query = query.or(`ean.eq.${digits},nome.ilike.%${t}%`);
        } else {
          query = query.ilike("nome", `%${t}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        // ordena no front pra ficar “bonito”
        const ordered = (data || []).sort((a: any, b: any) =>
          (a.nome || "").localeCompare(b.nome || "")
        );

        setResultado(ordered as FVProduto[]);
      } catch (e) {
        console.error("Erro search:", e);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(search, 350);
    return () => clearTimeout(timer);
  }, [busca]);

  // monta as 6 categorias com 6 itens cada (quando não está buscando)
  const categoriasHome = useMemo(() => {
    if (busca.trim()) return [];

    const map = new Map<string, FVProduto[]>();
    for (const p of homeProdutos) {
      const cat = (p.categoria || "Outros").trim() || "Outros";
      if (!map.has(cat)) map.set(cat, []);
      const arr = map.get(cat)!;
      if (arr.length < 6) arr.push(p);
    }

    // pega 6 categorias (as primeiras na ordem do lote)
    return Array.from(map.entries()).slice(0, 6);
  }, [homeProdutos, busca]);

  const textoAviso =
    "Finalização do pedido: nós analisamos a disponibilidade e retornamos em poucos minutos para confirmar.";

  return (
    <main className="w-full mx-auto bg-gray-50 pb-24">
      {/* Topo */}
      <section className="px-4 pt-6 max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-800">
          Farmácia Virtual — IA Drogarias
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">{textoAviso}</p>

        {/* Busca */}
        <div className="mt-4 flex gap-2 items-center">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite o nome ou EAN..."
            className="w-full bg-white border rounded-full px-4 py-2 shadow-sm"
          />
          <a
            href={buildWhatsAppLink(WHATSAPP, "Olá! Quero tirar uma dúvida na Farmácia Virtual.")}
            className="bg-green-600 text-white px-4 py-2 rounded-full shadow-sm hover:bg-green-700"
          >
            WhatsApp
          </a>
        </div>
      </section>

      {/* Resultado da busca */}
      {busca.trim() ? (
        <section className="max-w-6xl mx-auto px-4 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Resultados ({resultado.length})
          </h2>

          {loading ? (
            <p className="text-gray-500">Carregando…</p>
          ) : resultado.length === 0 ? (
            <p className="text-gray-500">Nenhum produto encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
              {resultado.map((p) => (
                <ProdutoCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>
      ) : (
        // Home por categorias
        <section className="max-w-6xl mx-auto px-4 mt-8 space-y-10">
          {loading ? (
            <p className="text-gray-500">Carregando categorias…</p>
          ) : (
            categoriasHome.map(([cat, itens]) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-800">{cat}</h2>
                  <Link
                    href={`/fv/categoria/${encodeURIComponent(cat)}`}
                    className="text-sm text-blue-700 underline"
                  >
                    Ver todos
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
                  {itens.map((p) => (
                    <ProdutoCard key={p.id} p={p} />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </main>
  );
}

function ProdutoCard({ p }: { p: FVProduto }) {
  const precoFinal =
    p.em_promocao && p.preco_promocional ? p.preco_promocional : p.pmc;

  return (
    <div className="bg-white rounded-lg shadow p-3 hover:shadow-lg transition flex flex-col justify-between">
      <div className="relative">
        <Image
          src={firstImg(p.imagens)}
          alt={p.nome || "Produto"}
          width={220}
          height={220}
          className="mx-auto rounded object-contain h-24 sm:h-28"
        />

        {/* % OFF colado no preço final (Ultrafarma style) */}
        {p.em_promocao && p.percentual_off != null && p.percentual_off > 0 && (
          <span className="absolute top-2 right-2 text-xs bg-red-600 text-white px-2 py-1 rounded">
            {p.percentual_off}% off
          </span>
        )}
      </div>

      <div className="mt-2">
        <div className="text-[11px] text-gray-500 line-clamp-1">
          {p.laboratorio || "—"}
        </div>

        <h3 className="font-medium text-blue-900 mt-1 text-xs sm:text-sm line-clamp-2">
          {p.nome}
        </h3>

        {p.apresentacao && (
          <div className="text-[11px] text-gray-600 mt-1 line-clamp-1">
            {p.apresentacao}
          </div>
        )}

        {/* preços */}
        {p.em_promocao && p.preco_promocional ? (
          <div className="mt-2">
            <div className="text-xs text-gray-500">
              De <span className="line-through">{brl(p.pmc)}</span>
            </div>
            <div className="text-base font-bold text-blue-900">
              Por {brl(precoFinal)}
            </div>
          </div>
        ) : (
          <div className="mt-2 text-base font-bold text-blue-900">
            {brl(precoFinal)}
          </div>
        )}

        <Link
          href={`/fv/produto/${p.ean}`}
          className="mt-3 block text-center bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-md text-xs sm:text-sm font-semibold"
        >
          Ver produto
        </Link>
      </div>
    </div>
  );
}
