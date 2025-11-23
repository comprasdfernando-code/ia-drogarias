"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function PagamentoPage({ params }) {
  const orderId = params.orderId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("pending");

  // Iniciar pagamento (gera QR Code e link cartão)
  async function iniciarPagamento() {
    const res = await fetch("/api/pagbank/create-order", {
      method: "POST",
      body: JSON.stringify({
        order_id: orderId,
        forma_pagamento: "PIX", // inicia com PIX
        cliente: {
          name: "Cliente IA Drogarias",
          email: "cliente@email.com",
        },
        itens: [
          {
            name: `Pedido #${orderId}`,
            quantity: 1,
            unit_amount: 100, // valor fictício, você troca pelo total real
          },
        ],
      }),
    });

    const data = await res.json();

    setQrBase64(data.qr_base64);
    setCheckoutUrl(data.checkout_url);
    setLoading(false);
  }

  // Checar status
  useEffect(() => {
    iniciarPagamento();

    const interval = setInterval(async () => {
      const resp = await fetch(`/api/pedidos/status?orderId=${orderId}`);
      const result = await resp.json();

      if (result.status === "pago" || result.status === "paid") {
        clearInterval(interval);
        router.push("/pedido-confirmado");
      }

      setStatus(result.status);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
        Pagamento do Pedido #{orderId}
      </h1>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        {/* STATUS */}
        <p className="text-center text-gray-600 mb-4">
          Status:{" "}
          <span className="text-blue-700 font-semibold uppercase">
            {status}
          </span>
        </p>

        {loading && (
          <p className="text-center text-gray-500 animate-pulse">
            Gerando pagamento...
          </p>
        )}

        {/* QR CODE PIX */}
        {!loading && qrBase64 && (
          <>
            <p className="text-center text-sm text-gray-600 mb-3">
              Aponte a câmera do celular:
            </p>

            <div className="flex justify-center">
              <Image
                src={`data:image/png;base64,${qrBase64}`}
                alt="QR Code PagBank"
                width={240}
                height={240}
                className="shadow-lg border border-blue-200 rounded-xl"
              />
            </div>
          </>
        )}

        {/* Botão cartão */}
        {!loading && checkoutUrl && (
          <button
            onClick={() => (window.location.href = checkoutUrl)}
            className="mt-8 w-full py-3 bg-gradient-to-r from-blue-600 to-green-500 text-white font-semibold rounded-xl shadow hover:opacity-90 transition"
          >
            Pagar com Cartão (Crédito / Débito)
          </button>
        )}

        <p className="mt-6 text-center text-xs text-gray-500">
          Pagamentos seguros via <b>PagBank</b> – IA Drogarias
        </p>
      </div>
    </main>
  );
}
