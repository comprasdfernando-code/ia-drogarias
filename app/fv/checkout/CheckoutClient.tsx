"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PagbankPayment from "../_components/PagbankPayment";

type AnyObj = Record<string, any>;

type VendaLike = {
  id?: string;
  status?: string | null;

  // cliente
  cliente_nome?: string | null;
  cliente_email?: string | null;
  cliente_tax_id?: string | null;
  cliente_phone?: string | null;

  // itens / total
  itens?: any[] | null;
  items?: any[] | null;

  total_centavos?: number | null;
  total?: number | null; // pode vir em reais
  subtotal?: number | null;

  // entrega (fallback/session)
  entrega?: {
    taxa?: number | null; // reais
    tipo_entrega?: string | null;
  } | null;

  // ids extras (se vier)
  pedido_id?: string | null;
  grupo_id?: string | null;

  // pagbank
  pagbank_id?: string | null;
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function centsFromMaybe(v: any): number {
  // converte para CENTAVOS
  if (v == null) return 0;

  if (typeof v === "number") {
    // Se for inteiro grande, pode já ser centavos
    // Se for decimal (ex: 13.99), é reais
    if (Number.isInteger(v) && v >= 1000) return Math.round(v);
    return Math.round(v * 100);
  }

  const str = String(v).trim();
  if (!str) return 0;

  // "13,99" -> 13.99
  const norm = str.replace(/\./g, "").replace(",", ".");
  const n = Number(norm);
  if (!Number.isFinite(n)) return 0;

  // se veio "1399" como string e sem vírgula, pode ser centavos
  if (/^\d+$/.test(str) && n >= 1000) return Math.round(n);

  return Math.round(n * 100);
}

async function safeJson(resp: Response) {
  const txt = await resp.text();
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

function extractVenda(payload: any): VendaLike | null {
  if (!payload) return null;

  const v =
    payload?.venda ??
    payload?.pedido ??
    payload?.data?.venda ??
    payload?.data?.pedido ??
    payload;

  if (!v || typeof v !== "object") return null;

  const venda: VendaLike = {
    id: pickFirst(v?.id, v?.pedido_id, v?.venda_id, v?.order_id) as any,
    status: pickFirst(v?.status, v?.situacao, v?.state) as any,

    cliente_nome: pickFirst(v?.cliente_nome, v?.nome, v?.customer_name) as any,
    cliente_email: pickFirst(v?.cliente_email, v?.email, v?.customer_email) as any,
    cliente_tax_id: pickFirst(v?.cliente_tax_id, v?.cpf, v?.tax_id, v?.customer_tax_id) as any,
    cliente_phone: pickFirst(v?.cliente_phone, v?.telefone, v?.phone, v?.customer_phone) as any,

    itens: (Array.isArray(v?.itens) ? v?.itens : null) as any,
    items: (Array.isArray(v?.items) ? v?.items : null) as any,

    total_centavos: (v?.total_centavos ?? v?.totalCentavos ?? null) as any,
    total: (v?.total ?? v?.valor_total ?? v?.amount ?? null) as any,
    subtotal: (v?.subtotal ?? null) as any,

    entrega: (v?.entrega ?? v?.delivery ?? null) as any,

    pedido_id: (v?.pedido_id ?? null) as any,
    grupo_id: (v?.grupo_id ?? null) as any,

    pagbank_id: (v?.pagbank_id ?? v?.charge_id ?? null) as any,
  };

  return venda;
}

function extractItems(v: VendaLike | null) {
  const arr =
    (Array.isArray(v?.itens) && v?.itens) ||
    (Array.isArray(v?.items) && v?.items) ||
    [];

  return arr.map((i: any, idx: number) => {
    const qty = Number(pickFirst(i?.quantity, i?.qty, i?.qtd, 1)) || 1;

    // unit_amount deve ser CENTAVOS
    const unitCents = centsFromMaybe(
      pickFirst(
        i?.unit_amount,       // centavos (PagBank)
        i?.preco_centavos,    // centavos
        i?.unitAmount,        // centavos
        i?.price_cents,       // centavos
        i?.preco,             // reais
        i?.price,             // reais
        i?.valor_unitario,    // reais
        i?.valor              // reais
      )
    );

    const ref = String(pickFirst(i?.reference_id, i?.ean, i?.id, i?.sku, `item-${idx + 1}`));
    const name = String(pickFirst(i?.name, i?.nome, i?.titulo, "Item"));

    return {
      reference_id: ref,
      name,
      quantity: qty,
      unit_amount: unitCents,
    };
  });
}

function sumTotal(items: { unit_amount: number; quantity: number }[]) {
  return items.reduce(
    (acc, it) => acc + (Number(it.unit_amount) || 0) * (Number(it.quantity) || 0),
    0
  );
}

function readSessionCheckout(orderId?: string) {
  try {
    // prioridade: chave do order_id
    if (orderId) {
      const byOrder = sessionStorage.getItem(`fv_checkout_${orderId}`);
      if (byOrder) return JSON.parse(byOrder);
    }

    // chave genérica antiga
    const direct = sessionStorage.getItem("fv_checkout");
    if (direct) return JSON.parse(direct);

    // varre qualquer fv_checkout*
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i) || "";
      if (k.startsWith("fv_checkout")) {
        const v = sessionStorage.getItem(k);
        if (v) return JSON.parse(v);
      }
    }
  } catch {}
  return null;
}

