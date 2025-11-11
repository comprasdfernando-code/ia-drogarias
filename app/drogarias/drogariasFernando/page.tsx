"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

type Produto = {
  id: string;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  preco_venda?: number | null;
  imagem?: string | null;
  estoque?: number | null;
  farmacia_slug?: string | null;
  EAN?: string | null;
};

const LOJA = {
  nome: "Drogarias Fernando",
  slug: "drogarias-fernando",
  whatsapp: "5511952068441", // Ajuste se quiser
  corPrimaria: "from-blue-600 to-emerald-500",
};

export default function DrogariasFernandoPage() {
  const [itens, setItens] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [buscaTemp, setBuscaTemp] = useState("");

  const [categoria, setCategoria] = useState("");
  const [pagina, setPagina] = useState(1);
  const LIMITE = 24;
  const LOJA = {
  id: 2,
  nome: "Drogarias Fernando",
  whatsapp: "5511948843725", // ✅ número do WhatsApp
  corPrimaria: "from-blue-700 to-cyan-500" // ✅ gradiente da loja
};



  const categorias = useMemo(() => {
    const set = new Set(
      itens
        .map((p) => (p.categoria || "").trim())
        .filter((c) => c && c.length > 0)
    );
    return Array.from(set).sort();
  }, [itens]);

  async function carregar() {
    try {
      setCarregando(true);
      setErro(null);

      const from = (pagina - 1) * LIMITE;
      const to = from + LIMITE - 1;

      let query = supabase
        .from("medicamentos_site_view")
        .select("*")
        .eq("farmacia_id", LOJA.id)

        .order("nome", { ascending: true })
        .range(from, to);

      if (categoria) query = query.ilike("categoria", categoria);
      if (busca) {
        const termo = busca.trim();
        query = query.or(`nome.ilike.%${termo}%,descricao.ilike.%${termo}%,EAN.ilike.%${termo}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItens((prev) => (pagina === 1 ? data || [] : [...prev, ...(data || [])]));
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar produtos");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);
useEffect(() => {
  const delay = setTimeout(() => {
    setBusca(buscaTemp.trim());
  }, 300); // espera 0.3 s após parar de digitar/ler
  return () => clearTimeout(delay);
}, [buscaTemp]);
  useEffect(() => {
    setPagina(1);
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, categoria]);

  function formatarPreco(v?: number | null) {
    if (v == null) return "—";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function linkWhatsApp(p: Produto) {
    const msg = `Olá, tenho interesse no produto: ${p.nome}`;
    return `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className={`bg-gradient-to-r ${LOJA.corPrimaria} text-white`}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold">{LOJA.nome}</h1>
          <p className="opacity-90">Saúde com Inteligência • IA Drogarias</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <input
  value={buscaTemp}
  onChange={(e) => setBuscaTemp(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setBusca(e.currentTarget.value.trim());
    }
  }}
  placeholder="Buscar por nome, descrição ou código de barras…"
  className="px-4 py-2 rounded text-gray-900"
/>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="px-4 py-2 rounded text-gray-900"
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
                setPagina(1);
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded transition"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-8">
        {erro && (
          <div className="mb-6 rounded border border-red-300 bg-red-50 text-red-800 px-4 py-3">
            {erro}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {itens.map((p) => (
            <article
              key={p.id}
              className="rounded-lg border bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-t-lg overflow-hidden">
                {p.imagem ? (
                  <Image
                    src={p.imagem}
                    alt={p.nome}
                    fill
                    sizes="(max-width:768px) 100vw, 33vw"
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    sem imagem
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold line-clamp-2">{p.nome}</h3>
                {p.descricao && (
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {p.descricao}
                  </p>
                )}

                {p.EAN && (
  <p className="text-xs text-gray-500 mt-1">EAN: {p.EAN}</p>
)}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold">
                    {formatarPreco(p.preco_venda)}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      (p.estoque ?? 0) > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {(p.estoque ?? 0) > 0 ? "Disponível" : "Indisponível"}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={linkWhatsApp(p)}
                    target="_blank"
                    className={`w-full text-center font-medium px-4 py-2 rounded ${
                      (p.estoque ?? 0) > 0
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {(p.estoque ?? 0) > 0
                      ? "Pedir no WhatsApp"
                      : "Indisponível"}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPagina((n) => Math.max(1, n - 1))}
            disabled={pagina === 1 || carregando}
            className="px-4 py-2 rounded border bg-white disabled:opacity-50"
          >
            Voltar
          </button>
          <span className="text-sm text-gray-600">Página {pagina}</span>
          <button
            onClick={() => setPagina((n) => n + 1)}
            disabled={carregando || itens.length < LIMITE}
            className="px-4 py-2 rounded border bg-white disabled:opacity-50"
          >
            Próxima
          </button>
        </div>

        {carregando && (
          <p className="text-center text-gray-500 mt-4">Carregando…</p>
        )}
      </section>
    </main>
  );
}