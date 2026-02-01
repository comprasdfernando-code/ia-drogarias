"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Cliente = {
  name: string;
  email: string;
  tax_id: string; // CPF só números
  phone?: string; // só números
};

type Item = {
  reference_id: string;
  name: string;
  quantity: number;
  unit_amount: number; // CENTAVOS
};

type Props = {
  orderId: string;
  cliente: Cliente;
  items: Item[];
  onPaid: () => void;
};

type ApiResp = {
  ok?: boolean;
  error?: string;

  status?: string; // PENDING/PAID etc

  // vários formatos possíveis
  qr_text?: string;
  qr_png_url?: string;
  qr_base64?: string; // base64 puro
  qr_base64_url?: string; // url que retorna base64
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

async function safeJson(resp: Response) {
  const txt = await resp.text();
  try {
    return { parsed: true, json: JSON.parse(txt), raw: txt };
  } catch {
    return { parsed: false, json: null, raw: txt };
  }
}

function normalizeApi(x: any): ApiResp {
  if (!x) return {};
  // aceita {ok:true, ...} ou {data:{...}} etc
  const p = x?.data ?? x?.payload ?? x;
  return {
    ok: Boolean(p?.ok ?? x?.ok),
    error: p?.error ?? x?.error,
    status: p?.status ?? p?.state ?? p?.situacao,
    qr_text: p?.qr_text ?? p?.qrText ?? p?.pix_copia_cola,
    qr_png_url: p?.qr_png_url ?? p?.qrPngUrl ?? p?.qr_png ?? p?.qrPng,
    qr_base64: p?.qr_base64 ?? p?.qrBase64,
    qr_base64_url: p?.qr_base64_url ?? p?.qrBase64Url,
  };
}

function isPaid(status?: string) {
  const s = String(status || "").toUpperCase();
  return (
    s === "PAID" ||
    s === "PAID_OUT" ||
    s === "AUTHORIZED" ||
    s === "APPROVED" ||
    s === "COMPLETED" ||
    s === "CONFIRMED"
  );
}

export default function PagbankPayment({ orderId, cliente, items, onPaid }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [status, setStatus] = useState<string>("NOVO");
  const [qrText, setQrText] = useState<string>("");
  const [qrPngUrl, setQrPngUrl] = useState<string>("");
  const [qrBase64, setQrBase64] = useState<string>("");

  const paidOnce = useRef(false);
  const pollRef = useRef<number | null>(null);

  const cpf = useMemo(() => onlyDigits(cliente?.tax_id || ""), [cliente?.tax_id]);

  const canGenerate = useMemo(() => {
    if (!orderId) return false;
    if (!cpf || cpf.length !== 11) return false;
    if (!Array.isArray(items) || items.length === 0) return false;
    const invalid = items.some((i) => !i?.name || !i?.reference_id || !i?.quantity || !i?.unit_amount);
    return !invalid;
  }, [orderId, cpf, items]);

  function stopPolling() {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function callStatusPOST(body: any) {
    const r = await fetch("/api/pagbank/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const parsed = await safeJson(r);
    return { r, parsed };
  }

  async function callStatusGET(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    const url = `/api/pagbank/status?${qs}`;
    const r = await fetch(url, { cache: "no-store" });
    const parsed = await safeJson(r);
    return { r, parsed };
  }

  async function refreshStatus() {
    setErr(null);

    // 1) tenta POST
    try {
      const { r, parsed } = await callStatusPOST({ order_id: orderId, action: "status" });
      if (r.ok && parsed.parsed) {
        const n = normalizeApi(parsed.json);
        if (n.status) setStatus(n.status);

        if (isPaid(n.status) && !paidOnce.current) {
          paidOnce.current = true;
          stopPolling();
          onPaid();
        }
        return;
      }

      // 405/404 ou HTML -> tenta GET
      if (!r.ok) {
        const { r: rg, parsed: pg } = await callStatusGET({ order_id: orderId });
        if (rg.ok && pg.parsed) {
          const n = normalizeApi(pg.json);
          if (n.status) setStatus(n.status);

          if (isPaid(n.status) && !paidOnce.current) {
            paidOnce.current = true;
            stopPolling();
            onPaid();
          }
          return;
        }
      }
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  async function generatePix() {
    if (!canGenerate || loading) return;

    setLoading(true);
    setErr(null);

    try {
      // payload padrão: seu backend pode ignorar o que não usa
      const payload = {
        order_id: orderId,
        action: "create_pix",
        cliente: {
          name: String(cliente?.name || "Cliente"),
          email: String(cliente?.email || "cliente@iadrogarias.com"),
          tax_id: cpf,
          phone: onlyDigits(String(cliente?.phone || "")),
        },
        items: items.map((i) => ({
          reference_id: String(i.reference_id),
          name: String(i.name),
          quantity: Number(i.quantity),
          unit_amount: Number(i.unit_amount), // centavos
        })),
      };

      // 1) tenta POST
      let r = await fetch("/api/pagbank/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      let parsed = await safeJson(r);

      // 2) fallback pra GET se POST não rolar
      if (!r.ok || !parsed.parsed) {
        // tenta GET com order_id (se seu backend criar ao "consultar")
        const gg = await callStatusGET({ order_id: orderId, create_pix: "1" });
        r = gg.r;
        parsed = gg.parsed;
      }

      if (!r.ok) {
        throw new Error(`HTTP ${r.status}`);
      }

      if (!parsed.parsed) {
        const snip = String(parsed.raw || "").slice(0, 120);
        throw new Error(`Resposta não-JSON: ${snip}`);
      }

      const n = normalizeApi(parsed.json);

      if (n.error) throw new Error(n.error);

      if (n.status) setStatus(n.status);

      // QR: prioriza base64, depois url png
      const b64 = String(n.qr_base64 || "");
      const png = String(n.qr_png_url || "");
      const txt = String(n.qr_text || "");

      setQrBase64(b64);
      setQrPngUrl(png);
      setQrText(txt);

      // inicia polling assim que tiver QR
      stopPolling();
      pollRef.current = window.setInterval(refreshStatus, 3500);

      // checa na hora também
      refreshStatus();
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function copyPix() {
    try {
      if (!qrText) return;
      await navigator.clipboard.writeText(qrText);
      alert("PIX copiado ✅");
    } catch {
      alert("Não consegui copiar automaticamente. Selecione e copie manualmente.");
    }
  }

  useEffect(() => {
    // ao montar: tenta buscar status (caso já exista QR)
    refreshStatus();

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const qrImgSrc = useMemo(() => {
    if (qrBase64) return `data:image/png;base64,${qrBase64}`;
    if (qrPngUrl) return qrPngUrl;
    return "";
  }, [qrBase64, qrPngUrl]);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-gray-700">Total</div>
        <button
          type="button"
          onClick={refreshStatus}
          className="rounded-lg border px-3 py-1.5 text-xs font-extrabold hover:bg-gray-50"
        >
          Atualizar
        </button>
      </div>

      <div className="mt-1 text-2xl font-extrabold text-blue-950">
        {/* o total você já mostra no CheckoutClient; aqui é só o bloco do pix */}
      </div>

      {err ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <button
        type="button"
        onClick={generatePix}
        disabled={!canGenerate || loading}
        className={`mt-4 w-full rounded-xl py-3 font-extrabold text-white ${
          !canGenerate || loading ? "bg-gray-300" : "bg-black hover:bg-gray-900"
        }`}
      >
        {loading ? "Gerando..." : "Gerar PIX"}
      </button>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
        <div>
          Status: <b>{status || "—"}</b>
        </div>
        <div className="opacity-70">{qrImgSrc ? "PIX gerado" : "—"}</div>
      </div>

      {qrImgSrc ? (
        <div className="mt-4">
          <div className="text-sm font-extrabold mb-2">QR Code PIX</div>

          {/* usa <img> pra não depender do next/image/domains */}
          <div className="rounded-2xl border bg-white p-3 flex items-center justify-center">
            <img
              src={qrImgSrc}
              alt="QR Code PIX"
              className="max-w-full h-auto"
              style={{ imageRendering: "auto" }}
              onError={() => {
                // se falhar png_url, tenta só manter o copia/cola
                setQrPngUrl("");
              }}
            />
          </div>

          {qrText ? (
            <>
              <textarea
                className="mt-3 w-full rounded-xl border bg-gray-50 p-3 text-xs"
                rows={4}
                value={qrText}
                readOnly
              />
              <button
                type="button"
                onClick={copyPix}
                className="mt-3 w-full rounded-xl border bg-white py-3 font-extrabold hover:bg-gray-50"
              >
                Copiar PIX
              </button>
            </>
          ) : null}

          <div className="mt-3 text-[11px] text-gray-500">
            Após pagar, a página verifica automaticamente e finaliza quando confirmar.
          </div>
        </div>
      ) : null}
    </div>
  );
}