// ✅ ajuste para o storageKey real do teu CartProvider FV
const CART_STORAGE_KEYS = [
  "cart_fv",
  "cart_farmacia_virtual",
  "cart_fv_virtual",
  "cart_iadrogarias_fv",
];

function clearPossibleCarts() {
  try {
    for (const k of CART_STORAGE_KEYS) localStorage.removeItem(k);
  } catch {}
}

export default function CheckoutClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const orderId = sp.get("order_id") || "";
  const pedidoIdQS = sp.get("pedido_id") || "";
  const vendaId = sp.get("venda_id") || "";
  const grupoIdQS = sp.get("grupo_id") || "";

  const cpfQS = onlyDigits(sp.get("cpf") || "");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [debugFonte, setDebugFonte] = useState<string | null>(null);

  const [venda, setVenda] = useState<VendaLike | null>(null);
  const [cpf, setCpf] = useState<string>(cpfQS);

  // ✅ controle de status (pra sair sozinho da tela quando pagar)
  const [status, setStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // carregar venda/status (API -> fallback)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        if (!orderId && !pedidoIdQS && !vendaId && !grupoIdQS) {
          setDebugFonte("sem_params");
          setVenda(null);
          setErr("order_id não informado.");
          return;
        }

        // 1) POST /api/pagbank/status
        if (orderId) {
          try {
            const r1 = await fetch("/api/pagbank/status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order_id: orderId,
                pedido_id: pedidoIdQS || null,
                venda_id: vendaId || null,
                grupo_id: grupoIdQS || null,
              }),
              cache: "no-store",
            });

            const parsed = await safeJson(r1);
            if (r1.ok && parsed.ok && parsed.json?.ok) {
              const v = extractVenda(parsed.json);
              if (!cancelled) {
                setVenda(v);
                setDebugFonte("api:/api/pagbank/status (POST)");
                setStatus(String(parsed.json?.status || v?.status || "").toUpperCase() || null);
              }

              const apiCpf = onlyDigits(v?.cliente_tax_id || "");
              if (!cancelled && apiCpf.length === 11 && !cpfQS) setCpf(apiCpf);
              return;
            }
          } catch {
            // segue
          }

          // 2) GET /api/pagbank/status?...
          try {
            const url =
              `/api/pagbank/status?order_id=${encodeURIComponent(orderId)}` +
              (pedidoIdQS ? `&pedido_id=${encodeURIComponent(pedidoIdQS)}` : "") +
              (vendaId ? `&venda_id=${encodeURIComponent(vendaId)}` : "") +
              (grupoIdQS ? `&grupo_id=${encodeURIComponent(grupoIdQS)}` : "");

            const r2 = await fetch(url, { cache: "no-store" });
            const parsed2 = await safeJson(r2);

            if (r2.ok && parsed2.ok && parsed2.json?.ok) {
              const v = extractVenda(parsed2.json);
              if (!cancelled) {
                setVenda(v);
                setDebugFonte(`api:${url} (GET)`);
                setStatus(String(parsed2.json?.status || v?.status || "").toUpperCase() || null);
              }
              const apiCpf = onlyDigits(v?.cliente_tax_id || "");
              if (!cancelled && apiCpf.length === 11 && !cpfQS) setCpf(apiCpf);
              return;
            }

            // HTML/erro -> mostra erro
            if (!r2.ok && !parsed2.ok) {
              const snippet = String(parsed2.raw || "").slice(0, 140);
              throw new Error(
                `Falha ao buscar venda (HTTP ${r2.status}). Verifique /api/pagbank/status. Resposta: ${snippet}`
              );
            }

            if (parsed2.ok && parsed2.json && !parsed2.json?.ok) {
              throw new Error(parsed2.json?.error || "Falha ao buscar venda");
            }
          } catch (e: any) {
            if (!cancelled) setErr(String(e?.message || e));
          }
        }

        // 3) sessionStorage fallback
        const ss = readSessionCheckout(orderId);
        if (ss) {
          const v = extractVenda(ss) || (ss as VendaLike);
          if (!cancelled) {
            setVenda(v);
            setDebugFonte("sessionStorage:fallback");
            setStatus(String(ss?.status || v?.status || "").toUpperCase() || "PENDING");
          }

          const ssCpf = onlyDigits(
            pickFirst(
              ss?.cliente_tax_id,
              ss?.cpf,
              ss?.cliente?.tax_id,
              ss?.cliente?.cpf,
              ss?.tax_id,
              ss?.customer?.tax_id,
              ss?.customer?.cpf
            ) || ""
          );
          if (!cancelled && ssCpf.length === 11 && !cpfQS) setCpf(ssCpf);
          return;
        }

        // nada funcionou
        if (!cancelled) {
          setVenda(null);
          setDebugFonte("sem_dados");
          setErr((prev) => prev || "Não consegui recuperar a venda (API falhou e não há fallback em sessionStorage).");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, pedidoIdQS, vendaId, grupoIdQS]);

  const itemsBase = useMemo(() => extractItems(venda), [venda]);

  // ✅ taxa (reais -> centavos) vinda do session fallback (payload.entrega.taxa)
  const taxaEntregaCents = useMemo(() => {
    const t = pickFirst((venda as any)?.entrega?.taxa, (venda as any)?.taxa_entrega, null);
    const cents = centsFromMaybe(t);
    return cents > 0 ? cents : 0;
  }, [venda]);

  // ✅ inclui frete automaticamente como item (pra bater o total do PagBank)
  const items = useMemo(() => {
    const arr = [...itemsBase];
    if (taxaEntregaCents > 0) {
      arr.push({
        reference_id: "FRETE",
        name: "Taxa de entrega",
        quantity: 1,
        unit_amount: taxaEntregaCents,
      });
    }
    return arr;
  }, [itemsBase, taxaEntregaCents]);

  const totalFromItems = useMemo(() => sumTotal(items), [items]);

  const totalCentavos = useMemo(() => {
    // prioridade: items -> total_centavos -> total/subtotal
    if (totalFromItems > 0) return totalFromItems;

    const b = centsFromMaybe(venda?.total_centavos);
    if (b > 0) return b;

    const c = centsFromMaybe(venda?.total);
    if (c > 0) return c;

    const d = centsFromMaybe(venda?.subtotal);
    if (d > 0) return d;

    return 0;
  }, [totalFromItems, venda]);

  const cliente = useMemo(() => {
    const baseCpf = onlyDigits(pickFirst(venda?.cliente_tax_id, cpfQS, cpf) || "");
    return {
      name: String(pickFirst(venda?.cliente_nome, "Cliente") || "Cliente"),
      email: String(pickFirst(venda?.cliente_email, "cliente@iadrogarias.com") || "cliente@iadrogarias.com"),
      tax_id: baseCpf,
      phone: onlyDigits(String(pickFirst(venda?.cliente_phone, "") || "")),
    };
  }, [venda, cpf, cpfQS]);

  const pedidoId = useMemo(
    () => String(pickFirst(venda?.pedido_id, pedidoIdQS, venda?.id, "") || ""),
    [venda, pedidoIdQS]
  );

  const grupoId = useMemo(
    () => String(pickFirst(venda?.grupo_id, grupoIdQS, "") || ""),
    [venda, grupoIdQS]
  );

  async function confirmPaidBackend() {
    // ✅ tenta avisar seu backend pra marcar pedido como pago
    // Se a rota não existir ainda, não quebra o checkout.
    try {
      await fetch("/api/fv/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          pedido_id: pedidoId || null,
          grupo_id: grupoId || null,
          status: "PAID",
        }),
      });
    } catch {}
  }

  async function onPaid() {
    // 1) marca no backend
    await confirmPaidBackend();

    // 2) limpa carrinho
    clearPossibleCarts();

    // 3) limpa session payload (pra não reabrir o mesmo)
    try {
      sessionStorage.removeItem(`fv_checkout_${orderId}`);
    } catch {}

    // 4) vai pra loja com flag de sucesso (se quiser mostrar toast)
    router.replace("/fv?paid=1");
  }

  // ✅ polling extra no CheckoutClient (caso o PagbankPayment não esteja fazendo polling)
  useEffect(() => {
    if (!orderId) return;

    let alive = true;
    let timer: any = null;

    async function tick() {
      if (!alive) return;
      try {
        setChecking(true);
        const r = await fetch(`/api/pagbank/status?order_id=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const j = await r.json().catch(() => null);

        const st = String(j?.status || j?.data?.status || j?.venda?.status || "").toUpperCase();
        if (st) setStatus(st);

        if (st === "PAID" || st === "CONFIRMED" || st === "AUTHORIZED") {
          alive = false;
          await onPaid();
          return;
        }
      } catch {
        // ignora
      } finally {
        if (alive) setChecking(false);
      }
      timer = setTimeout(tick, 3000);
    }

    // só começa a pollar se já gerou/tem status pendente
    timer = setTimeout(tick, 2500);

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) return <div className="p-6">Carregando…</div>;

  if (err && !venda) {
    return (
      <div className="p-6">
        <div className="text-red-600">{err}</div>
        {debugFonte && <div className="mt-2 text-xs opacity-60">Fonte: {debugFonte}</div>}
        <div className="mt-4">
          <button className="rounded-lg border px-3 py-2" onClick={() => router.push("/fv")}>
            Voltar para /fv
          </button>
        </div>
      </div>
    );
  }

  // não deixa pagar sem itens/total
  if (totalCentavos <= 0 || items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <h1 className="mb-2 text-xl font-semibold">Finalizar pagamento</h1>
        {debugFonte && <div className="mb-4 text-xs opacity-60">Fonte: {debugFonte}</div>}

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="font-semibold text-red-700">
            Seu pedido ficou com total zerado (R$ 0,00) ou sem itens válidos.
          </div>
          <div className="mt-2 text-sm text-red-700">
            Volte ao carrinho e finalize novamente. Se persistir, me mande print do <code>sessionStorage</code> de{" "}
            <code>fv_checkout*</code>.
          </div>
        </div>

        <div className="mt-4">
          <button className="rounded-lg border px-3 py-2" onClick={() => router.push("/fv")}>
            Voltar para /fv
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-2 text-xl font-semibold">Finalizar pagamento</h1>
      {debugFonte && <div className="mb-2 text-xs opacity-60">Fonte: {debugFonte}</div>}

      <div className="mb-4 flex items-center justify-between text-xs text-gray-600">
        <div>
          Status:{" "}
          <b className="text-gray-900">{status || "—"}</b>
        </div>
        <div>{checking ? "Verificando pagamento..." : " "}</div>
      </div>

      {/* CPF editável */}
      <div className="mb-4 rounded-2xl border p-4">
        <div className="mb-2 text-sm font-semibold">CPF (obrigatório para PIX)</div>
        <input
          value={cpf}
          onChange={(e) => setCpf(onlyDigits(e.target.value).slice(0, 11))}
          placeholder="Digite seu CPF (11 dígitos)"
          inputMode="numeric"
          className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
        />
        <div className="mt-2 text-xs opacity-60">Dica: só números. Ex: 12345678901</div>
      </div>

      <PagbankPayment orderId={orderId} cliente={cliente} items={items} onPaid={onPaid} />
    </div>
  );
}
