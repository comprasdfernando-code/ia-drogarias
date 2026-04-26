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
  taxaEntrega,
}: Props) {
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

  const total = useMemo(
    () => subtotal + (itens.length ? taxaEntrega : 0),
    [subtotal, taxaEntrega, itens.length]
  );

  function inc(ean: string) {
    setItens(
      itens.map((i) =>
        i.ean === ean ? { ...i, quantidade: i.quantidade + 1 } : i
      )
    );
  }

  function dec(ean: string) {
    setItens(
      itens.map((i) =>
        i.ean === ean
          ? { ...i, quantidade: Math.max(1, i.quantidade - 1) }
          : i
      )
    );
  }

  function remove(ean: string) {
    setItens(itens.filter((i) => i.ean !== ean));
  }

  function limpar() {
    setItens([]);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Fechar carrinho"
        onClick={onClose}
        className="absolute inset-0 bg-black/45"
      />

      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <div className="text-lg font-black text-blue-950">🛒 Carrinho</div>
            <div className="text-xs text-slate-500">
              {itens.length ? `${itens.length} item(ns)` : "Seu carrinho está vazio"}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold hover:bg-slate-200"
          >
            Continuar comprando
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-auto p-4">
          {!itens.length ? (
            <div className="rounded-2xl border border-dashed p-6 text-center">
              <p className="text-sm font-bold text-slate-700">
                Adicione produtos para montar o pedido.
              </p>

              <button
                onClick={onClose}
                className="mt-4 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white"
              >
                Ver produtos
              </button>
            </div>
          ) : (
            itens.map((i) => (
              <div key={i.ean} className="flex gap-3 rounded-2xl border p-3">
                <div className="shrink-0">
                  <Image
                    src={firstImg(i.imagens)}
                    alt={i.nome}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 text-xs text-slate-500">
                    {i.laboratorio || "Produto"}
                  </div>

                  <div className="line-clamp-2 text-sm font-black text-blue-950">
                    {i.nome}
                  </div>

                  {i.apresentacao && (
                    <div className="mt-1 line-clamp-1 text-xs text-slate-600">
                      {i.apresentacao}
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm font-black text-blue-800">
                      {brl(precoFinal(i))}
                    </div>

                    <button
                      onClick={() => remove(i.ean)}
                      className="text-xs font-bold text-red-600 hover:underline"
                    >
                      Excluir
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => dec(i.ean)}
                      className="h-9 w-9 rounded-lg bg-slate-100 font-black hover:bg-slate-200"
                    >
                      −
                    </button>

                    <div className="min-w-10 text-center font-black">
                      {i.quantidade}
                    </div>

                    <button
                      onClick={() => inc(i.ean)}
                      className="h-9 w-9 rounded-lg bg-slate-100 font-black hover:bg-slate-200"
                    >
                      +
                    </button>

                    <div className="ml-auto text-sm font-black text-slate-800">
                      {brl(precoFinal(i) * i.quantidade)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 border-t bg-white p-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <b>{brl(subtotal)}</b>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Taxa</span>
            <b>{itens.length ? brl(taxaEntrega) : brl(0)}</b>
          </div>

          <div className="flex justify-between border-t pt-2 text-lg">
            <span className="font-black text-blue-950">Total</span>
            <span className="font-black text-green-700">{brl(total)}</span>
          </div>

          {itens.length ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={limpar}
                className="rounded-xl bg-slate-100 py-3 text-sm font-black hover:bg-slate-200"
              >
                Limpar
              </button>

              <Link
                href="/fv/carrinho"
                onClick={onClose}
                className="rounded-xl bg-green-600 py-3 text-center text-sm font-black text-white hover:bg-green-700"
              >
                Finalizar pedido
              </Link>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-blue-700 py-3 text-sm font-black text-white"
            >
              Continuar comprando
            </button>
          )}
        </div>
      </div>
    </div>
  );
}