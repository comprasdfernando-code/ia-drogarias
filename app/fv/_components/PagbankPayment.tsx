"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Cliente = {
  name: string;
  email: string;
  tax_id: string; // CPF
  phone?: string;
};

type PayItem = {
  reference_id: string;
  name: string;
  quantity: number;
  unit_amount: number; // CENTAVOS
};

type PixResp = {
  ok?: boolean;
  status?: string;
  pagbank_id?: string;

  qr_text?: string;
  qr_png_url?: string;
  qr_base64?: string;
  qr_base64_url?: string;
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function brlFromCents(cents: number) {
  const v = (Number(cents) || 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function safeJson(resp: Response) {
  const txt = await resp.text();
  try {
    return { ok: true, json: JSON.parse(txt), raw: txt };
  } catch {
    return { ok: false, json: null, raw: txt };
  }
}

function pickFirst<T = any>(...vals: any[]): T | null {
  for (const v of vals) {
    if (v === 0) return v as T;
    if (v !== undefined && v !== null && String(v).trim?.() !== "") return v as T;
  }
  return null;
}

function normalizePix(resp: any): PixResp {
  const r = resp?.data ?? resp?.pix ?? resp ?? {};
  return {
    ok: !!pickFirst(r?.ok, resp?.ok, true),
    status: String(pickFirst(r?.status, resp?.status, "") || ""),
    pagbank_id: String(pickFirst(r?.pagbank_id, r?.charge_id, r?.id, resp?.pagbank_id, "") || ""),

    qr_text: String(pickFirst(r?.qr_text, r?.qrText, r?.text, r?.emv, r?.copy_paste, r?.copia_e_cola, "") || ""),
    qr_png_url: String(pickFirst(r?.qr_png_url, r?.qrPngUrl, r?.png_url, r?.qr_code_url, r?.qrCodeUrl, "") || ""),
    qr_base64: String(pickFirst(r?.qr_base64, r?.qrBase64, r?.base64, "") || ""),
    qr_base64_url: String(pickFirst(r?.qr_base64_url, r?.qrBase64Url, r?.base64_url, r?.qr_code_base64, "") || ""),
  };
}

function normalizeStatus(resp: any): string {
  const r = resp?.data ?? resp?.venda ?? resp?.pedido ?? resp ?? {};
  return String(pickFirst(r?.status, resp?.status, "") || "").toUpperCase();
}

function isPaidStatus(st: string) {
  const s = (st || "").toUpperCase();
  return s === "PAID" || s === "CONFIRMED" || s === "AUTHORIZED";
}

/** Faz POST; se der 405 tenta GET com query */
async function fetchWith405Fallback(
  baseUrl: string,
  payload: any,
  query: Record<string, string>
): Promise<{ resp: Response; parsed: { ok: boolean; json: any; raw: string } }> {
  // 1) POST
  const r1 = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (r1.status !== 405) {
    const parsed = await safeJson(r1);
    return { resp: r1, parsed };
  }

  // 2) GET fallback
  const qs = new URLSearchParams(query).toString();
  const urlGet = `${baseUrl}?${qs}`;

  const r2 = await fetch(urlGet, { method: "GET", cache: "no-store" });
  const parsed2 = await safeJson(r2);
  return { resp: r2, parsed: parsed2 };
}

export default function PagbankPayment({
  orderId,
  cliente,
  items,
  onPaid,
}: {
  orderId: string;
  cliente: Cliente;
  items: PayItem[];
  onPaid: () => void;
}) {
  const totalCents = useMemo(() => {
    return (items || []).reduce(
      (acc, it) => acc + (Number(it.unit_amount) || 0) * (Number(it.quantity) || 0),
      0
    );
  }, [items]);

  const cpfOk = useMemo(() => onlyDigits(cliente?.tax_id || "").length === 11, [cliente?.tax_id]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [pix, setPix] = useState<PixResp | null>(null);
  const [status, setStatus] = useState<string>("");

  const paidOnceRef = useRef(false);
  const pollingRef = useRef<any>(null);

  async function checkStatus() {
    try {
      const url = `/api/pagbank/status?order_id=${encodeURIComponent(orderId)}`;
      const r = await fetch(url, { cache: "no-store" });
      const parsed = await safeJson(r);

      if (!r.ok) return;

      const st = normalizeStatus(parsed.json);
      if (st) setStatus(st);

      if (st && isPaidStatus(st) && !paidOnceRef.current) {
        paidOnceRef.current = true;
        onPaid();
      }
    } catch {
      // ignora
    }
  }

  function startPolling() {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(checkStatus, 3000);
  }
  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  useEffect(() => {
    startPolling();
    checkStatus();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function gerarPix() {
    if (!orderId) return setErr("order_id não informado.");
    if (!cpfOk) return setErr("CPF é obrigatório para PIX (11 dígitos).");
    if (!items?.length) return setErr("Sem itens válidos para pagamento.");
    if (totalCents <= 0) return setErr("Total inválido (R$ 0,00).");

    setBusy(true);
    setErr(null);

    const payload = {
      order_id: orderId,
      customer: {
        name: cliente?.name || "Cliente",
        email: cliente?.email || "cliente@iadrogarias.com",
        tax_id: onlyDigits(cliente?.tax_id || ""),
        phone: onlyDigits(cliente?.phone || ""),
      },
      items,
      amount: totalCents, // centavos
      currency: "BRL",
    };

    const query = {
      order_id: orderId,
      tax_id: onlyDigits(cliente?.tax_id || ""),
      amount: String(totalCents),
    };

    const routes = ["/api/pagbank/create-pix", "/api/pagbank/pix", "/api/pagbank/create"];

    try {
      let lastMsg = "";

      for (const route of routes) {
        const { resp, parsed } = await fetchWith405Fallback(route, payload, query);

        if (!resp.ok) {
          const msg =
            (parsed.ok && (parsed.json?.error || parsed.json?.message)) ||
            `HTTP ${resp.status} (${resp.statusText || "erro"})`;
          lastMsg = `${route}: ${msg}`;
          continue;
        }

        // ok
        const norm = normalizePix(parsed.json);
        setPix(norm);
        if (norm?.status) setStatus(String(norm.status).toUpperCase());

        startPolling();
        checkStatus();
        return;
      }

      setErr(lastMsg || "Falha ao gerar PIX.");
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function copiarPix() {
    const text = String(pix?.qr_text || "");
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      alert("PIX copiado ✅");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("PIX copiado ✅");
    }
  }

  const qrImgSrc = useMemo(() => {
    if (!pix) return "";
    if (pix.qr_png_url && pix.qr_png_url.startsWith("http")) return pix.qr_png_url;

    if (pix.qr_base64 && pix.qr_base64.length > 30) {
      const b64 = pix.qr_base64.replace(/^data:image\/png;base64,/, "");
      return `data:image/png;base64,${b64}`;
    }

    return "";
  }, [pix]);

  const canGerar = cpfOk && !!items?.length && totalCents > 0 && !busy;

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-sm text-gray-600">Total</div>
      <div className="text-2xl font-extrabold">{brlFromCents(totalCents)}</div>

      {err ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <button
        type="button"
        onClick={gerarPix}
        disabled={!canGerar}
        className={`mt-4 w-full rounded-xl py-3 font-extrabold ${
          canGerar ? "bg-black text-white hover:bg-gray-900" : "bg-gray-200 text-gray-500"
        }`}
      >
        {busy ? "Gerando..." : "Gerar PIX"}
      </button>

      <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
        <div>
          Status: <b className="text-gray-800">{status || "—"}</b>
        </div>
        <button
          type="button"
          onClick={checkStatus}
          className="rounded-lg border px-2 py-1 hover:bg-gray-50"
        >
          Atualizar
        </button>
      </div>

      {pix ? (
        <div className="mt-4">
          <div className="text-sm font-extrabold mb-2">QR Code PIX</div>

          {qrImgSrc ? (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImgSrc}
                alt="QR Code PIX"
                className="h-[260px] w-[260px] rounded-xl border bg-white object-contain"
              />
            </div>
          ) : (
            <div className="rounded-xl border bg-gray-50 p-3 text-xs text-gray-700">
              Não consegui renderizar a imagem do QR aqui, mas o “copia e cola” abaixo funciona.
              {pix.qr_base64_url ? (
                <div className="mt-2">
                  <a className="underline" href={pix.qr_base64_url} target="_blank" rel="noreferrer">
                    Abrir QR (base64_url)
                  </a>
                </div>
              ) : null}
            </div>
          )}

          {pix.qr_text ? (
            <div className="mt-3">
              <textarea
                value={pix.qr_text}
                readOnly
                className="w-full rounded-xl border bg-white p-3 text-xs"
                rows={3}
              />
              <button
                type="button"
                onClick={copiarPix}
                className="mt-2 w-full rounded-xl border py-3 font-extrabold hover:bg-gray-50"
              >
                Copiar PIX
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
