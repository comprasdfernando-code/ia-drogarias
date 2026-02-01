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
  return items.reduce((acc, it) => acc + (Number(it.unit_amount) || 0) * (Number(it.quantity) || 0), 0);
}

async function safeJson(r: Response) {
  const txt = await r.text();
  try {
    return { ok: true, json: JSON.parse(txt), raw: txt };
  } catch {
    return { ok: false, json: null, raw: txt };
  }
}

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

  const BASE = typeof window !== "undefined" ? window.location.origin : "";

  const cpf = useMemo(() => onlyDigits(cliente.tax_id).slice(0, 11), [cliente.tax_id]);

  const loadOrderStatus = useCallback(async () => {
    if (!orderId) return;

    setChecking(true);
    setErr(null);

    const url = `${BASE}/api/pagbank/order-status?order_id=${encodeURIComponent(orderId)}`;
    const r = await fetch(url, { cache: "no-store" });
    const parsed = await safeJson(r);

    if (!r.ok || !parsed.ok) {
      setErr(`order-status: HTTP ${r.status}`);
      setChecking(false);
      return;
    }

    const j = parsed.json;

    // aceite vários formatos
    const st = String(j?.status || j?.data?.status || j?.order?.status || "NOVO");
    setStatus(st);

    const qrText = String(j?.qr_text || j?.qrText || j?.data?.qr_text || "");
    const qrPng = String(j?.qr_png_url || j?.qr_png || j?.data?.qr_png_url || "");
    const qr64 = String(j?.qr_base64 || j?.qrBase64 || j?.data?.qr_base64 || "");

    if (qrText) setPixText(qrText);
    if (qrPng) setQrPngUrl(qrPng);
    if (qr64) setQrBase64(qr64);

    const paid = ["PAID", "PAGO", "CONFIRMED", "APPROVED", "AUTHORIZED"].includes(st.toUpperCase());
    if (paid && !paidOnce.current) {
      paidOnce.current = true;
      onPaid();
    }

    setChecking(false);
  }, [BASE, onPaid, orderId]);

  const createOrderAndPix = useCallback(async () => {
    if (!orderId) return;

    setBusy(true);
    setErr(null);

    const payload = {
      order_id: orderId,
      total_centavos: totalCentavos,
      cliente: {
        ...cliente,
        tax_id: cpf,
      },
      items,
    };

    const r = await fetch(`${BASE}/api/pagbank/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const parsed = await safeJson(r);

    if (!r.ok || !parsed.ok || !parsed.json?.ok) {
      const msg = parsed.ok ? (parsed.json?.error || `HTTP ${r.status}`) : `HTTP ${r.status}`;
      setErr(`create-order: ${msg}`);
      setBusy(false);
      return;
    }

    // depois de criar, já busca status pra pegar QR
    await loadOrderStatus();
    setBusy(false);
  }, [BASE, cliente, cpf, items, loadOrderStatus, orderId, totalCentavos]);

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
          <button type="button" onClick={loadOrderStatus} className="rounded-lg border px-3 py-1.5 text-xs font-bold">
            Atualizar
          </button>
        </div>

        {hasAnyQr ? (
          <div className="mt-4">
            {qrPngUrl ? (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrPngUrl} alt="QR Code PIX" className="w-[280px] max-w-full rounded-xl border bg-white p-2" />
              </div>
            ) : qrBase64 ? (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${qrBase64}`}
                  alt="QR Code PIX"
                  className="w-[280px] max-w-full rounded-xl border bg-white p-2"
                />
              </div>
            ) : null}

            {pixText ? (
              <div className="mt-3">
                <div className="text-xs font-bold opacity-70 mb-1">Copia e cola</div>
                <textarea value={pixText} readOnly className="w-full rounded-xl border bg-white p-2 text-xs font-mono" rows={4} />
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
