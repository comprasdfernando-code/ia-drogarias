"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";

type CheckoutItem = {
  reference_id?: string;
  name: string;
  quantity: number;
  unit_amount: number;
};

type Cliente = {
  name: string;
  email: string;
  tax_id?: string;
  phone?: string;
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
  return (v / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PagbankPayment({
  orderId,
  cliente,
  items,
  onPaid,
}: {
  orderId: string;
  cliente: Cliente;
  items: CheckoutItem[];
  onPaid?: () => void;
}) {
  const [method, setMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");

  // PIX
  const [pixQrBase64, setPixQrBase64] = useState<string | null>(null);
  const [pixQrPngUrl, setPixQrPngUrl] = useState<string | null>(null);
  const [pixCopiaCola, setPixCopiaCola] = useState<string | null>(null);

  // Cartão
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpMonth, setCardExpMonth] = useState("");
  const [cardExpYear, setCardExpYear] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [holderCpf, setHolderCpf] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [copied, setCopied] = useState(false);

  const total = useMemo(
    () =>
      items.reduce(
        (acc, it) => acc + it.unit_amount * it.quantity,
        0
      ),
    [items]
  );

  const clienteSafe = useMemo(() => {
    return {
      ...cliente,
      tax_id: onlyDigits(cliente?.tax_id || "") || undefined,
      phone: onlyDigits(cliente?.phone || "") || undefined,
    };
  }, [cliente]);

  // Public Key
  useEffect(() => {
    fetch("/api/pagbank/public-key", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setPublicKey(j?.public_key || null))
      .catch(() => setPublicKey(null));
  }, []);

  async function createOrderPIX() {
    setErr(null);
    setLoading(true);
    setCopied(false);

    setPixQrBase64(null);
    setPixQrPngUrl(null);
    setPixCopiaCola(null);

    if (!clienteSafe.tax_id || clienteSafe.tax_id.length !== 11) {
      setLoading(false);
      setErr("CPF é obrigatório para pagamento via PIX.");
      return;
    }

    try {
      const resp = await fetch("/api/pagbank/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          forma_pagamento: "PIX",
          cliente: clienteSafe,
          items,
        }),
      });

      const data = await resp.json();

      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || "Erro ao gerar PIX");
      }

      // ✅ prioridade correta
      setPixQrBase64(data.qr_base64 || null);
      setPixQrPngUrl(data.qr_png_url || null);
      setPixCopiaCola(data.qr_text || null);
    } catch (e: any) {
      setErr(e.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  function encryptCard() {
    if (!publicKey) throw new Error("Public Key não carregada");
    if (!window.PagSeguro || !sdkReady)
      throw new Error("SDK PagBank não pronto");

    const result = window.PagSeguro.encryptCard({
      publicKey,
      holder: cardName.trim(),
      number: onlyDigits(cardNumber),
      expMonth: onlyDigits(cardExpMonth),
      expYear: onlyDigits(cardExpYear),
      securityCode: onlyDigits(cardCvv),
    });

    if (result?.hasErrors) {
      throw new Error("Dados do cartão inválidos");
    }

    return result.encryptedCard;
  }

  async function createOrderCard() {
    setErr(null);
    setLoading(true);

    const cpf = onlyDigits(holderCpf || clienteSafe.tax_id || "");
    if (cpf.length !== 11) {
      setErr("CPF do titular inválido");
      setLoading(false);
      return;
    }

    try {
      const encrypted = encryptCard();

      const resp = await fetch("/api/pagbank/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          forma_pagamento: "CREDIT_CARD",
          cliente: clienteSafe,
          items,
          card: {
            encrypted,
            holder_name: cardName,
            holder_cpf: cpf,
            installments: 1,
          },
        }),
      });

      const data = await resp.json();

      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || "Erro no cartão");
      }

      if (String(data?.status).toUpperCase() === "PAID") {
        onPaid?.();
      }

      alert("Pagamento enviado. Aguarde confirmação.");
    } catch (e: any) {
      setErr(e.message || "Erro no pagamento");
    } finally {
      setLoading(false);
    }
  }

  async function copyPix() {
    if (!pixCopiaCola) return;
    await navigator.clipboard.writeText(pixCopiaCola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full max-w-xl space-y-4 rounded-2xl border p-4">
      <Script
        src="https://assets.pagseguro.com.br/checkout-sdk-js/src/dist/browser/pagseguro.min.js"
        strategy="beforeInteractive"
        onLoad={() => setSdkReady(true)}
      />

      <div>
        <div className="text-sm opacity-70">Total</div>
        <div className="text-xl font-semibold">{moneyFromCents(total)}</div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm">
          {err}
        </div>
      )}

      {method === "PIX" && (
        <>
          <button
            className="w-full rounded-xl bg-black px-4 py-3 text-white"
            onClick={createOrderPIX}
            disabled={loading}
          >
            {loading ? "Gerando PIX..." : "Gerar PIX"}
          </button>

          {pixQrPngUrl && (
  <img
    className="w-64 rounded-xl border bg-white"
    src={pixQrPngUrl}
    alt="QR Code PIX"
  />
)}


          {pixCopiaCola && (
            <>
              <textarea
                className="w-full rounded-xl border p-2 text-xs"
                rows={4}
                value={pixCopiaCola}
                readOnly
              />
              <button
                className="w-full rounded-xl border px-4 py-3"
                onClick={copyPix}
              >
                {copied ? "Copiado ✅" : "Copiar PIX"}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
