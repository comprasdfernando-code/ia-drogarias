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
  phone?: string; // celular com DDD (ex: 11999998888)
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
  orderId: string;
  cliente: Cliente;
  items: CheckoutItem[];
  onPaid?: () => void;
}) {
  const [method, setMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");

  // PIX UI (novo formato)
  const [pixQrPngUrl, setPixQrPngUrl] = useState<string | null>(null);
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
  const [copied, setCopied] = useState(false);

  const total = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.unit_amount || 0) * (it.quantity || 0), 0);
  }, [items]);

  // garante dados mínimos pro PagBank (tax_id e phone)
  const clienteSafe = useMemo(() => {
    const tax = onlyDigits(cliente?.tax_id || "");
    const phone = onlyDigits(cliente?.phone || "");

    return {
      ...cliente,
      tax_id: tax || undefined,
      phone: phone || undefined,
    };
  }, [cliente]);

  // 1) pega public_key do seu endpoint
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/pagbank/public-key", { cache: "no-store" });
        const j = await r.json();
        setPublicKey(j?.public_key || null);
      } catch {
        setPublicKey(null);
      }
    })();
  }, []);

  // 2) carrega sdk do PagSeguro (criptografia) — só cartão
  useEffect(() => {
    if (method !== "CREDIT_CARD") return;
    if (window.PagSeguro) return;

    const script = document.createElement("script");
    script.src = "https://assets.pagseguro.com.br/checkout-sdk-js/1.0.0/checkout-sdk-js.js";
    script.async = true;
    document.body.appendChild(script);
  }, [method]);

  async function fetchBase64FromUrl(url: string) {
    // endpoint do PagBank de BASE64 geralmente retorna texto puro base64
    const r = await fetch(url, { method: "GET" });
    const t = await r.text();
    const base64 = (t || "").trim();
    if (!base64) throw new Error("Não foi possível obter QR BASE64");
    return base64;
  }

  async function createOrderPIX() {
    setErr(null);
    setCopied(false);
    setLoading(true);

    // limpa anterior
    setPixQrPngUrl(null);
    setPixQrBase64(null);
    setPixCopiaCola(null);

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
        throw new Error(data?.error || "Falha ao criar PIX");
      }

      // NOVO: vem do backend
      // data.qr_text, data.qr_png_url, data.qr_base64_url
      setPixCopiaCola(data.qr_text || null);
      setPixQrPngUrl(data.qr_png_url || null);

      // se não veio PNG, tenta buscar BASE64 via url
      if (!data.qr_png_url && data.qr_base64_url) {
        const b64 = await fetchBase64FromUrl(data.qr_base64_url);
        setPixQrBase64(b64);
      }

      // se veio base64 pronto (caso você coloque no backend depois)
      if (data.qr_base64) {
        setPixQrBase64(data.qr_base64);
      }
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
          cliente: clienteSafe,
          items,
          card: {
            encrypted,
            holder_name: cardName || clienteSafe?.name,
            holder_cpf: onlyDigits(holderCpf || clienteSafe?.tax_id || ""),
            installments: 1,
          },
        }),
      });

      const data = await resp.json();

      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || "Falha ao criar pagamento no cartão");
      }

      if (String(data?.status || "").toUpperCase() === "PAID") {
        onPaid?.();
      }

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

          {(pixQrPngUrl || pixQrBase64) && (
            <div className="space-y-2">
              <div className="text-sm opacity-70">Aponte a câmera ou use o app do banco</div>

              {pixQrPngUrl ? (
                <img
                  className="w-64 rounded-xl border"
                  src={pixQrPngUrl}
                  alt="QR Code PIX"
                />
              ) : (
                <img
                  className="w-64 rounded-xl border"
                  src={`data:image/png;base64,${pixQrBase64}`}
                  alt="QR Code PIX"
                />
              )}
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
                {copied ? "Copiado ✅" : "Copiar código PIX"}
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
