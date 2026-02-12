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

type Metodo = "pix" | "cartao";

type CardForm = {
  holder_name: string;
  number: string;
  exp_month: string;
  exp_year: string;
  security_code: string;
  installments: number;
};

type Props = {
  orderId: string;
  cliente: Cliente;
  items: Item[];
  onPaid: () => void;
  metodo?: Metodo; // ✅ novo
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

function luhnOk(cardNumber: string) {
  const s = onlyDigits(cardNumber);
  if (s.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = parseInt(s[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/**
 * ✅ PagbankPayment
 * - modo PIX: gera QR via /api/pagbank/create-order (seu endpoint atual)
 * - modo Cartão: envia para /api/pagbank/create-card (novo endpoint)
 */
export default function PagbankPayment({ orderId, cliente, items, onPaid, metodo = "pix" }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [statusLabel, setStatusLabel] = useState<string>("NOVO");

  // PIX
  const [pixText, setPixText] = useState<string>("");
  const [qrBase64, setQrBase64] = useState<string>("");

  // CARTÃO
  const [card, setCard] = useState<CardForm>({
    holder_name: "",
    number: "",
    exp_month: "",
    exp_year: "",
    security_code: "",
    installments: 1,
  });

  const paidOnce = useRef(false);

  const totalCentavos = useMemo(() => sumTotal(items), [items]);
  const cpf = useMemo(() => onlyDigits(cliente.tax_id).slice(0, 11), [cliente.tax_id]);

  const hasAnyQr = !!qrBase64 || !!pixText;

  const createOrderAndPix = useCallback(async () => {
    if (!orderId) {
      setErr("order_id não informado.");
      return;
    }

    if (!cpf || cpf.length !== 11) {
      setErr("CPF inválido (precisa ter 11 dígitos) para gerar PIX.");
      return;
    }

    setBusy(true);
    setErr(null);
    setStatusLabel("GERANDO_PIX...");

    const payload = {
      order_id: orderId,
      forma_pagamento: "PIX",
      cliente: { ...cliente, tax_id: cpf },
      items,
      itens: items,
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

      setStatusLabel("PIX_GERADO");
    } catch {
      setErr(`create-order: falha de rede`);
      setStatusLabel("ERRO");
    } finally {
      setBusy(false);
    }
  }, [cliente, cpf, items, orderId, totalCentavos]);

  const createCardPayment = useCallback(async () => {
    if (!orderId) {
      setErr("order_id não informado.");
      return;
    }

    // cartão também precisa CPF do comprador (tax_id)
    if (!cpf || cpf.length !== 11) {
      setErr("CPF inválido (precisa ter 11 dígitos) para pagamento no cartão.");
      return;
    }

    // validação básica (sem expor detalhes)
    const num = onlyDigits(card.number);
    if (!luhnOk(num)) {
      setErr("Número do cartão inválido.");
      return;
    }
    const mm = onlyDigits(card.exp_month);
    const yy = onlyDigits(card.exp_year);
    const cvv = onlyDigits(card.security_code);

    if (mm.length !== 2 || Number(mm) < 1 || Number(mm) > 12) {
      setErr("Validade (mês) inválida.");
      return;
    }
    if (yy.length !== 2 && yy.length !== 4) {
      setErr("Validade (ano) inválida.");
      return;
    }
    if (cvv.length < 3) {
      setErr("CVV inválido.");
      return;
    }
    if (!card.holder_name.trim()) {
      setErr("Nome do titular é obrigatório.");
      return;
    }

    setBusy(true);
    setErr(null);
    setStatusLabel("PROCESSANDO_CARTAO...");

    const payload = {
      order_id: orderId,
      forma_pagamento: "CREDIT_CARD",
      cliente: { ...cliente, tax_id: cpf },
      items,
      total_centavos: totalCentavos,
      // ⚠️ Em produção, substituir por token/encrypted via SDK PagBank
      card: {
        holder_name: card.holder_name.trim(),
        number: num,
        exp_month: mm,
        exp_year: yy.length === 2 ? yy : yy.slice(-2),
        security_code: cvv,
        installments: Number(card.installments) || 1,
      },
    };

    try {
      const r = await fetch(`/api/pagbank/create-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const parsed = await safeJson(r);

      if (!r.ok || !parsed.ok || !parsed.json?.ok) {
        const msg = parsed.ok
  ? JSON.stringify(parsed.json?.detalhe || parsed.json, null, 2)
  : `HTTP ${r.status}`;

setErr(`create-card: ${parsed.ok ? (parsed.json?.error || "erro") : "erro"}\n${msg}`);

        setStatusLabel("ERRO");
        setBusy(false);
        return;
      }

      // aprovado -> chama onPaid (se seu backend marcar pago)
      setStatusLabel("APROVADO");
      if (!paidOnce.current) {
        paidOnce.current = true;
        onPaid();
      }
    } catch {
      setErr("create-card: falha de rede");
      setStatusLabel("ERRO");
    } finally {
      setBusy(false);
    }
  }, [card, cliente, cpf, items, onPaid, orderId, totalCentavos]);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm opacity-70">
          {metodo === "pix" ? "Pagamento PIX" : "Pagamento com Cartão"}
        </div>
        <div className="text-sm">
          Status: <b>{statusLabel || "—"}</b>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border p-4">
        <div className="text-sm opacity-70">Total</div>
        <div className="text-2xl font-extrabold">{brlFromCents(totalCentavos)}</div>

        {err ? (
  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-wrap">
    {err}
  </div>
) : null}


        {metodo === "pix" ? (
          <>
            <button
              type="button"
              onClick={createOrderAndPix}
              disabled={busy}
              className="mt-4 w-full rounded-xl bg-black px-4 py-3 font-extrabold text-white hover:bg-gray-900 disabled:opacity-60"
            >
              {busy ? "Gerando…" : "Gerar PIX"}
            </button>

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
          </>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div>
                <div className="mb-1 text-xs font-bold opacity-70">Nome do titular</div>
                <input
                  value={card.holder_name}
                  onChange={(e) => setCard((s) => ({ ...s, holder_name: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
                  placeholder="Como está no cartão"
                />
              </div>

              <div>
                <div className="mb-1 text-xs font-bold opacity-70">Número do cartão</div>
                <input
                  value={card.number}
                  onChange={(e) => setCard((s) => ({ ...s, number: e.target.value }))}
                  inputMode="numeric"
                  className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
                  placeholder="•••• •••• •••• ••••"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="mb-1 text-xs font-bold opacity-70">Mês</div>
                  <input
                    value={card.exp_month}
                    onChange={(e) =>
                      setCard((s) => ({ ...s, exp_month: onlyDigits(e.target.value).slice(0, 2) }))
                    }
                    inputMode="numeric"
                    className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
                    placeholder="MM"
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs font-bold opacity-70">Ano</div>
                  <input
                    value={card.exp_year}
                    onChange={(e) =>
                      setCard((s) => ({ ...s, exp_year: onlyDigits(e.target.value).slice(0, 4) }))
                    }
                    inputMode="numeric"
                    className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
                    placeholder="AA ou AAAA"
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs font-bold opacity-70">CVV</div>
                  <input
                    value={card.security_code}
                    onChange={(e) =>
                      setCard((s) => ({ ...s, security_code: onlyDigits(e.target.value).slice(0, 4) }))
                    }
                    inputMode="numeric"
                    className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
                    placeholder="CVV"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="mb-1 text-xs font-bold opacity-70">Parcelas</div>
                  <select
                    value={card.installments}
                    onChange={(e) => setCard((s) => ({ ...s, installments: Number(e.target.value) }))}
                    className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <option key={n} value={n}>
                        {n}x
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={createCardPayment}
                    disabled={busy}
                    className="w-full rounded-xl bg-black px-4 py-3 font-extrabold text-white hover:bg-gray-900 disabled:opacity-60"
                  >
                    {busy ? "Processando…" : "Pagar no cartão"}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                ⚠️ Cartão em produção deve usar token/encrypted do PagBank (não enviar número/CVV pro backend).
                Esse fluxo está pronto pra você plugar o “encrypted” quando a gente integrar o SDK.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
