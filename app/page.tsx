"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";

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

export default function HomePage() {
  const [itens, setItens] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const categorias = useMemo(() => {
    const set = new Set(itens.map((p) => p.categoria).filter(Boolean));
    return Array.from(set).sort();
  }, [itens]);

  async function carregar() {
    try {
      setCarregando(true);
      setErro(null);

      let query = supabase
        .from("medicamentos_site_view")
        .select("*")
        .eq("disponivel_geral", true) // 🔹 Só mostra produtos disponíveis em alguma farmácia
        .order("nome", { ascending: true });

      if (categoria) query = query.ilike("categoria", categoria);

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

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 🔹 Cabeçalho colorido */}
      <section className="bg-gradient-to-r from-blue-700 to-green-600 text-white py-10">
        <div className="max-w-6xl mx-auto text-center px-4">
          <h1 className="text-3xl font-bold mb-2">Bem-vindo à IA Drogarias</h1>
          <p className="text-lg opacity-90">Inteligência a serviço da sua saúde 💙</p>

          {/* 🔎 Filtros */}
          <div className="mt-6 grid gap-2 sm:grid-cols-3 max-w-3xl mx-auto">
            <input
              placeholder="Buscar por nome ou código de barras"
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

      {/* 🛍️ Produtos */}
      <section className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {erro && <p className="text-red-600">{erro}</p>}
        {carregando && <p>Carregando produtos...</p>}
        {!carregando && itens.length === 0 && <p>Nenhum produto disponível no momento.</p>}

        {itens.map((p) => (
          <div key={p.ean} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
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
              <p className="font-bold text-blue-700 mt-2">{formatarPreco(p.preco_venda)}</p>
              <span className="block mt-1 text-green-600 font-semibold">✅ Disponível</span>
            </div>
          </div>
        ))}
      </section>

      <footer className="text-center text-gray-600 py-6 border-t mt-10">
        © 2025 IA Drogarias — Todos os direitos reservados
      </footer>
    </main>
  );
}
