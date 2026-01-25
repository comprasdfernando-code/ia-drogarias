"use client";

import { useEffect, useMemo, useState } from "react";

type CheckoutItem = {
  reference_id?: string;
  name: string;
  quantity: number;
  unit_amount: number; // centavos
};

type Cliente = {
  name: string;
  email: string;
  tax_id?: string; // CPF
  phone?: string;  // celular com DDD
};

declare global {
  interface Window {
    PagSeguro?: any;
  }
}

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function moneyFromCents(v: number) {
  return (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PagbankPayment({
  orderId,
  cliente,
  items,
  onPaid,
}: {
  orderId: string;        // id da venda/pedido no seu supabase (vendas_site.id)
  cliente: Cliente;
  items: CheckoutItem[];
  onPaid?: () => void;    // callback opcional
}) {
  const [method, setMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");

  // PIX UI
  const [pixQrBase64, setPixQrBase64] = useState<string | null>(null);
  const [pixCopiaCola, setPixCopiaCola] = useState<string | null>(null);

  // Cartão UI
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpMonth, setCardExpMonth] = useState("");
  const [cardExpYear, setCardExpYear] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [holderCpf, setHolderCpf] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const total = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.unit_amount || 0) * (it.quantity || 0), 0);
  }, [items]);

  // 1) pega public_key do seu endpoint
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/pagbank/public-key");
        const j = await r.json();
        setPublicKey(j?.public_key || null);
      } catch {
        setPublicKey(null);
      }
    })();
  }, []);

  // 2) carrega sdk do PagSeguro (criptografia)
  useEffect(() => {
    // só precisa para cartão
    if (method !== "CREDIT_CARD") return;

    // se já existe, ok
    if (window.PagSeguro) return;

    const script = document.createElement("script");
    script.src = "https://assets.pagseguro.com.br/checkout-sdk-js/1.0.0/checkout-sdk-js.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // não remove pra evitar reload
    };
  }, [method]);

  async function createOrderPIX() {
    setErr(null);
    setLoading(true);

    try {
      const resp = await fetch("/api/pagbank/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          forma_pagamento: "PIX",
          cliente,
          items,
        }),
      });

      const data = await resp.json();

      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || "Falha ao criar PIX");
      }

      setPixQrBase64(data.pix_qr_base64 || null);
      setPixCopiaCola(data.pix_copia_cola || null);

    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  function encryptCard() {
    if (!publicKey) throw new Error("Public Key do PagBank não carregou");
    if (!window.PagSeguro) throw new Error("SDK PagSeguro não carregou");

    const encrypted = window.PagSeguro.encryptCard({
      publicKey,
      holder: cardName,
      number: onlyDigits(cardNumber),
      expMonth: onlyDigits(cardExpMonth),
      expYear: onlyDigits(cardExpYear),
      securityCode: onlyDigits(cardCvv),
    });

    if (!encrypted) throw new Error("Falha ao criptografar cartão");

    return encrypted;
  }

  async function createOrderCard() {
    setErr(null);
    setLoading(true);

    try {
      const encrypted = encryptCard();

      const resp = await fetch("/api/pagbank/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          forma_pagamento: "CREDIT_CARD",
          cliente,
          items,
          card: {
            encrypted,
            holder_name: cardName || cliente?.name,
            holder_tax_id: onlyDigits(holderCpf || cliente?.tax_id || ""),
          },
        }),
      });

      const data = await resp.json();

      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || "Falha ao criar pagamento no cartão");
      }

      // se vier PAID já pode avançar
      if (String(data?.status || "").toUpperCase() === "PAID") {
        onPaid?.();
      }

      // opcional: você pode mostrar “Pagamento processado”
      alert("Pagamento enviado! Se aprovado, o pedido será atualizado automaticamente.");

    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function copyPix() {
    if (!pixCopiaCola) return;
    await navigator.clipboard.writeText(pixCopiaCola);
    alert("PIX copia e cola copiado!");
  }

  return (
    <div className="w-full max-w-xl space-y-4 rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm opacity-70">Total</div>
          <div className="text-xl font-semibold">{moneyFromCents(total)}</div>
        </div>

        <div className="flex gap-2">
          <button
            className={`rounded-xl px-3 py-2 text-sm border ${method === "PIX" ? "font-semibold" : "opacity-70"}`}
            onClick={() => setMethod("PIX")}
            disabled={loading}
          >
            PIX
          </button>
          <button
            className={`rounded-xl px-3 py-2 text-sm border ${method === "CREDIT_CARD" ? "font-semibold" : "opacity-70"}`}
            onClick={() => setMethod("CREDIT_CARD")}
            disabled={loading}
          >
            Cartão
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm">
          {err}
        </div>
      )}

      {method === "PIX" ? (
        <div className="space-y-3">
          <button
            className="w-full rounded-xl bg-black px-4 py-3 text-white disabled:opacity-60"
            onClick={createOrderPIX}
            disabled={loading}
          >
            {loading ? "Gerando PIX..." : "Gerar PIX"}
          </button>

          {pixQrBase64 && (
            <div className="space-y-2">
              <div className="text-sm opacity-70">Aponte a câmera ou use o app do banco</div>
              <img
                className="w-64 rounded-xl border"
                src={`data:image/png;base64,${pixQrBase64}`}
                alt="QR Code PIX"
              />
            </div>
          )}

          {pixCopiaCola && (
            <div className="space-y-2">
              <div className="text-sm opacity-70">PIX Copia e Cola</div>
              <textarea
                className="w-full rounded-xl border p-2 text-xs"
                rows={4}
                value={pixCopiaCola}
                readOnly
              />
              <button
                className="w-full rounded-xl border px-4 py-3 disabled:opacity-60"
                onClick={copyPix}
                disabled={loading}
              >
                Copiar código PIX
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <input
              className="rounded-xl border p-2"
              placeholder="Nome no cartão"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              disabled={loading}
            />
            <input
              className="rounded-xl border p-2"
              placeholder="Número do cartão"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              disabled={loading}
            />

            <div className="grid grid-cols-3 gap-2">
              <input
                className="rounded-xl border p-2"
                placeholder="MM"
                value={cardExpMonth}
                onChange={(e) => setCardExpMonth(e.target.value)}
                disabled={loading}
              />
              <input
                className="rounded-xl border p-2"
                placeholder="AAAA"
                value={cardExpYear}
                onChange={(e) => setCardExpYear(e.target.value)}
                disabled={loading}
              />
              <input
                className="rounded-xl border p-2"
                placeholder="CVV"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value)}
                disabled={loading}
              />
            </div>

            <input
              className="rounded-xl border p-2"
              placeholder="CPF do titular"
              value={holderCpf}
              onChange={(e) => setHolderCpf(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            className="w-full rounded-xl bg-black px-4 py-3 text-white disabled:opacity-60"
            onClick={createOrderCard}
            disabled={loading}
          >
            {loading ? "Processando..." : "Pagar com cartão"}
          </button>

          <div className="text-xs opacity-70">
            * O cartão é criptografado no navegador e enviado como “encrypted”.
          </div>
        </div>
      )}
    </div>
  );
}
