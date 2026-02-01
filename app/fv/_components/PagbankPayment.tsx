"use client";

import { useCallback, useMemo, useRef, useState } from "react";

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
 * - SEM verificação automática (remove 404 do order-status/status)
 * - Gera PIX via /api/pagbank/create-order
 * - Renderiza QR via base64 (se vier)
 * - Botão "Já paguei / Verificar" chama onPaid()
 */
export default function PagbankPayment({ orderId, cliente, items, onPaid }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [statusLabel, setStatusLabel] = useState<string>("NOVO");

  const [pixText, setPixText] = useState<string>("");
  const [qrBase64, setQrBase64] = useState<string>("");

  const paidOnce = useRef(false);

  const totalCentavos = useMemo(() => sumTotal(items), [items]);
  const cpf = useMemo(() => onlyDigits(cliente.tax_id).slice(0, 11), [cliente.tax_id]);

  const createOrderAndPix = useCallback(async () => {
    if (!orderId) {
      setErr("order_id não informado.");
      return;
    }

    // PIX exige CPF 11
    if (!cpf || cpf.length !== 11) {
      setErr("CPF inválido (precisa ter 11 dígitos) para gerar PIX.");
      return;
    }

    setBusy(true);
    setErr(null);
    setStatusLabel("GERANDO_PIX...");

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

    try {
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
        setStatusLabel("ERRO");
        setBusy(false);
        return;
      }

      const j = parsed.json;

      const qrText = String(pickFirst(j?.qr_text, "") || "");
      const qr64 = String(pickFirst(j?.qr_base64, "") || "");

      if (qrText) setPixText(qrText);
      if (qr64) setQrBase64(qr64);

      // se não vier base64, ainda assim o copia-e-cola funciona
      if (!qr64 && qrText) {
        // nada de erro vermelho – só informação
        setStatusLabel("PIX_GERADO");
      } else if (qr64) {
        setStatusLabel("PIX_GERADO");
      } else {
        setStatusLabel("PIX_GERADO");
      }
    } catch (e: any) {
      setErr(`create-order: falha de rede`);
      setStatusLabel("ERRO");
    } finally {
      setBusy(false);
    }
  }, [cliente, cpf, items, orderId, totalCentavos]);

  const hasAnyQr = !!qrBase64 || !!pixText;

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm opacity-70">Pagamento PIX</div>
        <div className="text-sm">
          Status: <b>{statusLabel || "—"}</b>
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

        {/* ✅ botão manual que você pediu */}
        <button
          type="button"
          className="mt-3 w-full rounded-xl border px-4 py-2 font-extrabold"
          onClick={() => {
            if (paidOnce.current) return;
            paidOnce.current = true;
            onPaid();
          }}
        >
          Já paguei / Verificar
        </button>

        {hasAnyQr ? (
          <div className="mt-4">
            {/* ✅ renderiza QR só se tiver base64 */}
            {qrBase64 ? (
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
