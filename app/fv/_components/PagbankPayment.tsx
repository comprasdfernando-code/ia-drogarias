"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Cliente = {
  name: string;
  email: string;
  tax_id: string; // CPF (11 dígitos)
  phone?: string; // só números
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

  // vários formatos possíveis
  qr_text?: string; // copia e cola
  qr_png_url?: string; // url png
  qr_base64?: string; // base64 puro (sem prefixo)
  qr_base64_url?: string; // url da pagseguro que retorna base64
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
  const st = String(pickFirst(r?.status, resp?.status, "") || "").toUpperCase();
  return st;
}

function isPaidStatus(st: string) {
  const s = (st || "").toUpperCase();
  return s === "PAID" || s === "CONFIRMED" || s === "AUTHORIZED";
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

  // --- polling status (sempre que tiver pix/pagbank_id, ou mesmo sem)
  async function checkStatus() {
    try {
      const url = `/api/pagbank/status?order_id=${encodeURIComponent(orderId)}`;
      const r = await fetch(url, { cache: "no-store" });
      const parsed = await safeJson(r);
      const st = parsed.ok ? normalizeStatus(parsed.json) : "";
      if (st) setStatus(st);

      if (st && isPaidStatus(st) && !paidOnceRef.current) {
        paidOnceRef.current = true;
        try {
          await onPaid();
        } catch {
          // não trava
        }
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
    // já começa a verificar (caso o cliente pague e volte)
    startPolling();
    checkStatus();

    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // --- gerar pix
  async function gerarPix() {
    if (!orderId) {
      setErr("order_id não informado.");
      return;
    }
    if (!cpfOk) {
      setErr("CPF é obrigatório para pagamento via PIX (11 dígitos).");
      return;
    }
    if (!items?.length) {
      setErr("Sem itens válidos para pagamento.");
      return;
    }
    if (totalCents <= 0) {
      setErr("Total inválido (R$ 0,00).");
      return;
    }

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

    // tenta rotas em sequência (pra não te travar se o nome mudar)
    const routes = ["/api/pagbank/create-pix", "/api/pagbank/pix", "/api/pagbank/create"];

    let lastError: string | null = null;

    try {
      for (const route of routes) {
        try {
          const r = await fetch(route, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const parsed = await safeJson(r);

          if (!r.ok) {
            lastError = parsed.ok
              ? String(parsed.json?.error || parsed.json?.message || `HTTP ${r.status}`)
              : `HTTP ${r.status}`;
            continue;
          }

          const norm = normalizePix(parsed.json);
          setPix(norm);

          // status pode vir já como pending
          if (norm?.status) setStatus(String(norm.status).toUpperCase());

          // começa/continua polling
          startPolling();
          await checkStatus();

          return;
        } catch (e: any) {
          lastError = String(e?.message || e);
        }
      }

      setErr(lastError || "Falha ao gerar PIX.");
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
      // fallback
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

    // 1) url png direto
    if (pix.qr_png_url && pix.qr_png_url.startsWith("http")) return pix.qr_png_url;

    // 2) base64 puro
    if (pix.qr_base64 && pix.qr_base64.length > 30) {
      const b64 = pix.qr_base64.replace(/^data:image\/png;base64,/, "");
      return `data:image/png;base64,${b64}`;
    }

    // 3) url que retorna base64 - não dá pra "virar imagem" sem buscar
    // (mas dá pra tentar abrir em nova aba)
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

      {/* STATUS */}
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

      {/* QR */}
      {pix ? (
        <div className="mt-4">
          <div className="text-sm font-extrabold mb-2">QR Code PIX</div>

          {qrImgSrc ? (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImgSrc}
                alt="QR Code PIX"
                className="h-[240px] w-[240px] rounded-xl border bg-white object-contain"
                onError={() => {
                  // se falhar imagem, ainda tem copia e cola
                }}
              />
            </div>
          ) : (
            <div className="rounded-xl border bg-gray-50 p-3 text-xs text-gray-700">
              Não consegui renderizar a imagem do QR aqui, mas o “copia e cola” abaixo funciona.
              {pix.qr_base64_url ? (
                <div className="mt-2">
                  <a
                    className="underline"
                    href={pix.qr_base64_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir QR (base64_url)
                  </a>
                </div>
              ) : null}
            </div>
          )}

          {/* copia e cola */}
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
