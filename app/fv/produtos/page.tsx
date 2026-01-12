"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const WHATSAPP = "5511952068432";
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
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

export default function FVProdutoPage() {
  const params = useParams<{ ean: string }>();
  const ean = decodeURIComponent(params.ean || "");

  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<FVProduto | null>(null);

  useEffect(() => {
    async function load() {
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

  const precoFinal = useMemo(() => {
    if (!p) return null;
    if (p.em_promocao && p.preco_promocional) return p.preco_promocional;
    return p.pmc;
  }, [p]);

  if (loading) {
    return <div className="p-6 text-gray-600">Carregando…</div>;
  }

  if (!p) {
    return (
      <div className="p-6">
        <Link href="/fv" className="text-blue-700 underline">
          ← Voltar
        </Link>
        <p className="mt-4 text-gray-600">Produto não encontrado.</p>
      </div>
    );
  }

  // (mantive aqui, mas NÃO usamos mais nesta tela)
  const msg = `Olá! Quero finalizar este pedido:
• Produto: ${p.nome}
• EAN: ${p.ean}
• Preço: ${brl(precoFinal)}
• Entrega: taxa fixa ${brl(TAXA_ENTREGA)}

Pode confirmar a disponibilidade?`;

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link href="/fv" className="text-sm text-blue-700 underline">
          ← Voltar
        </Link>

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
              {p.em_promocao && p.percentual_off != null && p.percentual_off > 0 && (
                <span className="absolute top-3 right-3 bg-red-600 text-white text-sm px-3 py-1 rounded-full">
                  {p.percentual_off}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="text-sm text-gray-500">{p.laboratorio || "—"}</div>
            <h1 className="text-xl md:text-2xl font-bold text-blue-900 mt-1">{p.nome}</h1>

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
              {p.em_promocao && p.preco_promocional ? (
                <>
                  <div className="text-sm text-gray-500">
                    De <span className="line-through">{brl(p.pmc)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-2xl font-extrabold text-blue-900">Por {brl(p.preco_promocional)}</div>
                    {p.percentual_off != null && p.percentual_off > 0 && (
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">{p.percentual_off}% off</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-2xl font-extrabold text-blue-900">{brl(p.pmc)}</div>
              )}

              <div className="text-xs text-gray-500 mt-2">
                Finalização do pedido: analisamos a disponibilidade e retornamos em poucos minutos para confirmar.
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Entrega São Paulo capital • prazo até 24h • taxa fixa {brl(TAXA_ENTREGA)}.
              </div>

              {/* ✅ TROCA AQUI */}
              <Link
                href="/fv"
                className="mt-4 block text-center bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold"
              >
                Continuar comprando
              </Link>

              {/* (se quiser deixar o whatsapp escondido pra outra etapa, tá aqui mas removido da UI)
              <a href={buildWhatsAppLink(WHATSAPP, msg)} className="hidden">Whats</a>
              */}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
