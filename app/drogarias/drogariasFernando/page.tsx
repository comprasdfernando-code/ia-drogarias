"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { supabase } from "../../../lib/supabaseClient";

// ⚙️ Identificação da loja
const LOJA = {
  nome: "Drogarias Fernando",
  slug: "drogarias-fernando",
  whatsapp: "5511952068432", // substitui pelo número correto
  corPrimaria: "bg-blue-700",
};

const LIMITE = 40;

type Produto = {
  ean: string;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  imagem?: string | null;
  preco_venda?: string | null;
  estoque_total?: number | null;
  disponivel_geral?: boolean | null;
  farmacia_id?: string | null;
  disponivel_farmacia?: boolean | null;
};

export default function DrogariasFernandoPage() {
  const [itens, setItens] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const categorias = useMemo(() => {
    const set = new Set(itens.map((p) => p.categoria).filter(Boolean));
    return Array.from(set).sort();
  }, [itens]);

  // 🔍 Buscar produtos
  async function carregar() {
    try {
      setCarregando(true);
      setErro(null);

      let query = supabase.from("medicamentos_site_view").select("*").order("nome", { ascending: true });

      // Filtro por farmácia específica
      query = query.eq("farmacia_id", LOJA.slug);

      // Filtro de categoria
      if (categoria) query = query.ilike("categoria", categoria);

      // Filtro de busca
      if (busca.trim()) {
        const termo = busca.trim();
        query = query.or(`nome.ilike.%${termo}%,descricao.ilike.%${termo}%,ean.ilike.%${termo}%`);
      }

      const { data, error } = await query.range(0, LIMITE - 1);

      if (error) throw error;
      setItens(data || []);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [busca, categoria]);

  function formatarPreco(v: string | null) {
    if (!v) return "R$ 0,00";
    const num = parseFloat(v);
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function linkWhatsApp(p: Produto) {
    const msg = `Olá, tenho interesse no produto: ${p.nome}`;
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
              placeholder="Buscar por nome ou código"
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

        {itens.map((p) => (
          <div key={p.ean} className="bg-white rounded-2xl shadow-md overflow-hidden">
            <Image
              src={p.imagem || "/produtos/caixa-padrao.png"}
              alt={p.nome}
              width={300}
              height={200}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="font-bold text-lg">{p.nome}</h2>
              <p className="text-sm text-gray-600">{p.descricao}</p>
              <p className="font-bold text-blue-600 mt-2">{formatarPreco(p.preco_venda)}</p>

              <div className="flex justify-between items-center mt-2">
                {p.disponivel_farmacia ? (
                  <span className="text-green-600 font-semibold">Disponível</span>
                ) : (
                  <span className="text-red-500 font-semibold">Indisponível</span>
                )}
                <a
                  href={linkWhatsApp(p)}
                  target="_blank"
                  className="bg-green-500 text-white px-3 py-1 rounded-md text-sm"
                >
                  Pedir no WhatsApp
                </a>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
