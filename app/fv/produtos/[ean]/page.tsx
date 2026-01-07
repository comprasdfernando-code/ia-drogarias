"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "../../_components/cart";
import { ToastProvider, useToast } from "../../_components/toast";

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

export default function ProdutoPage() {
  return (
    <ToastProvider>
      <FVProdutoPage />
    </ToastProvider>
  );
}

function FVProdutoPage() {
  const params = useParams<{ ean: string }>();
  const ean = decodeURIComponent(String(params?.ean || ""));

  const { addItem } = useCart();
  const { push } = useToast();

  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<FVProduto | null>(null);
  const [qtd, setQtd] = useState(1);

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
          .select("id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,imagens,ativo")
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

  if (loading) return <div className="p-6 text-gray-600">Carregando…</div>;

  if (!p || !precos) {
    return (
      <div className="p-6">
        <Link href="/fv" className="text-blue-700 hover:underline">← Voltar</Link>
        <p className="mt-4 text-gray-600">Produto não encontrado.</p>
      </div>
    );
  }

  const msg = `Olá! Quero finalizar este pedido:
• Produto: ${p.nome}
• EAN: ${p.ean}
• Quantidade: ${qtd}
• Preço unitário: ${brl(precos.final)}
• Entrega: taxa fixa ${brl(TAXA_ENTREGA)}

Pode confirmar a disponibilidade?`;

  function addCarrinho() {
    addItem(
      {
        ean: p.ean,
        nome: p.nome,
        laboratorio: p.laboratorio,
        apresentacao: p.apresentacao,
        imagem: firstImg(p.imagens),
        preco: precos.final || 0,
      },
      qtd
    );
    push({ title: "Adicionado ao carrinho ✅", desc: `${p.nome} • ${qtd}x` });
    setQtd(1);
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link href="/fv" className="text-sm text-blue-700 hover:underline">← Voltar</Link>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
            <div className="relative bg-gray-50 rounded-2xl p-3">
              <Image
                src={firstImg(p.imagens)}
                alt={p.nome}
                width={720}
                height={720}
                className="w-full h-[300px] md:h-[440px] object-contain"
              />
              {precos.emPromo && precos.off > 0 && (
                <span className="absolute top-4 right-4 bg-red-600 text-white text-sm px-3 py-1 rounded-full font-extrabold shadow-sm">
                  {precos.off}% OFF
                </span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
            <div className="text-sm text-gray-500">{p.laboratorio || "—"}</div>
            <h1 className="text-xl md:text-3xl font-extrabold text-blue-950 mt-1">{p.nome}</h1>

            <div className="mt-2 text-sm text-gray-600">
              <div><b>EAN:</b> <span className="font-mono">{p.ean}</span></div>
              {p.apresentacao && <div><b>Apresentação:</b> {p.apresentacao}</div>}
              {p.categoria && <div><b>Categoria:</b> {p.categoria}</div>}
            </div>

            <div className="mt-5 border-t pt-4">
              {precos.emPromo ? (
                <>
                  <div className="text-sm text-gray-500">
                    De <span className="line-through">{brl(precos.pmc)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-3xl font-extrabold text-blue-950">Por {brl(precos.final)}</div>
                    {precos.off > 0 && (
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
                        {precos.off}% off
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-3xl font-extrabold text-blue-950">{brl(precos.final)}</div>
              )}

              {/* stepper */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex items-center border rounded-2xl overflow-hidden">
                  <button onClick={() => setQtd((x) => Math.max(1, x - 1))} className="w-11 h-11 bg-white hover:bg-gray-50 font-extrabold">–</button>
                  <div className="w-14 text-center font-extrabold">{qtd}</div>
                  <button onClick={() => setQtd((x) => x + 1)} className="w-11 h-11 bg-white hover:bg-gray-50 font-extrabold">+</button>
                </div>

                <button
                  onClick={addCarrinho}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-2xl font-extrabold"
                >
                  Adicionar ao carrinho
                </button>
              </div>

              <a
                href={buildWhatsAppLink(WHATSAPP, msg)}
                className="mt-3 block text-center bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-extrabold"
              >
                Comprar agora
              </a>

              <div className="text-xs text-gray-500 mt-3">
                Entrega São Paulo capital • prazo até 24h • taxa fixa {brl(TAXA_ENTREGA)}.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
