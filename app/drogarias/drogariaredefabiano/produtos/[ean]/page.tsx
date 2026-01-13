"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "../../_components/cart";
import { useToast } from "../../_components/toast";

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
  estoque: number | null;
};

const PROD_TABLE = "df_produtos";
const PREFIX = "/dfdistribuidora";
const WHATS_DF = "5511952068432";

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

function precoFinal(p: DFProduto) {
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

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

export default function DFProdutoPage() {
  const params = useParams();
  const rawParam = String((params as any)?.ean ?? "");
  const ean = onlyDigits(decodeURIComponent(rawParam));

  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<DFProduto | null>(null);
  const [qtd, setQtd] = useState(1);

  const cart = useCart();
  const { push } = useToast();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        if (!ean || ean.length < 8) {
          setP(null);
          return;
        }

        const { data, error } = await supabase
          .from(PROD_TABLE)
          .select("id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens,estoque")
          .eq("ean", ean)
          .maybeSingle();

        if (error) throw error;
        setP((data as DFProduto) ?? null);
      } catch (err) {
        console.error("Erro load produto DF:", err);
        setP(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [ean]);

  const pr = useMemo(() => (p ? precoFinal(p) : null), [p]);
  const estoque = Number(p?.estoque ?? 0);
  const indisponivel = estoque <= 0;

  function addCarrinho() {
    if (!p) return;

    if (indisponivel) {
      push({ title: "Sem estoque 😕", desc: "Esse item está indisponível agora." });
      return;
    }

    const already = cart.items.find((x) => x.ean === p.ean)?.qtd ?? 0;
    const want = Math.max(1, qtd);

    if (estoque > 0 && already + want > estoque) {
      const canAdd = Math.max(0, estoque - already);
      if (canAdd <= 0) {
        push({ title: "Limite do estoque", desc: "Você já atingiu o máximo disponível." });
        return;
      }
      cart.addItem(
        { ean: p.ean, nome: p.nome, laboratorio: p.laboratorio, apresentacao: p.apresentacao, imagem: firstImg(p.imagens), preco: pr?.final || 0 },
        canAdd
      );
      push({ title: "Adicionado ✅", desc: `${p.nome} • ${canAdd}x (limite)` });
      setQtd(1);
      return;
    }

    cart.addItem(
      { ean: p.ean, nome: p.nome, laboratorio: p.laboratorio, apresentacao: p.apresentacao, imagem: firstImg(p.imagens), preco: pr?.final || 0 },
      want
    );
    push({ title: "Adicionado ✅", desc: `${p.nome} • ${want}x` });
    setQtd(1);
  }

  function msgWhats() {
    if (!p) return "Olá! Quero fazer um pedido da DF Distribuidora.";
    const msg =
      `Olá! Quero este item:\n\n` +
      `• ${p.nome} (EAN: ${p.ean})\n` +
      (p.apresentacao ? `• Apresentação: ${p.apresentacao}\n` : "") +
      (p.laboratorio ? `• Laboratório: ${p.laboratorio}\n` : "") +
      (pr?.final ? `• Preço: ${brl(pr.final)}\n` : "") +
      `\nPode confirmar disponibilidade e prazo?`;
    return msg;
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600 font-bold">Carregando…</div>;
  }

  if (!p) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-2xl font-extrabold text-gray-900">Produto não encontrado 😕</div>
        <div className="text-gray-600 mt-2">Verifique o EAN no link.</div>
        <Link href={PREFIX} className="mt-6 px-5 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold">
          Voltar para DF
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <Link href={PREFIX} className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold">
            ← Voltar
          </Link>

          <Link
            href={PREFIX}
            className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold"
            title="Continuar comprando"
          >
            Continuar comprando
          </Link>
        </div>

        <div className="mt-5 bg-white border rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 grid md:grid-cols-2 gap-5">
            <div className="bg-gray-50 rounded-2xl border flex items-center justify-center p-4">
              <Image src={firstImg(p.imagens)} alt={p.nome} width={520} height={520} className="object-contain max-h-[360px]" />
            </div>

            <div>
              <div className="text-xs text-gray-500 font-bold">{p.laboratorio || "—"}</div>
              <h1 className="mt-1 text-2xl font-extrabold text-gray-900">{p.nome}</h1>
              {p.apresentacao && <div className="mt-2 text-sm text-gray-700">{p.apresentacao}</div>}

              <div className="mt-4">
                {pr?.emPromo ? (
                  <>
                    <div className="text-sm text-gray-500">
                      De <span className="line-through">{brl(pr.pmc)}</span>{" "}
                      {pr.off > 0 && <span className="ml-2 text-white bg-red-600 px-2 py-1 rounded-full text-xs font-extrabold">{pr.off}% OFF</span>}
                    </div>
                    <div className="text-3xl font-extrabold text-blue-900 mt-1">Por {brl(pr.final)}</div>
                  </>
                ) : (
                  <div className="text-3xl font-extrabold text-blue-900">{brl(pr?.final)}</div>
                )}
              </div>

              <div className="mt-4 text-sm">
                {indisponivel ? (
                  <span className="font-extrabold text-gray-500">Sem estoque</span>
                ) : (
                  <span className="font-bold text-gray-600">
                    Estoque disponível: <span className="text-gray-900">{estoque}</span>
                  </span>
                )}
              </div>

              <div className="mt-5 flex items-center gap-2">
                <div className="flex items-center border rounded-xl overflow-hidden">
                  <button onClick={() => setQtd((x) => Math.max(1, x - 1))} className="w-10 h-10 bg-white hover:bg-gray-50 font-extrabold" disabled={indisponivel}>
                    –
                  </button>
                  <div className="w-12 text-center font-extrabold">{qtd}</div>
                  <button onClick={() => setQtd((x) => x + 1)} className="w-10 h-10 bg-white hover:bg-gray-50 font-extrabold" disabled={indisponivel}>
                    +
                  </button>
                </div>

                <button
                  onClick={addCarrinho}
                  disabled={indisponivel}
                  className={`flex-1 h-10 rounded-xl font-extrabold ${
                    indisponivel ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  🛒 Adicionar ao carrinho
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link href={PREFIX} className="px-4 py-3 rounded-2xl border bg-white hover:bg-gray-50 font-extrabold text-center">
                  Continuar comprando
                </Link>

                <a
                  href={waLink(WHATS_DF, msgWhats())}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-center"
                >
                  💬 Falar no WhatsApp
                </a>
              </div>

              {indisponivel ? (
                <a
                  href={waLink(WHATS_DF, msgWhats())}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block px-4 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-center"
                >
                  Encomendar
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
