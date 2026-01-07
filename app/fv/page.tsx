"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

// ✅ Carrinho (modal)
import CarrinhoModal, {
  type FVProdutoMini,
  type ItemCarrinho,
} from "@/components/fv/CarrinhoModal";

const WHATSAPP = "5511948343725";
const TAXA_ENTREGA = 10;

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
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

  // Usa o percentual_off do banco se vier; senão calcula no front
  const offFromDb = Number(p.percentual_off || 0);
  const off = emPromo ? (offFromDb > 0 ? offFromDb : calcOff(pmc, promo)) : 0;

  return { emPromo, pmc, promo, final, off };
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

// ✅ Carrinho: preço final do item
function precoFinalCarrinho(p: FVProdutoMini) {
  const promo = Number(p.preco_promocional || 0);
  const pmc = Number(p.pmc || 0);
  if (p.em_promocao && promo > 0 && (!pmc || promo < pmc)) return promo;
  return pmc;
}

// ✅ Carrinho: persistência
const CART_KEY = "fv_carrinho_v1";

export default function FarmaciaVirtualHome() {
  const [loadingHome, setLoadingHome] = useState(true);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [busca, setBusca] = useState("");

  // home (categorias)
  const [homeProdutos, setHomeProdutos] = useState<FVProduto[]>([]);
  // resultados da busca
  const [resultado, setResultado] = useState<FVProduto[]>([]);

  // ✅ Carrinho
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  // carregar carrinho
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setItens(JSON.parse(raw));
    } catch {}
  }, []);

  // salvar carrinho
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(itens));
    } catch {}
  }, [itens]);

  function addCarrinho(p: FVProduto) {
    const mini: FVProdutoMini = {
      id: p.id,
      ean: p.ean,
      nome: p.nome,
      laboratorio: p.laboratorio,
      apresentacao: p.apresentacao,
      pmc: p.pmc,
      em_promocao: p.em_promocao,
      preco_promocional: p.preco_promocional,
      percentual_off: p.percentual_off,
      imagens: p.imagens,
    };

    setItens((prev) => {
      const existe = prev.find((i) => i.ean === mini.ean);
      if (existe) {
        return prev.map((i) =>
          i.ean === mini.ean ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, { ...mini, quantidade: 1 }];
    });

    setCarrinhoAberto(true);
  }

  const carrinhoCount = useMemo(
    () => itens.reduce((acc, i) => acc + Number(i.quantidade || 0), 0),
    [itens]
  );

  // Carrega um lote “home-friendly”
  useEffect(() => {
    async function loadHome() {
      try {
        setLoadingHome(true);

        const { data, error } = await supabase
          .from("fv_produtos")
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens"
          )
          .eq("ativo", true)
          .limit(2500);

        if (error) throw error;

        const arr = (data || []) as FVProduto[];

        // Ordenação consistente no front:
        // 1) destaque_home true primeiro
        // 2) promo primeiro
        // 3) categoria
        // 4) nome
        arr.sort((a, b) => {
          const da = a.destaque_home ? 1 : 0;
          const db = b.destaque_home ? 1 : 0;
          if (db !== da) return db - da;

          const pa = a.em_promocao ? 1 : 0;
          const pb = b.em_promocao ? 1 : 0;
          if (pb !== pa) return pb - pa;

          const ca = (a.categoria || "Outros").toLowerCase();
          const cb = (b.categoria || "Outros").toLowerCase();
          const ccmp = ca.localeCompare(cb);
          if (ccmp !== 0) return ccmp;

          return (a.nome || "").localeCompare(b.nome || "");
        });

        setHomeProdutos(arr);
      } catch (e) {
        console.error("Erro loadHome:", e);
      } finally {
        setLoadingHome(false);
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

      setLoadingBusca(true);
      try {
        const digits = t.replace(/\D/g, "");
        let query = supabase
          .from("fv_produtos")
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens"
          )
          .eq("ativo", true)
          .limit(100);

        // se for número -> tenta EAN exato + fallback nome
        if (digits.length >= 8 && digits.length <= 14) {
          query = query.or(`ean.eq.${digits},nome.ilike.%${t}%`);
        } else {
          query = query.ilike("nome", `%${t}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        const ordered = ((data || []) as FVProduto[]).sort((a, b) => {
          const pa = a.em_promocao ? 1 : 0;
          const pb = b.em_promocao ? 1 : 0;
          if (pb !== pa) return pb - pa;
          return (a.nome || "").localeCompare(b.nome || "");
        });

        setResultado(ordered);
      } catch (e) {
        console.error("Erro search:", e);
      } finally {
        setLoadingBusca(false);
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

        {/* Busca + Carrinho + Whats */}
        <div className="mt-4 flex gap-2 items-center">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite o nome ou EAN..."
            className="w-full bg-white border rounded-full px-4 py-2 shadow-sm"
          />

          <button
            type="button"
            onClick={() => setCarrinhoAberto(true)}
            className="bg-blue-700 text-white px-4 py-2 rounded-full shadow-sm hover:bg-blue-800 whitespace-nowrap"
            title="Abrir carrinho"
          >
            🛒 {carrinhoCount ? `(${carrinhoCount})` : ""}
          </button>

          <a
            href={buildWhatsAppLink(
              WHATSAPP,
              "Olá! Quero tirar uma dúvida na Farmácia Virtual."
            )}
            className="bg-green-600 text-white px-4 py-2 rounded-full shadow-sm hover:bg-green-700 whitespace-nowrap"
          >
            WhatsApp
          </a>
        </div>

        {/* Loader pequeno na busca */}
        {busca.trim() && (
          <div className="mt-2 text-xs text-gray-500">
            {loadingBusca ? "Buscando…" : " "}
          </div>
        )}
      </section>

      {/* Resultado da busca */}
      {busca.trim() ? (
        <section className="max-w-6xl mx-auto px-4 mt-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Resultados ({resultado.length})
          </h2>

          {loadingBusca ? (
            <p className="text-gray-500">Carregando…</p>
          ) : resultado.length === 0 ? (
            <p className="text-gray-500">Nenhum produto encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
              {resultado.map((p) => (
                <ProdutoCard key={p.id} p={p} onAdd={addCarrinho} />
              ))}
            </div>
          )}
        </section>
      ) : (
        // Home por categorias
        <section className="max-w-6xl mx-auto px-4 mt-8 space-y-10">
          {loadingHome ? (
            <p className="text-gray-500">Carregando categorias…</p>
          ) : categoriasHome.length === 0 ? (
            <p className="text-gray-500">Nenhum produto para exibir.</p>
          ) : (
            categoriasHome.map(([cat, itensCat]) => (
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
                  {itensCat.map((p) => (
                    <ProdutoCard key={p.id} p={p} onAdd={addCarrinho} />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* ✅ Modal Carrinho */}
      <CarrinhoModal
        open={carrinhoAberto}
        onClose={() => setCarrinhoAberto(false)}
        itens={itens}
        setItens={setItens}
        whatsapp={WHATSAPP}
        taxaEntrega={TAXA_ENTREGA}
      />
    </main>
  );
}

function ProdutoCard({ p, onAdd }: { p: FVProduto; onAdd: (p: FVProduto) => void }) {
  const pr = precoFinal(p);

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

        {/* Badge % OFF */}
        {pr.emPromo && pr.off > 0 && (
          <span className="absolute top-2 right-2 text-[11px] font-bold bg-red-600 text-white px-2 py-1 rounded">
            {pr.off}% OFF
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

        {/* Preços */}
        {pr.emPromo ? (
          <div className="mt-2">
            <div className="text-xs text-gray-500">
              De <span className="line-through">{brl(pr.pmc)}</span>
            </div>
            <div className="text-base font-bold text-blue-900">
              Por {brl(pr.final)}
            </div>
          </div>
        ) : (
          <div className="mt-2 text-base font-bold text-blue-900">{brl(pr.final)}</div>
        )}

        {/* ✅ Ações: Adicionar + Ver */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onAdd(p)}
            className="text-center bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-md text-xs sm:text-sm font-semibold"
          >
            Adicionar
          </button>

          {/* ⚠️ Link correto (com S) */}
          <Link
            href={`/fv/produtos/${p.ean}`}
            className="text-center border border-blue-700 text-blue-700 hover:bg-blue-50 py-2 rounded-md text-xs sm:text-sm font-semibold"
          >
            Ver
          </Link>
        </div>
      </div>
    </div>
  );
}
