"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { supabase } from "../../../lib/supabaseClient";

// ⚙️ Identificação da loja
const LOJA = {
  nome: "Drogarias Fernando",
  slug: "drogarias-fernando",
  whatsapp: "5511952068432",
  corPrimaria: "bg-blue-700",
};

const LIMITE = 40;

type ProdutoLoja = {
  farmacia_slug: string;
  produto_id: string;

  ean: string;
  nome: string;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;
  imagens: string[] | null;

  disponivel_farmacia: boolean | null; // ativo
  estoque: number | null;

  preco_venda: number | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  destaque_home: boolean | null;
};

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "R$ 0,00";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

export default function DrogariasFernandoPage() {
  const [itens, setItens] = useState<ProdutoLoja[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const categorias = useMemo(() => {
    const set = new Set(itens.map((p) => p.categoria).filter(Boolean) as string[]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [itens]);

  function precoFinal(p: ProdutoLoja) {
    const pv = Number(p.preco_venda || 0);
    const promo = Number(p.preco_promocional || 0);
    const emPromo = !!p.em_promocao && promo > 0 && promo < pv;
    return emPromo ? promo : pv;
  }

  // 🔍 Buscar produtos da VIEW por loja
  async function carregar() {
    try {
      setCarregando(true);
      setErro(null);

      let query = supabase
        .from("fv_produtos_loja_view")
        .select(
          "farmacia_slug,produto_id,ean,nome,laboratorio,categoria,apresentacao,imagens,disponivel_farmacia,estoque,preco_venda,em_promocao,preco_promocional,percentual_off,destaque_home"
        )
        .eq("farmacia_slug", LOJA.slug)
        // mostra só os ativos da farmácia (se quiser mostrar tudo, remove essa linha)
        .eq("disponivel_farmacia", true)
        .order("nome", { ascending: true });

      if (categoria) {
        // na view vem categoria do master
        query = query.eq("categoria", categoria);
      }

      if (busca.trim()) {
        const termo = busca.trim();
        const digits = termo.replace(/\D/g, "");
        if (digits.length >= 8 && digits.length <= 14 && digits === termo) {
          // busca por EAN exato (gente grande)
          query = query.eq("ean", digits);
        } else if (digits.length >= 8 && digits.length <= 14) {
          // mistura número + texto
          query = query.or(`ean.eq.${digits},nome.ilike.%${termo}%`);
        } else {
          query = query.or(`nome.ilike.%${termo}%,laboratorio.ilike.%${termo}%,categoria.ilike.%${termo}%`);
        }
      }

      const { data, error } = await query.range(0, LIMITE - 1);
      if (error) throw error;

      setItens((data || []) as ProdutoLoja[]);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, categoria]);

  function linkWhatsApp(p: ProdutoLoja) {
    const msg = `Olá! Tenho interesse no produto:\n• ${p.nome}\n• EAN: ${p.ean}\n• Preço: ${brl(precoFinal(p))}`;
    return `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className={`${LOJA.corPrimaria} text-white py-8`}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-3xl font-bold">{LOJA.nome}</h1>
          <p>Saúde com Inteligência • IA Drogarias</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <input
              placeholder="Buscar por nome ou EAN"
              className="p-2 rounded text-black"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            <select
              className="p-2 rounded text-black"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setBusca("");
                setCategoria("");
              }}
              className="bg-gray-200 text-black rounded p-2"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {erro && <p className="text-red-600">{erro}</p>}
        {carregando && <p>Carregando produtos...</p>}
        {!carregando && itens.length === 0 && <p>Nenhum produto encontrado.</p>}

        {itens.map((p) => {
          const final = precoFinal(p);
          const disponivel = !!p.disponivel_farmacia && (Number(p.estoque || 0) > 0 || p.estoque === null); 
          // ↑ se você ainda não controla estoque, pode deixar null e considerar disponível.

          return (
            <div key={`${p.produto_id}`} className="bg-white rounded-2xl shadow-md overflow-hidden">
              <Image
                src={firstImg(p.imagens)}
                alt={p.nome}
                width={300}
                height={200}
                className="w-full h-48 object-contain bg-gray-50"
              />

              <div className="p-4">
                <h2 className="font-bold text-lg line-clamp-2">{p.nome}</h2>

                <p className="text-xs text-gray-500 mt-1">
                  EAN: <span className="font-mono">{p.ean}</span>
                </p>

                <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                  {p.apresentacao || p.laboratorio || p.categoria || ""}
                </p>

                <p className="font-extrabold text-blue-700 mt-3">{brl(final)}</p>

                <div className="flex justify-between items-center mt-3 gap-2">
                  {disponivel ? (
                    <span className="text-green-600 font-semibold text-sm">Disponível</span>
                  ) : (
                    <span className="text-red-500 font-semibold text-sm">Indisponível</span>
                  )}

                  <a
                    href={linkWhatsApp(p)}
                    target="_blank"
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-semibold"
                    rel="noreferrer"
                  >
                    Pedir no WhatsApp
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
