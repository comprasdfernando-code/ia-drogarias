"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  imagens: string[] | null;
  ativo: boolean | null;
};

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

function calcOff(pmc?: number | null, promo?: number | null) {
  const a = Number(pmc || 0);
  const b = Number(promo || 0);
  if (!a || !b || b >= a) return 0;
  return Math.round(((a - b) / a) * 100);
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

export default function FVProdutoPage() {
  const params = useParams<{ ean: string }>();

  // ✅ no App Router, o param já vem decodado normalmente.
  // Mas manter decode não atrapalha pra números, então ok:
  const ean = decodeURIComponent(String(params?.ean || ""));

  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<FVProduto | null>(null);

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

  const carrinhoCount = useMemo(
    () => itens.reduce((acc, i) => acc + Number(i.quantidade || 0), 0),
    [itens]
  );

  function addCarrinho(prod: FVProduto) {
    const mini: FVProdutoMini = {
      id: prod.id,
      ean: prod.ean,
      nome: prod.nome,
      laboratorio: prod.laboratorio,
      apresentacao: prod.apresentacao,
      pmc: prod.pmc,
      em_promocao: prod.em_promocao,
      preco_promocional: prod.preco_promocional,
      percentual_off: prod.percentual_off,
      imagens: prod.imagens,
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

  useEffect(() => {
    async function load() {
      if (!ean) {
        setP(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("fv_produtos")
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,imagens,ativo"
          )
          .eq("ean", ean)
          .eq("ativo", true)
          .maybeSingle();

        if (error) throw error;
        setP((data as FVProduto) || null);
      } catch (e) {
        console.error(e);
        setP(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ean]);

  const precos = useMemo(() => {
    if (!p) return null;

    const pmc = Number(p.pmc || 0);
    const promo = Number(p.preco_promocional || 0);
    const emPromo = !!p.em_promocao && promo > 0 && (!pmc || promo < pmc);

    const final = emPromo ? promo : pmc;

    const offFromDb = Number(p.percentual_off || 0);
    const off = emPromo ? (offFromDb > 0 ? offFromDb : calcOff(pmc, promo)) : 0;

    return { pmc, promo, emPromo, final, off };
  }, [p]);

  if (loading) {
    return <div className="p-6 text-gray-600">Carregando…</div>;
  }

  if (!p || !precos) {
    return (
      <div className="p-6">
        <Link href="/fv" className="text-blue-700 underline">
          ← Voltar
        </Link>
        <p className="mt-4 text-gray-600">Produto não encontrado.</p>
      </div>
    );
  }

  const msg = `Olá! Quero finalizar este pedido:
• Produto: ${p.nome}
• EAN: ${p.ean}
• Preço: ${brl(precos.final)}
• Entrega: taxa fixa ${brl(TAXA_ENTREGA)}

Pode confirmar a disponibilidade?`;

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        {/* Top bar: voltar + carrinho */}
        <div className="flex items-center justify-between">
          <Link href="/fv" className="text-sm text-blue-700 underline">
            ← Voltar
          </Link>

          <button
            type="button"
            onClick={() => setCarrinhoAberto(true)}
            className="bg-blue-700 text-white px-4 py-2 rounded-full shadow-sm hover:bg-blue-800"
            title="Abrir carrinho"
          >
            🛒 {carrinhoCount ? `(${carrinhoCount})` : ""}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Imagem */}
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="relative">
              <Image
                src={firstImg(p.imagens)}
                alt={p.nome}
                width={520}
                height={520}
                className="w-full h-[280px] md:h-[420px] object-contain"
              />

              {precos.emPromo && precos.off > 0 && (
                <span className="absolute top-3 right-3 bg-red-600 text-white text-sm px-3 py-1 rounded-full">
                  {precos.off}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="text-sm text-gray-500">{p.laboratorio || "—"}</div>

            <h1 className="text-xl md:text-2xl font-bold text-blue-900 mt-1">
              {p.nome}
            </h1>

            <div className="mt-2 text-sm text-gray-600">
              <div>
                <b>EAN:</b> <span className="font-mono">{p.ean}</span>
              </div>
              {p.apresentacao && (
                <div>
                  <b>Apresentação:</b> {p.apresentacao}
                </div>
              )}
              {p.categoria && (
                <div>
                  <b>Categoria:</b> {p.categoria}
                </div>
              )}
            </div>

            {/* Preço estilo Ultrafarma */}
            <div className="mt-5 border-t pt-4">
              {precos.emPromo ? (
                <>
                  <div className="text-sm text-gray-500">
                    De <span className="line-through">{brl(precos.pmc)}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-2xl font-extrabold text-blue-900">
                      Por {brl(precos.final)}
                    </div>

                    {precos.off > 0 && (
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                        {precos.off}% off
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-2xl font-extrabold text-blue-900">
                  {brl(precos.final)}
                </div>
              )}

              <div className="text-xs text-gray-500 mt-2">
                Finalização do pedido: analisamos a disponibilidade e retornamos
                em poucos minutos para confirmar.
              </div>

              <div className="text-xs text-gray-500 mt-1">
                Entrega São Paulo capital • prazo até 24h • taxa fixa{" "}
                {brl(TAXA_ENTREGA)}.
              </div>

              {/* ✅ Ações: adicionar carrinho + finalizar */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => addCarrinho(p)}
                  className="block text-center bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold"
                >
                  Adicionar ao carrinho
                </button>

                <a
                  href={buildWhatsAppLink(WHATSAPP, msg)}
                  className="block text-center bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
                >
                  Finalizar pedido
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

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
