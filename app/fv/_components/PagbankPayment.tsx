"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Cliente = {
  name: string;
  email: string;
  tax_id: string; // CPF 11
  phone?: string;
};

type Item = {
  reference_id: string;
  name: string;
  quantity: number;
  unit_amount: number; // centavos
};

type Props = {
  orderId: string;
  cliente: Cliente;
  items: Item[];
  onPaid: () => void;
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function brlFromCents(cents: number) {
  const v = (Number(cents || 0) / 100) || 0;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function sumTotal(items: Item[]) {
  return items.reduce(
    (acc, it) => acc + (Number(it.unit_amount) || 0) * (Number(it.quantity) || 0),
    0
  );
}

async function safeJson(r: Response) {
  const txt = await r.text();
  try {
    return { ok: true, json: JSON.parse(txt), raw: txt };
  } catch {
    return { ok: false, json: null, raw: txt };
  }
}

function pickFirst(...vals: any[]) {
  for (const v of vals) {
    if (v === 0) return v;
    if (v !== undefined && v !== null && String(v).trim?.() !== "") return v;
  }
  return null;
}

/**
 * ✅ PagbankPayment (default export)
 * Corrige:
 * - "Module has no default export" (você importa como default no CheckoutClient)
 * - polling + leitura de QR retornando de /api/pagbank/order-status (ou /api/pagbank/status fallback)
 * - não trava em erro: mostra detalhe (snippet) quando vier HTML/500
 */
export default function PagbankPayment({ orderId, cliente, items, onPaid }: Props) {
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [status, setStatus] = useState<string>("NOVO");

  const [pixText, setPixText] = useState<string>("");
  const [qrPngUrl, setQrPngUrl] = useState<string>("");
  const [qrBase64, setQrBase64] = useState<string>("");

  const paidOnce = useRef(false);

  const totalCentavos = useMemo(() => sumTotal(items), [items]);
  const cpf = useMemo(() => onlyDigits(cliente.tax_id).slice(0, 11), [cliente.tax_id]);

  const loadOrderStatus = useCallback(async () => {
    if (!orderId) return;

    setChecking(true);
    setErr(null);

    // ✅ prioridade: order-status (é o que você está usando na tela)
    const urls = [
      `/api/pagbank/order-status?order_id=${encodeURIComponent(orderId)}`,
      `/api/pagbank/status?order_id=${encodeURIComponent(orderId)}`,
    ];

    for (const url of urls) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        const parsed = await safeJson(r);

        if (!r.ok || !parsed.ok) {
          // se veio HTML ou erro, tenta próximo endpoint
          const snippet = String(parsed.raw || "").slice(0, 160);
          if (url === urls[urls.length - 1]) {
            setErr(`order-status: HTTP ${r.status} ${snippet ? `| ${snippet}` : ""}`);
          }
          continue;
        }

        const j = parsed.json;

        // ✅ status pode vir em vários formatos
        const st = String(
          pickFirst(
            j?.status,
            j?.data?.status,
            j?.order?.status,
            j?.venda?.status,
            "NOVO"
          )
        );
        setStatus(st);

        // ✅ QR pode vir direto no payload do order-status (pelo teu handle)
        const qrText = String(
          pickFirst(
            j?.qr_text,
            j?.qrText,
            j?.data?.qr_text,
            j?.pix_text,
            j?.pix_copia_cola,
            ""
          ) || ""
        );

        const qrPng = String(
          pickFirst(
            j?.qr_png_url,
            j?.qr_png,
            j?.data?.qr_png_url,
            j?.pix_qr_png_url,
            ""
          ) || ""
        );

        const qr64 = String(
          pickFirst(
            j?.qr_base64,
            j?.qrBase64,
            j?.data?.qr_base64,
            j?.pix_qr_base64,
            ""
          ) || ""
        );

        if (qrText) setPixText(qrText);
        if (qrPng) setQrPngUrl(qrPng);
        if (qr64) setQrBase64(qr64);

        const paid = ["PAID", "PAGO", "CONFIRMED", "APPROVED", "AUTHORIZED", "PAGO_PIX", "PAGO_CARTAO"].includes(
          st.toUpperCase()
        );

        if (paid && !paidOnce.current) {
          paidOnce.current = true;
          onPaid();
        }

        setChecking(false);
        return; // ✅ sucesso em algum endpoint
      } catch (e: any) {
        if (url === urls[urls.length - 1]) {
          setErr(`order-status: falha de rede`);
        }
      }
    }

    setChecking(false);
  }, [onPaid, orderId]);

  const createOrderAndPix = useCallback(async () => {
    if (!orderId) return;

    setBusy(true);
    setErr(null);

    const payload = {
      order_id: orderId, // FV_...
      forma_pagamento: "PIX",
      cliente: {
        ...cliente,
        tax_id: cpf,
      },
      items,
      itens: items, // compat
      total_centavos: totalCentavos,
    };

    const r = await fetch(`/api/pagbank/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const parsed = await safeJson(r);

    if (!r.ok || !parsed.ok || !parsed.json?.ok) {
      const msg =
        parsed.ok
          ? (parsed.json?.error || parsed.json?.detalhe || `HTTP ${r.status}`)
          : `HTTP ${r.status}`;
      setErr(`create-order: ${msg}`);
      setBusy(false);
      return;
    }

    // ✅ já traz QR no retorno do create-order (mas mantém fallback do polling)
    const j = parsed.json;
    const qrText = String(pickFirst(j?.qr_text, "") || "");
    const qrPng = String(pickFirst(j?.qr_png_url, "") || "");
    const qr64 = String(pickFirst(j?.qr_base64, "") || "");

    if (qrText) setPixText(qrText);
    if (qrPng) setQrPngUrl(qrPng);
    if (qr64) setQrBase64(qr64);

    // depois de criar, busca status (garante sincronismo)
    await loadOrderStatus();
    setBusy(false);
  }, [cliente, cpf, items, loadOrderStatus, orderId, totalCentavos]);

  useEffect(() => {
    loadOrderStatus();
  }, [loadOrderStatus]);

  useEffect(() => {
    if (!orderId) return;
    const t = setInterval(() => loadOrderStatus(), 3500);
    return () => clearInterval(t);
  }, [orderId, loadOrderStatus]);

  const hasAnyQr = !!qrPngUrl || !!qrBase64 || !!pixText;

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm opacity-70">Verificando pagamento…</div>
        <div className="text-sm">
          Status: <b>{status || "—"}</b>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border p-4">
        <div className="text-sm opacity-70">Total</div>
        <div className="text-2xl font-extrabold">{brlFromCents(totalCentavos)}</div>

        {err ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <button
          type="button"
          onClick={createOrderAndPix}
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-black px-4 py-3 font-extrabold text-white hover:bg-gray-900 disabled:opacity-60"
        >
          {busy ? "Gerando…" : "Gerar PIX"}
        </button>

        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="opacity-70">
            Status: <b>{checking ? "…" : status || "—"}</b>
          </div>
          <button
            type="button"
            onClick={loadOrderStatus}
            className="rounded-lg border px-3 py-1.5 text-xs font-bold"
          >
            Atualizar
          </button>
        </div>

        {hasAnyQr ? (
          <div className="mt-4">
            {qrBase64 ? (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${qrBase64}`}
                  alt="QR Code PIX"
                  className="w-[280px] max-w-full rounded-xl border bg-white p-2"
                />
              </div>
            ) : qrPngUrl ? (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrPngUrl}
                  alt="QR Code PIX"
                  className="w-[280px] max-w-full rounded-xl border bg-white p-2"
                />
              </div>
            ) : null}

            {pixText ? (
              <div className="mt-3">
                <div className="mb-1 text-xs font-bold opacity-70">Copia e cola</div>
                <textarea
                  value={pixText}
                  readOnly
                  className="w-full rounded-xl border bg-white p-2 font-mono text-xs"
                  rows={4}
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(pixText);
                    } catch {}
                  }}
                  className="mt-2 w-full rounded-xl border px-4 py-2 font-extrabold"
                >
                  Copiar PIX
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
