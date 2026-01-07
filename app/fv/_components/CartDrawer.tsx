"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useCart } from "./cart";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildWhatsAppLink(numeroE164: string, msg: string) {
  const clean = numeroE164.replace(/\D/g, "");
  const text = encodeURIComponent(msg);
  return `https://wa.me/${clean}?text=${text}`;
}

export default function CartDrawer({
  open,
  onClose,
  whatsapp,
  taxaEntrega,
}: {
  open: boolean;
  onClose: () => void;
  whatsapp: string;
  taxaEntrega: number;
}) {
  const { items, inc, dec, remove, clear, subtotal, countItems } = useCart();

  const total = useMemo(
    () => (countItems > 0 ? subtotal + taxaEntrega : 0),
    [subtotal, taxaEntrega, countItems]
  );

  const msg = useMemo(() => {
    if (items.length === 0) return "Olá! Quero tirar uma dúvida.";
    const lines = items.map((i) => `• ${i.nome} (${i.ean}) — ${i.qtd}x — ${brl(i.preco)}`);
    return `Olá! Quero finalizar meu pedido (Farmácia Virtual IA Drogarias):

${lines.join("\n")}

Subtotal: ${brl(subtotal)}
Entrega (taxa fixa): ${brl(taxaEntrega)}
Total: ${brl(total)}

Pode confirmar a disponibilidade e o prazo?`;
  }, [items, subtotal, taxaEntrega, total]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/45 z-[80]" onClick={onClose} />

      <aside className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-white z-[90] shadow-2xl flex flex-col animate-[slideIn_.18s_ease-out]">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="font-extrabold text-gray-900 text-lg">Carrinho</div>
            <div className="text-xs text-gray-500">{countItems} item(ns)</div>
          </div>

          <button onClick={onClose} className="px-3 py-2 rounded-xl border hover:bg-gray-50 text-sm font-semibold">
            Continuar
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {items.length === 0 ? (
            <div className="text-gray-700 bg-gray-50 border rounded-2xl p-6">
              Seu carrinho está vazio.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.ean} className="border rounded-2xl p-3 flex gap-3">
                  <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
                    <Image
                      src={i.imagem || "/produtos/caixa-padrao.png"}
                      alt={i.nome}
                      width={56}
                      height={56}
                      className="object-contain"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="text-[11px] text-gray-500 line-clamp-1">{i.laboratorio || "—"}</div>
                    <div className="font-extrabold text-sm text-blue-950 line-clamp-2">{i.nome}</div>
                    {i.apresentacao && <div className="text-[11px] text-gray-600 line-clamp-1">{i.apresentacao}</div>}

                    <div className="mt-2 flex items-center justify-between">
                      <div className="font-extrabold text-blue-900 text-sm">{brl(i.preco)}</div>
                      <button onClick={() => remove(i.ean)} className="text-xs text-red-600 hover:underline">
                        Remover
                      </button>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => dec(i.ean)} className="w-9 h-9 rounded-lg border hover:bg-gray-50 font-extrabold">
                        –
                      </button>
                      <div className="w-10 text-center font-extrabold">{i.qtd}</div>
                      <button onClick={() => inc(i.ean)} className="w-9 h-9 rounded-lg border hover:bg-gray-50 font-extrabold">
                        +
                      </button>

                      <div className="ml-auto font-extrabold text-gray-800">{brl(i.preco * i.qtd)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-extrabold">{brl(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Entrega</span>
              <span className="font-extrabold">{brl(items.length ? taxaEntrega : 0)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="font-extrabold">Total</span>
              <span className="font-extrabold text-blue-900">{brl(total)}</span>
            </div>
          </div>

          <a
            href={buildWhatsAppLink(whatsapp, msg)}
            className={`mt-4 block text-center py-3 rounded-2xl font-extrabold ${
              items.length ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-200 text-gray-500 pointer-events-none"
            }`}
          >
            Finalizar no WhatsApp
          </a>

          <button
            onClick={clear}
            className={`mt-2 w-full py-2 rounded-xl text-sm ${
              items.length ? "bg-gray-100 hover:bg-gray-200" : "bg-gray-50 text-gray-400"
            }`}
            disabled={!items.length}
          >
            Limpar carrinho
          </button>
        </div>
      </aside>

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(18px); opacity: 0.6; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
