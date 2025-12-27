"use client";

import { useMemo, useState } from "react";

export default function CarrinhoModal({
  aberto,
  setAberto,
  carrinho,
}: any) {
  if (!aberto) return null;

  const [tipoEntrega, setTipoEntrega] = useState<
    "retirada" | "entrega"
  >("retirada");

  const [cliente, setCliente] = useState({
    nome: "",
    telefone: "",
    endereco: "",
  });

  // 🧮 Subtotal
  const subtotal = useMemo(
    () =>
      carrinho.reduce(
        (s: number, i: any) => s + i.preco * i.quantidade,
        0
      ),
    [carrinho]
  );

  // 🚚 Frete (por enquanto zerado / a calcular)
  const frete = tipoEntrega === "entrega" ? 0 : 0;

  const total = subtotal + frete;

  // 📲 Mensagem WhatsApp
  const mensagemWhatsApp = useMemo(() => {
    const itens = carrinho
      .map(
        (i: any) =>
          `${i.quantidade}x ${i.nome} - R$ ${(
            i.preco * i.quantidade
          ).toFixed(2)}`
      )
      .join("\n");

    return encodeURIComponent(
      `🛒 *Pedido - Gigante dos Assados*\n\n` +
        `${itens}\n\n` +
        `Subtotal: R$ ${subtotal.toFixed(2)}\n` +
        `Frete: a calcular\n` +
        `*Total parcial: R$ ${total.toFixed(2)}*\n\n` +
        `Forma de recebimento: ${tipoEntrega}\n` +
        (tipoEntrega === "entrega"
          ? `\n📍 *Dados para entrega*\n` +
            `Cliente: ${cliente.nome}\n` +
            `WhatsApp: ${cliente.telefone}\n` +
            `Endereço: ${cliente.endereco}\n`
          : `\n🏠 Retirada no local`)
    );
  }, [carrinho, subtotal, total, tipoEntrega, cliente]);

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-end z-50">
      <div className="bg-white w-full max-w-sm h-full p-4 overflow-y-auto">
        <h2 className="font-bold text-lg mb-4">🛒 Seu carrinho</h2>

        {/* ITENS */}
        {carrinho.map((i: any) => (
          <div
            key={i.id}
            className="flex justify-between mb-2 text-sm"
          >
            <span>
              {i.quantidade}x {i.nome}
            </span>
            <span>
              R$ {(i.preco * i.quantidade).toFixed(2)}
            </span>
          </div>
        ))}

        <hr className="my-3" />

        {/* ENTREGA / RETIRADA */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setTipoEntrega("retirada")}
            className={`flex-1 py-2 rounded ${
              tipoEntrega === "retirada"
                ? "bg-red-600 text-white"
                : "border"
            }`}
          >
            Retirada
          </button>

          <button
            onClick={() => setTipoEntrega("entrega")}
            className={`flex-1 py-2 rounded ${
              tipoEntrega === "entrega"
                ? "bg-red-600 text-white"
                : "border"
            }`}
          >
            Entrega
          </button>
        </div>

        {/* DADOS DE ENTREGA */}
        {tipoEntrega === "entrega" && (
          <div className="space-y-2 mb-3">
            <input
              placeholder="Nome"
              className="w-full border p-2 rounded"
              value={cliente.nome}
              onChange={(e) =>
                setCliente({ ...cliente, nome: e.target.value })
              }
            />

            <input
              placeholder="WhatsApp"
              className="w-full border p-2 rounded"
              value={cliente.telefone}
              onChange={(e) =>
                setCliente({
                  ...cliente,
                  telefone: e.target.value,
                })
              }
            />

            <input
              placeholder="Endereço completo"
              className="w-full border p-2 rounded"
              value={cliente.endereco}
              onChange={(e) =>
                setCliente({
                  ...cliente,
                  endereco: e.target.value,
                })
              }
            />
          </div>
        )}

        {/* TOTAIS */}
        <div className="text-sm space-y-1">
          <p>Subtotal: R$ {subtotal.toFixed(2)}</p>
          <p>Frete: a calcular</p>
          <p className="font-bold">Total parcial: R$ {total.toFixed(2)}</p>
        </div>

        {/* FINALIZAR */}
        <a
          href={`https://wa.me/5511948163211?text=${mensagemWhatsApp}`}
          target="_blank"
          className="block mt-4 bg-green-600 text-white text-center py-2 rounded"
        >
          Finalizar pedido
        </a>

        {/* 🖨️ IMPRIMIR CUPOM */}
        <button
          type="button"
          onClick={() => window.open("/gigante/cupom", "_blank")}
          className="block w-full mt-2 bg-gray-900 text-white text-center py-2 rounded"
        >
          Imprimir cupom
        </button>

        <button
          onClick={() => setAberto(false)}
          className="mt-2 w-full text-sm text-gray-500"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
