"use client";

import Image from "next/image";
import { X, Minus, Plus, Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  cart: any[];
  changeQty: (id: string, qty: number) => void;
  total: number;
  onClose: () => void;
  onSend: () => void;
};

export default function CartSidebar({
  open,
  cart,
  changeQty,
  total,
  onClose,
  onSend,
}: Props) {
  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${open ? "visible" : "invisible"}`}>
      
      {/* Fundo escuro com blur — estilo iFood */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Painel lateral */}
      <div
        className={`
          absolute right-0 top-0 h-full w-[85%] sm:w-96 bg-white 
          shadow-2xl rounded-l-2xl flex flex-col 
          transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b">
  <h2 className="text-xl font-bold">Seu Pedido</h2>

  {/* BOTÃO VOLTAR PARA LOJA */}
  <button
  onClick={onClose}
  className="px-4 py-2 rounded-full bg-white shadow hover:shadow-md border text-neutral-700 font-medium"
>
  ← Voltar para a Loja
</button>

</div>


        {/* Lista de itens */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="text-neutral-500 text-center mt-20 text-lg">
              Seu carrinho está vazio 😕
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 border rounded-xl shadow-sm bg-white"
              >
                {/* Imagem do produto */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-neutral-100">
                  {item.imagem_url ? (
                    <Image
                      src={item.imagem_url}
                      alt={item.nome}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-neutral-400 text-xs">
                      sem imagem
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="font-semibold text-fuchsia-700 text-sm">
                      {item.nome}
                    </div>
                    {item.sabor && (
                      <div className="text-xs text-neutral-500">
                        {item.sabor}
                      </div>
                    )}
                  </div>

                  {/* Controles de quantidade */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => changeQty(item.id, item.qty - 1)}
                      className="p-1 rounded-full bg-neutral-200 hover:bg-neutral-300"
                    >
                      <Minus size={16} />
                    </button>

                    <span className="font-semibold text-neutral-800 select-none">
                    {item.qty}
                    </span>


                    <button
                      onClick={() => changeQty(item.id, item.qty + 1)}
                      className="p-1 rounded-full bg-fuchsia-600 text-white hover:bg-fuchsia-700"
                    >
                      <Plus size={16} />
                    </button>

                    <button
                      onClick={() => changeQty(item.id, 0)}
                      className="ml-auto text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Preço */}
                <div className="font-bold text-fuchsia-700 whitespace-nowrap">
                  R$ {(item.preco * item.qty).toFixed(2).replace(".", ",")}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé com total */}
        <div className="p-5 border-t bg-white shadow-xl rounded-bl-2xl">
          <div className="flex justify-between text-lg font-semibold mb-3">
            <span className="text-neutral-600">Total:</span>
            <span className="text-fuchsia-700 font-extrabold">
              R$ {total.toFixed(2).replace(".", ",")}
            </span>
          </div>

          <button
            onClick={onSend}
            disabled={cart.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-lg font-bold shadow-md disabled:opacity-40"
          >
            Finalizar no WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
