"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

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

export default function FVCategoriaPage() {
  const params = useParams<{ categoria: string }>();
  const categoria = decodeURIComponent(params.categoria || "");

  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [visiveis, setVisiveis] = useState(60);
  const [rows, setRows] = useState<FVProduto[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("fv_produtos")
          .select("id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,ativo,imagens")
          .eq("ativo", true)
          .eq("categoria", categoria)
          .order("destaque_home", { ascending: false })
          .order("nome", { ascending: true })
          .limit(5000);

        if (error) throw error;
        setRows((data || []) as FVProduto[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [categoria]);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return rows;
    const digits = t.replace(/\D/g, "");
    return rows.filter((p) => {
      const nome = (p.nome || "").toLowerCase();
      if (digits && digits.length >= 8) return p.ean === digits || nome.includes(t);
      return nome.includes(t);
    });
  }, [rows, busca]);

  const lista = filtrados.slice(0, visiveis);

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link href="/fv" className="text-sm text-blue-700 underline">← Voltar</Link>

        <div className="mt-2">
          <h1 className="text-2xl font-bold text-blue-900">{categoria}</h1>
          <p className="text-sm text-gray-600">Mostrando {Math.min(visiveis, filtrados.length)} de {filtrados.length}</p>
        </div>

        <div className="mt-4">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou EAN..."
            className="w-full bg-white border rounded-full px-4 py-2 shadow-sm"
          />
        </div>

        <section className="mt-6">
          {loading ? (
            <p className="text-gray-500">Carregando…</p>
          ) : lista.length === 0 ? (
            <p className="text-gray-500">Nenhum produto encontrado.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
                {lista.map((p) => (
                  <div key={p.id} className="bg-white rounded-lg shadow p-3 hover:shadow-lg transition">
                    <div className="relative">
                      <Image
                        src={firstImg(p.imagens)}
                        alt={p.nome}
                        width={220}
                        height={220}
                        className="mx-auto rounded object-contain h-24 sm:h-28"
                      />
                      {p.em_promocao && p.percentual_off != null && p.percentual_off > 0 && (
                        <span className="absolute top-2 right-2 text-xs bg-red-600 text-white px-2 py-1 rounded">
                          {p.percentual_off}% off
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-gray-500 mt-2 line-clamp-1">{p.laboratorio || "—"}</div>
                    <div className="text-xs sm:text-sm font-medium text-blue-900 mt-1 line-clamp-2">{p.nome}</div>

                    {p.em_promocao && p.preco_promocional ? (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500">De <span className="line-through">{brl(p.pmc)}</span></div>
                        <div className="text-base font-bold text-blue-900">Por {brl(p.preco_promocional)}</div>
                      </div>
                    ) : (
                      <div className="mt-2 text-base font-bold text-blue-900">{brl(p.pmc)}</div>
                    )}

                    <Link
                      href={`/fv/produto/${p.ean}`}
                      className="mt-3 block text-center bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-md text-xs sm:text-sm font-semibold"
                    >
                      Ver produto
                    </Link>
                  </div>
                ))}
              </div>

              {visiveis < filtrados.length && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setVisiveis((v) => v + 60)}
                    className="px-6 py-3 bg-blue-700 text-white font-semibold rounded-full hover:bg-blue-800 transition-all"
                  >
                    Ver mais
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
