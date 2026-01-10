// app/dfdistribuidora/pdv/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

type DFProduto = {
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

type CartItem = {
  id: string;
  ean: string;
  nome: string;
  imagem: string | null;
  preco: number;
  qtd: number;
};

const PROD_TABLE = "df_produtos";
const RPC_SEARCH = "df_search_produtos"; // se não existir, fallback
const WHATS = "5511952068432";

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0 && imagens[0]) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

function calcOff(pmc?: number | null, promo?: number | null) {
  const a = Number(pmc || 0);
  const b = Number(promo || 0);
  if (!a || !b || b >= a) return 0;
  return Math.round(((a - b) / a) * 100);
}

function precoFinal(p: {
  pmc?: number | null;
  em_promocao?: boolean | null;
  preco_promocional?: number | null;
  percentual_off?: number | null;
}) {
  const pmc = Number(p.pmc || 0);
  const promo = Number(p.preco_promocional || 0);
  const emPromo = !!p.em_promocao && promo > 0 && (!pmc || promo < pmc);
  const final = emPromo ? promo : pmc;
  const offFromDb = Number(p.percentual_off || 0);
  const off = emPromo ? (offFromDb > 0 ? offFromDb : calcOff(pmc, promo)) : 0;
  return { emPromo, pmc, promo, final, off };
}

