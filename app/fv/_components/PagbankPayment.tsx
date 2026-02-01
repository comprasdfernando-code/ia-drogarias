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
  const v = Number(cents || 0) / 100 || 0;
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

function normStatusAny(raw: any) {
  const s = String(raw || "").trim().toUpperCase();
  if (!s) return "NOVO";

  if (s === "PAID") return "PAGO";
  if (s === "AUTHORIZED") return "AUTORIZADO";
  if (s === "APPROVED") return "APROVADO";
  if (s === "DECLINED") return "RECUSADO";
  if (s.includes("WAIT") || s.includes("PENDING")) return "PENDENTE";
  return s;
}

/**
 * Sanitiza base64 vindo do PagBank:
 * - remove quebras e espaços
 * - remove prefixo data:image/png;base64, se vier
 * - valida mínimo
 */
function sanitizeBase64(input: any) {
  const raw = String(input || "");
  if (!raw) return "";

  const cleaned = raw
    .trim()
    .replace(/\s+/g, "")
    .replace(/^data:image\/png;base64,/i, "")
    .replace(/^data:image\/jpeg;base64,/i, "")
    .replace(/^data:image\/jpg;base64,/i, "");

  // se veio HTML/erro, não tenta renderizar
  if (!cleaned || cleaned.startsWith("<")) return "";

  // base64 de png costuma ser grande; evita lixo curto
  if (cleaned.length < 120) return "";

  return cleaned;
}

/**
 * Tenta buscar base64 puro a partir de um "qr_base64_url" (PagBank).
 * OBS: pode falhar por CORS/CORB no browser — por isso é "best-effort".
 */
async function tryFetchBase64FromUrl(url: string) {
  if (!url) return "";
  try {
    const r = await fetch(url, { cache: "no-store" });
    const txt = await r.text();
    return sanitizeBase64(txt);
  } catch {
    return "";
  }
}

export default function PagbankPayment({ orderId, cliente, items, onPaid }: Props) {
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [status, setStatus] = useState<string>("NOVO");

  const [pixText, setPixText] = useState<string>("");
  const [qrBase64, setQrBase64] = useState<string>("");

  const [qrWarn, setQrWarn] = useState<string>("");

  const paidOnce = useRef(false);

  const totalCentavos = useMemo(() => sumTotal(items), [items]);
  const cpf = useMemo(() => onlyDigits(cliente.tax_id).slice(0, 11), [cliente.tax_id]);

  const setQrFromAny = useCallback((maybe: any) => {
    const s = sanitizeBase64(maybe);
    if (s) setQrBase64(s);
    return !!s;
  }, []);

  const loadOrderStatus = useCallback(async () => {
    if (!orderId) return;

    setChecking(true);
    setErr(null);
    setQrWarn("");

    const urls = [
      `/api/pagbank/order-status?order_id=${encodeURIComponent(orderId)}`,
      `/api/pagbank/status?order_id=${encodeURIComponent(orderId)}`,
    ];

    for (const url of urls) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        const parsed = await safeJson(r);

        if (!r.ok || !parsed.ok) {
          const snippet = String(parsed.raw || "").slice(0, 160);
          // Não assusta no começo: "venda não encontrada" acontece antes do create-order.
          if (url === urls[urls.length - 1]) {
            setErr(`status: HTTP ${r.status}${snippet ? ` | ${snippet}` : ""}`);
          }
          continue;
        }

        const j = parsed.json;

        const st = normStatusAny(
          pickFirst(j?.status, j?.data?.status, j?.order?.status, j?.venda?.status, "NOVO")
        );
        setStatus(st);

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
        if (qrText) setPixText(qrText);

        // tenta base64 direto
        const qr64 = pickFirst(
          j?.qr_base64,
          j?.qrBase64,
          j?.data?.qr_base64,
          j?.pix_qr_base64,
          ""
        );

        // tenta base64_url (best-effort no browser)
        const qr64Url = String(
          pickFirst(j?.qr_base64_url, j?.qrBase64Url, j?.data?.qr_base64_url, "") || ""
        );

        const got = setQrFromAny(qr64);

        if (!got && qr64Url && !qrBase64) {
          const fetched = await tryFetchBase64FromUrl(qr64Url);
          if (fetched) {
            setQrBase64(fetched);
          } else if (qrText) {
            setQrWarn(
              "QR Code em imagem bloqueado pelo navegador (PagBank/CORS). Use o 'copia e cola'. (Ideal: backend sempre devolver qr_base64.)"
            );
          }
        } else if (!got && !qrBase64 && qrText) {
          setQrWarn(
            "QR Code em imagem indisponível (sem qr_base64). Use o 'copia e cola'. (Ideal: backend devolver qr_base64.)"
          );
        }

        const paid = ["PAGO", "PAID", "CONFIRMED", "APROVADO", "APPROVED", "AUTORIZADO", "AUTHORIZED"].includes(
          st.toUpperCase()
        );

        if (paid && !paidOnce.current) {
          paidOnce.current = true;
          onPaid();
        }

        setChecking(false);
        return;
      } catch {
        if (url === urls[urls.length - 1]) setErr("status: falha de rede");
      }
    }

    setChecking(false);
  }, [onPaid, orderId, qrBase64, setQrFromAny]);

  const createOrderAndPix = useCallback(async () => {
    if (!orderId) return;

    setBusy(true);
    setErr(null);
    setQrWarn("");

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
          ? parsed.json?.error || parsed.json?.detalhe || `HTTP ${r.status}`
          : `HTTP ${r.status}`;
      setErr(`create-order: ${msg}`);
      setBusy(false);
      return;
    }

    const j = parsed.json;

    const qrText = String(pickFirst(j?.qr_text, "") || "");
    if (qrText) setPixText(qrText);

    const got = setQrFromAny(pickFirst(j?.qr_base64, ""));

    if (!got) {
      setQrWarn(
        "Pedido criado, mas qr_base64 não veio (ou veio inválido). Use 'copia e cola'. (Corrija o backend para sempre devolver qr_base64.)"
      );
    }

    await loadOrderStatus();
    setBusy(false);
  }, [cliente, cpf, items, loadOrderStatus, orderId, setQrFromAny, totalCentavos]);

  useEffect(() => {
    loadOrderStatus();
  }, [loadOrderStatus]);

  useEffect(() => {
    if (!orderId) return;
    const t = setInterval(() => loadOrderStatus(), 3500);
    return () => clearInterval(t);
  }, [orderId, loadOrderStatus]);

  // ✅ só tenta renderizar se base64 estiver válido
  const validQrBase64 = useMemo(() => {
    const s = sanitizeBase64(qrBase64);
    return s.length > 0;
  }, [qrBase64]);

  const hasAnyQr = validQrBase64 || !!pixText;

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm opacity-70">{checking ? "Verificando pagamento…" : " "}</div>
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
            {validQrBase64 ? (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${sanitizeBase64(qrBase64)}`}
                  alt="QR Code PIX"
                  className="w-[280px] max-w-full rounded-xl border bg-white p-2"
                  onError={() => {
                    // se por algum motivo falhar, derruba para "copia e cola"
                    setQrWarn(
                      "Falha ao renderizar a imagem do QR Code. Use o 'copia e cola'. (Geralmente é base64 inválido/truncado.)"
                    );
                    setQrBase64("");
                  }}
                />
              </div>
            ) : null}

            {qrWarn ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {qrWarn}
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
