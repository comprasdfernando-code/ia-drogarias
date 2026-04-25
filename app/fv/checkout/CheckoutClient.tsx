"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/app/fv/_components/cart";
import { useRouter } from "next/navigation";

export default function CheckoutClient() {
  const { items, subtotal, clear, endereco } = useCart();
  const router = useRouter();

  const [enderecoEntrega, setEnderecoEntrega] = useState({
    endereco: "",
    numero: "",
    bairro: "",
    complemento: "",
    referencia: "",
  });

  // 🔥 PUXA ENDEREÇO AUTOMÁTICO
  useEffect(() => {
    if (endereco) {
      setEnderecoEntrega({
        endereco: endereco.endereco || "",
        numero: endereco.numero || "",
        bairro: endereco.bairro || "",
        complemento: endereco.complemento || "",
        referencia: endereco.referencia || "",
      });
    }
  }, [endereco]);

  // 🔥 FINALIZAR PEDIDO
  function handleFinalizar() {
    if (
      !enderecoEntrega.endereco ||
      !enderecoEntrega.numero ||
      !enderecoEntrega.bairro
    ) {
      alert("Preencha o endereço de entrega");
      return;
    }

    alert("Pedido criado! Agora realize o pagamento via PIX.");
  }

  // 🔥 BOTÃO JÁ PAGUEI
  function handleJaPaguei() {
    try {
      const KEYS = [
        "FV_CART_V1",
        "FV_ENDERECO_ENTREGA_V1",
        "cart_fv",
        "cart_farmacia_virtual",
        "cart_fv_virtual",
        "cart_iadrogarias_fv",
      ];

      KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {}

    clear();
    router.push("/fv");
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold">Checkout</h1>

      {/* ENDEREÇO */}
      <div className="border p-4 rounded space-y-2">
        <h2 className="font-semibold">Endereço de entrega</h2>

        <input
          placeholder="Endereço"
          className="w-full border p-2 rounded"
          value={enderecoEntrega.endereco}
          onChange={(e) =>
            setEnderecoEntrega({ ...enderecoEntrega, endereco: e.target.value })
          }
        />

        <input
          placeholder="Número"
          className="w-full border p-2 rounded"
          value={enderecoEntrega.numero}
          onChange={(e) =>
            setEnderecoEntrega({ ...enderecoEntrega, numero: e.target.value })
          }
        />

        <input
          placeholder="Bairro"
          className="w-full border p-2 rounded"
          value={enderecoEntrega.bairro}
          onChange={(e) =>
            setEnderecoEntrega({ ...enderecoEntrega, bairro: e.target.value })
          }
        />

        <input
          placeholder="Complemento"
          className="w-full border p-2 rounded"
          value={enderecoEntrega.complemento}
          onChange={(e) =>
            setEnderecoEntrega({
              ...enderecoEntrega,
              complemento: e.target.value,
            })
          }
        />
      </div>

      {/* RESUMO */}
      <div className="border p-4 rounded space-y-2">
        <h2 className="font-semibold">Resumo</h2>

        {items.map((item) => (
          <div key={item.ean} className="text-sm">
            {item.nome} — {item.qtd}x R$ {item.preco}
          </div>
        ))}

        <div className="font-bold mt-2">
          Total: R$ {subtotal.toFixed(2)}
        </div>
      </div>

      {/* BOTÃO FINALIZAR */}
      <button
        onClick={handleFinalizar}
        className="w-full bg-blue-600 text-white py-3 rounded font-bold"
      >
        Gerar pagamento PIX
      </button>

      {/* PIX SIMULADO */}
      <div className="border p-4 rounded text-center space-y-2">
        <div className="text-sm">Chave PIX:</div>
        <div className="font-mono text-xs break-all">
          00020101021226850014BR.GOV.BCB.PIX2563exemplo-pix-chave520400005303986540510.005802BR5925IA DROGARIAS6009SAO PAULO62070503***6304ABCD
        </div>

        <button
          onClick={() => navigator.clipboard.writeText("PIX-COPIADO")}
          className="w-full bg-gray-800 text-white py-2 rounded font-bold"
        >
          Copiar código PIX
        </button>

        {/* 🔥 BOTÃO NOVO */}
        <button
          onClick={handleJaPaguei}
          className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-bold"
        >
          ✅ Já paguei
        </button>

        <div className="text-xs text-gray-500">
          Após o pagamento, clique em "Já paguei"
        </div>
      </div>
    </div>
  );
}