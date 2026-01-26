"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

function splitPhoneBR(phoneDigits: string) {
  // espera "5511999998888" ou "11999998888"
  let p = onlyDigits(phoneDigits || "");
  if (!p) return null;

  // remove 55 se vier
  if (p.length >= 12 && p.startsWith("55")) p = p.slice(2);

  // precisa pelo menos DDD + número
  if (p.length < 10) return null;

  const area = p.slice(0, 2);
  const number = p.slice(2); // 8 ou 9 dígitos
  return { country: "55", area, number, type: "MOBILE" as const };
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

  // PIX UI
  const [pixQrPngUrl, setPixQrPngUrl] = useState<string | null>(null);
  const [pixQrBase64, setPixQrBase64] = useState<string | null>(null);
  const [pixCopiaCola, setPixCopiaCola] = useState<string | null>(null);
  const [pixExpiresAt, setPixExpiresAt] = useState<string | null>(null);

  // Status/UI
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

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

  // garante dados mínimos pro PagBank
  const clienteSafe = useMemo(() => {
    const tax = onlyDigits(cliente?.tax_id || "");
    const phone = onlyDigits(cliente?.phone || "");

    return {
      ...cliente,
      tax_id: tax || undefined,
      phone: phone || undefined,
    };
  }, [cliente]);

  // limpa polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

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

  async function pollPaidOnce() {
    const r = await fetch("/api/pagbank/order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    });
    const j = await r.json().catch(() => ({}));
    const st = String(j?.venda?.status || "").toLowerCase();
    return st;
  }

  function startPollingPaid() {
    // evita múltiplos intervals
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }

    let tries = 0;
    setStatusMsg("Aguardando pagamento...");

    pollRef.current = window.setInterval(async () => {
      tries += 1;
      try {
        const st = await pollPaidOnce();
        if (st === "pago" || st === "paid" || st === "confirmed" || st === "approved") {
          if (pollRef.current) window.clearInterval(pollRef.current);
          pollRef.current = null;
          setStatusMsg("Pagamento aprovado ✅");
          onPaid?.();
          return;
        }

        // 10 min (100 tentativas * 6s)
        if (tries >= 100) {
          if (pollRef.current) window.clearInterval(pollRef.current);
          pollRef.current = null;
          setStatusMsg("PIX gerado. Se pagar e não atualizar, atualize a página.");
        }
      } catch {
        // ignora e tenta de novo
      }
    }, 6000);
  }

  async function createOrderPIX() {
    setErr(null);
    setCopied(false);
    setLoading(true);
    setStatusMsg(null);

    // limpa anterior
    setPixQrPngUrl(null);
    setPixQrBase64(null);
    setPixCopiaCola(null);
    setPixExpiresAt(null);

    try {
      // valida mínimos (sandbox costuma exigir)
      if (!clienteSafe?.tax_id) {
        throw new Error("CPF (tax_id) é obrigatório para gerar PIX.");
      }
      if (!clienteSafe?.phone) {
        throw new Error("Telefone (com DDD) é obrigatório para gerar PIX. Ex: 11999998888");
      }

      const phoneObj = splitPhoneBR(clienteSafe.phone);

      const resp = await fetch("/api/pagbank/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          forma_pagamento: "PIX",
          // manda no formato mais compatível (tax_id + phones)
          cliente: {
            name: clienteSafe.name,
            email: clienteSafe.email,
            tax_id: clienteSafe.tax_id,
            phones: phoneObj ? [phoneObj] : undefined,
          },
          items,
        }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || "Falha ao criar PIX");
      }

      // NOVO: vem do backend
      // data.qr_text, data.qr_png_url, data.qr_base64_url, data.qr_base64, data.expires_at
      setPixCopiaCola(data.qr_text || null);
      setPixQrPngUrl(data.qr_png_url || null);
      setPixExpiresAt(data.expires_at || data.pix_expires_at || null);

      // se não veio PNG, tenta buscar BASE64 via url
      if (!data.qr_png_url && data.qr_base64_url) {
        const b64 = await fetchBase64FromUrl(data.qr_base64_url);
        setPixQrBase64(b64);
      }

      // se veio base64 pronto
      if (data.qr_base64) {
        setPixQrBase64(data.qr_base64);
      }

      // ✅ começa a checar se pagou
      startPollingPaid();
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
    setStatusMsg(null);

    try {
      if (!clienteSafe?.tax_id) {
        throw new Error("CPF (tax_id) é obrigatório.");
      }

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

      const data = await resp.json().catch(() => ({}));

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

  const expiresLabel = useMemo(() => {
    if (!pixExpiresAt) return null;
    const d = new Date(pixExpiresAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString("pt-BR");
  }, [pixExpiresAt]);

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

      {statusMsg && (
        <div className="rounded-xl border bg-white p-3 text-sm">
          {statusMsg}
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

          {expiresLabel && (
            <div className="text-xs opacity-70">
              Expira em: <span className="font-medium">{expiresLabel}</span>
            </div>
          )}

          {(pixQrPngUrl || pixQrBase64) && (
            <div className="space-y-2">
              <div className="text-sm opacity-70">Aponte a câmera ou use o app do banco</div>

              {pixQrPngUrl ? (
                <img className="w-64 rounded-xl border" src={pixQrPngUrl} alt="QR Code PIX" />
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

          {!clienteSafe.tax_id && (
            <div className="text-xs text-red-700">
              Falta CPF (tax_id) no cliente para gerar PIX.
            </div>
          )}
          {!clienteSafe.phone && (
            <div className="text-xs text-red-700">
              Falta telefone (com DDD) no cliente para gerar PIX. Ex: 11999998888
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