function waLink(phone: string, msg: string) {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

export default function PDVDF() {
  const [produtos, setProdutos] = useState<DFProduto[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [loadingBusca, setLoadingBusca] = useState(false);

  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [abrirCarrinho, setAbrirCarrinho] = useState(false);

  // ✅ Carrega base inicial (lista grande) — igual ao seu FV home
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from(PROD_TABLE)
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens"
          )
          .eq("ativo", true)
          .limit(2000);

        if (error) throw error;
        setProdutos((data || []) as DFProduto[]);
      } catch (e) {
        console.error("Erro load produtos PDV DF:", e);
        setProdutos([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ✅ Busca (RPC se existir, fallback se não existir)
  useEffect(() => {
    async function run() {
      const raw = busca.trim();
      if (!raw) return;

      setLoadingBusca(true);
      try {
        const normalized = raw
          .toLowerCase()
          .replace(/(\d+)\s*(mg|ml|mcg|g|ui|iu)/gi, "$1 $2")
          .replace(/\s+/g, " ")
          .trim();

        const { data, error } = await supabase.rpc(RPC_SEARCH, { q: normalized, lim: 120 });
        if (error) throw error;

        setProdutos(((data || []) as DFProduto[]) ?? []);
      } catch (e) {
        // fallback (não quebra)
        try {
          const digits = raw.replace(/\D/g, "");
          let query = supabase
            .from(PROD_TABLE)
            .select(
              "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens"
            )
            .eq("ativo", true)
            .limit(200);

          if (digits.length >= 8 && digits.length <= 14) query = query.or(`ean.eq.${digits},nome.ilike.%${raw}%`);
          else query = query.ilike("nome", `%${raw}%`);

          const { data, error } = await query;
          if (error) throw error;

          setProdutos((data || []) as DFProduto[]);
        } catch (e2) {
          console.error("Erro fallback busca PDV DF:", e2);
        }
      } finally {
        setLoadingBusca(false);
      }
    }

    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [busca]);

  const totalCarrinho = useMemo(() => {
    return carrinho.reduce((acc, item) => acc + Number(item.preco || 0) * Number(item.qtd || 0), 0);
  }, [carrinho]);

  const qtdCarrinho = useMemo(() => carrinho.reduce((acc, it) => acc + it.qtd, 0), [carrinho]);

  const adicionar = (p: DFProduto) => {
    const pr = precoFinal(p);
    const preco = Number(pr.final || 0);

    setCarrinho((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qtd: copy[idx].qtd + 1, preco };
        return copy;
      }
      return [
        ...prev,
        {
          id: p.id,
          ean: p.ean,
          nome: p.nome,
          imagem: firstImg(p.imagens),
          preco,
          qtd: 1,
        },
      ];
    });
  };

  const diminuir = (p: DFProduto) => {
    setCarrinho((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx < 0) return prev;
      const item = prev[idx];
      if (item.qtd <= 1) return prev.filter((x) => x.id !== p.id);
      const copy = [...prev];
      copy[idx] = { ...copy[idx], qtd: copy[idx].qtd - 1 };
      return copy;
    });
  };

  const qtdNoCarrinho = (id: string) => carrinho.find((x) => x.id === id)?.qtd || 0;

  const mensagemWhats = useMemo(() => {
    if (!carrinho.length) return "Pedido DF Distribuidora:\n\n(sem itens)";
    let msg = "Pedido DF Distribuidora:\n\n";
    for (const item of carrinho) {
      msg += `• ${item.nome} (${item.ean}) — ${item.qtd} un — ${brl(item.preco * item.qtd)}\n`;
    }
    msg += `\nTotal: ${brl(totalCarrinho)}\n\nPode confirmar disponibilidade e prazo?`;
    return msg;
  }, [carrinho, totalCarrinho]);

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      {/* LOGO */}
      <div className="flex justify-center mb-4">
        <Image src="/df-distribuidora-logo.png" alt="Logo DF Distribuidora" width={130} height={130} />
      </div>

      {/* TÍTULO */}
      <h1 className="text-2xl font-extrabold text-center mb-4 text-gray-900">PDV — DF Distribuidora</h1>

      {/* BUSCA */}
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="Digite o nome do produto ou EAN…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full p-3 border rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
          {busca.trim() ? (
            <button
              onClick={() => setBusca("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-extrabold px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
              title="Limpar"
            >
              Limpar
            </button>
          ) : null}
        </div>

        <div className="mt-2 text-xs text-gray-500">
          {loading || loadingBusca ? "Carregando…" : `${produtos.length} produto(s)`}
        </div>
      </div>

      {/* LISTA */}
      <div className="max-w-6xl mx-auto mt-4 grid gap-3">
        {loading ? (
          <SkeletonList />
        ) : produtos.length === 0 ? (
          <div className="bg-white border rounded-2xl p-6 text-gray-600">Nenhum produto encontrado.</div>
        ) : (
          produtos
            .filter((p) => p.nome?.toLowerCase().includes(busca.toLowerCase()))
            .slice(0, 200)
            .map((p) => {
              const pr = precoFinal(p);
              const qtd = qtdNoCarrinho(p.id);

              return (
                <div
                  key={p.id}
                  className="p-3 bg-white shadow-sm rounded-2xl border flex justify-between items-center gap-3"
                >
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="h-14 w-14 rounded-xl bg-gray-50 border overflow-hidden flex items-center justify-center">
                      <Image
                        src={firstImg(p.imagens)}
                        alt={p.nome || "Produto"}
                        width={64}
                        height={64}
                        className="object-contain"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="font-extrabold text-sm sm:text-base line-clamp-2 text-gray-900">{p.nome}</p>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {p.laboratorio || "—"} {p.apresentacao ? `• ${p.apresentacao}` : ""}
                      </div>

                      <div className="mt-1">
                        {pr.emPromo ? (
                          <div className="text-sm">
                            <span className="text-gray-500 line-through mr-2">{brl(pr.pmc)}</span>
                            <span className="text-blue-700 font-extrabold">{brl(pr.final)}</span>
                            {pr.off > 0 ? (
                              <span className="ml-2 text-[11px] font-extrabold bg-red-600 text-white px-2 py-1 rounded-full">
                                {pr.off}% OFF
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="text-blue-700 font-extrabold">{brl(pr.final)}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => diminuir(p)}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl font-extrabold"
                      title="Diminuir"
                      disabled={qtd <= 0}
                    >
                      -
                    </button>

                    <span className="font-extrabold w-8 text-center">{qtd}</span>

                    <button
                      onClick={() => adicionar(p)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold"
                      title="Adicionar"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* BOTÃO FLUTUANTE */}
      <button
        onClick={() => setAbrirCarrinho(true)}
        className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-full shadow-lg text-lg font-extrabold hover:bg-green-700 transition"
      >
        🛒 Carrinho ({qtdCarrinho})
      </button>

      {/* CARRINHO LATERAL */}
      {abrirCarrinho && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAbrirCarrinho(false)} />

          <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-xl p-4 border-l">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold">Carrinho</h2>
              <button
                onClick={() => setAbrirCarrinho(false)}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold"
              >
                Fechar
              </button>
            </div>

            <div className="overflow-auto h-[calc(100%-168px)] pr-1">
              {carrinho.length === 0 ? (
                <p className="text-gray-600">Seu carrinho está vazio.</p>
              ) : (
                <div className="space-y-3">
                  {carrinho.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center border rounded-2xl p-3">
                      <div className="h-12 w-12 rounded-xl bg-gray-50 border overflow-hidden flex items-center justify-center">
                        <Image
                          src={item.imagem || "/produtos/caixa-padrao.png"}
                          alt={item.nome}
                          width={56}
                          height={56}
                          className="object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-sm line-clamp-2">{item.nome}</div>
                        <div className="text-xs text-gray-500">EAN: {item.ean}</div>
                        <div className="text-sm font-extrabold text-blue-900 mt-1">
                          {item.qtd} un · {brl(item.preco * item.qtd)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="my-4" />

            <p className="text-lg font-extrabold mb-4">Total: {brl(totalCarrinho)}</p>

            <a
              href={waLink(WHATS, mensagemWhats)}
              target="_blank"
              rel="noreferrer"
              className={`w-full block text-center bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-extrabold mb-3 ${
                carrinho.length ? "" : "pointer-events-none opacity-50"
              }`}
            >
              Enviar para WhatsApp
            </a>

            <button
              onClick={() => setCarrinho([])}
              className={`w-full bg-gray-200 hover:bg-gray-300 py-3 rounded-2xl font-extrabold ${
                carrinho.length ? "" : "opacity-50 pointer-events-none"
              }`}
            >
              Limpar carrinho
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bg-white border rounded-2xl p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-gray-100 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
              <div className="mt-2 h-3 w-64 bg-gray-100 rounded animate-pulse" />
              <div className="mt-2 h-3 w-28 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-10 w-28 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
