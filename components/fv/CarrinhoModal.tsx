"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";

export type FVProdutoMini = {
  id: string;
  ean: string;
  nome: string;
  laboratorio?: string | null;
  apresentacao?: string | null;
  pmc?: number | null;
  em_promocao?: boolean | null;
  preco_promocional?: number | null;
  percentual_off?: number | null;
  imagens?: string[] | null;
};

export type ItemCarrinho = FVProdutoMini & { quantidade: number };

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

function precoFinal(p: FVProdutoMini) {
  if (p.em_promocao && p.preco_promocional) return p.preco_promocional;
  return p.pmc ?? 0;
}

function buildWhatsAppLink(numeroE164: string, msg: string) {
  const clean = numeroE164.replace(/\D/g, "");
  const text = encodeURIComponent(msg);
  return `https://wa.me/${clean}?text=${text}`;
}

type Props = {
  open: boolean;
  onClose: () => void;
  itens: ItemCarrinho[];
  setItens: (next: ItemCarrinho[]) => void;

  whatsapp: string;
  taxaEntrega: number;
};

export default function CarrinhoModal({
  open,
  onClose,
  itens,
  setItens,
  whatsapp,
  taxaEntrega,
}: Props) {
  // fechar no ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const subtotal = useMemo(() => {
    return itens.reduce((acc, i) => acc + precoFinal(i) * i.quantidade, 0);
  }, [itens]);

  const total = useMemo(() => subtotal + (itens.length ? taxaEntrega : 0), [subtotal, taxaEntrega, itens.length]);

  function inc(ean: string) {
    setItens(
      itens.map((i) => (i.ean === ean ? { ...i, quantidade: i.quantidade + 1 } : i))
    );
  }

  function dec(ean: string) {
    setItens(
      itens
        .map((i) => (i.ean === ean ? { ...i, quantidade: Math.max(1, i.quantidade - 1) } : i))
        .filter(Boolean)
    );
  }

  function remove(ean: string) {
    setItens(itens.filter((i) => i.ean !== ean));
  }

  function limpar() {
    setItens([]);
  }

  const msg = useMemo(() => {
    if (!itens.length) return "Olá! Quero tirar uma dúvida na Farmácia Virtual.";
    const linhas = itens
      .map((i) => `• ${i.nome} (${i.ean}) x${i.quantidade} — ${brl(precoFinal(i) * i.quantidade)}`)
      .join("\n");

    return `Olá! Quero finalizar este pedido:\n\n${linhas}\n\nSubtotal: ${brl(subtotal)}\nEntrega: ${brl(taxaEntrega)}\nTotal: ${brl(total)}\n\nPode confirmar a disponibilidade?`;
  }, [itens, subtotal, taxaEntrega, total]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <button
        aria-label="Fechar carrinho"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* painel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-blue-900">Carrinho</div>
            <div className="text-xs text-gray-500">
              {itens.length ? `${itens.length} item(ns)` : "Seu carrinho está vazio"}
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Fechar
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {!itens.length ? (
            <div className="text-gray-500 text-sm">
              Adicione produtos para montar o pedido.
              <div className="mt-3">
                <Link href="/fv" className="text-blue-700 underline">
                  Voltar para a Farmácia Virtual
                </Link>
              </div>
            </div>
          ) : (
            itens.map((i) => (
              <div key={i.ean} className="border rounded-xl p-3 flex gap-3">
                <div className="shrink-0">
                  <Image
                    src={firstImg(i.imagens)}
                    alt={i.nome}
                    width={64}
                    height={64}
                    className="rounded object-contain w-16 h-16"
                  />
                </div>

                <div className="flex-1">
                  <div className="text-xs text-gray-500 line-clamp-1">
                    {i.laboratorio || "—"}
                  </div>
                  <div className="font-semibold text-blue-900 text-sm line-clamp-2">
                    {i.nome}
                  </div>
                  {i.apresentacao && (
                    <div className="text-xs text-gray-600 line-clamp-1 mt-1">
                      {i.apresentacao}
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between">
                    <div className="font-bold text-blue-900 text-sm">
                      {brl(precoFinal(i))}
                    </div>

                    <button
                      onClick={() => remove(i.ean)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => dec(i.ean)}
                      className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200"
                    >
                      −
                    </button>
                    <div className="min-w-10 text-center font-semibold">
                      {i.quantidade}
                    </div>
                    <button
                      onClick={() => inc(i.ean)}
                      className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200"
                    >
                      +
                    </button>

                    <div className="ml-auto font-semibold text-gray-800 text-sm">
                      {brl(precoFinal(i) * i.quantidade)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t space-y-3">
          {itens.length ? (
            <>
              <div className="text-sm flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <b>{brl(subtotal)}</b>
              </div>
              <div className="text-sm flex justify-between">
                <span className="text-gray-600">Entrega</span>
                <b>{brl(taxaEntrega)}</b>
              </div>
              <div className="text-base flex justify-between">
                <span className="text-blue-900 font-bold">Total</span>
                <span className="text-blue-900 font-extrabold">{brl(total)}</span>
              </div>

              <a
                href={buildWhatsAppLink(whatsapp, msg)}
                className="block text-center bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
              >
                Finalizar no WhatsApp
              </a>

              <button
                onClick={limpar}
                className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm"
              >
                Limpar carrinho
              </button>
            </>
          ) : (
            <a
              href={buildWhatsAppLink(whatsapp, msg)}
              className="block text-center bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
            >
              Chamar no WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
