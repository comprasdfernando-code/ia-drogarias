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

  // possíveis campos de taxa (varia no seu schema)
  taxa_entrega_centavos?: number | null;
  taxa_entrega?: number | null; // pode vir em reais OU centavos
  taxa?: number | null;         // pode vir em reais OU centavos
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

/**
 * Converte "qualquer coisa" em CENTAVOS com heurística segura:
 * - Se vier decimal (3.99 / "3,99") => reais => *100
 * - Se vier inteiro pequeno (<= 9999) assume CENTAVOS (ex: 399 = R$ 3,99; 1000 = R$ 10,00)
 * - Se vier inteiro grande e múltiplo de 100 (ex: 39900) pode ser "centavos com *100 extra" => divide por 100
 */
function toCentsSmart(v: any): number {
  if (v == null) return 0;

  // string: "3,99" / "3.99" / "399" / "39900"
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return 0;
    // mantém números e separadores
    const norm = s.replace(/\./g, "").replace(",", ".");
    const n = Number(norm);
    if (!Number.isFinite(n)) return 0;
    return toCentsSmart(n);
  }

  const n = Number(v);
  if (!Number.isFinite(n)) return 0;

  // decimal => reais
  if (!Number.isInteger(n)) return Math.round(n * 100);

  // inteiro:
  // regra segura: por padrão, inteiro é CENTAVOS
  // (porque você está passando unit_amount pro PagBank que espera centavos)
  // EXCEÇÃO: quando vem inflado por 100 (ex 39900) -> corrige
  if (n >= 10000 && n % 100 === 0) {
    const maybe = n / 100;
    // só aceita se ficar em faixa plausível
    if (maybe > 0 && maybe <= 5_000_000) return maybe; // até R$ 50.000,00
  }

  return n;
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

    // taxa (vários nomes possíveis)
    taxa_entrega_centavos: (v?.taxa_entrega_centavos ?? v?.taxaEntregaCentavos ?? null) as any,
    taxa_entrega: (v?.taxa_entrega ?? v?.taxaEntrega ?? null) as any,
    taxa: (v?.taxa ?? v?.taxa_locomocao ?? null) as any,
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

    // tenta achar preço: já centavos (unit_amount/preco_centavos) ou reais (preco/price/valor)
    const unitCents = toCentsSmart(
      pickFirst(
        i?.unit_amount,       // centavos (PagBank)
        i?.preco_centavos,    // centavos
        i?.unitAmount,        // centavos
        i?.price_cents,       // centavos
        i?.preco,             // reais (às vezes)
        i?.price,             // reais (às vezes)
        i?.valor_unitario,    // reais
        i?.valor              // reais
      )
    );

    const ref = String(
      pickFirst(i?.reference_id, i?.ean, i?.id, i?.sku, `item-${idx + 1}`)
    );

    const name = String(pickFirst(i?.name, i?.nome, i?.titulo, "Item"));

    return {
      reference_id: ref,
      name,
      quantity: qty,
      unit_amount: unitCents, // ✅ sempre CENTAVOS
    };
  })
  // remove itens quebrados
  .filter((it: any) => (Number(it.unit_amount) || 0) > 0 && (Number(it.quantity) || 0) > 0);
}

function sumTotal(items: { unit_amount: number; quantity: number }[]) {
  return items.reduce(
    (acc, it) => acc + (Number(it.unit_amount) || 0) * (Number(it.quantity) || 0),
    0
  );
}

function readSessionCheckout(): AnyObj | null {
  try {
    const direct = sessionStorage.getItem("fv_checkout");
    if (direct) return JSON.parse(direct);

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

/** extrai taxa de entrega em CENTAVOS de vários campos possíveis */
function extractTaxaEntregaCents(v: VendaLike | null): number {
  const raw = pickFirst(
    v?.taxa_entrega_centavos,
    v?.taxa_entrega,
    v?.taxa
  );

  return toCentsSmart(raw);
}

/** adiciona taxa de entrega como item (pra somar no total do PagBank) */
function appendEntregaItem(items: any[], taxaEntregaCents: number) {
  if (!taxaEntregaCents || taxaEntregaCents <= 0) return items;

  // evita duplicar se já veio como item
  const already = items.some((it) =>
    String(it?.reference_id || "").toLowerCase() === "entrega" ||
    String(it?.name || "").toLowerCase().includes("entrega")
  );
  if (already) return items;

  return [
    ...items,
    {
      reference_id: "entrega",
      name: "Taxa de entrega",
      quantity: 1,
      unit_amount: taxaEntregaCents,
    },
  ];
}

export default function CheckoutClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const orderId = sp.get("order_id") || "";
  const pedidoId = sp.get("pedido_id") || "";
  const vendaId = sp.get("venda_id") || "";
  const grupoId = sp.get("grupo_id") || "";

  const cpfQS = onlyDigits(sp.get("cpf") || "");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [debugFonte, setDebugFonte] = useState<string | null>(null);

  const [venda, setVenda] = useState<VendaLike | null>(null);
  const [cpf, setCpf] = useState<string>(cpfQS);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        if (!orderId && !pedidoId && !vendaId && !grupoId) {
          setDebugFonte("sem_params");
          setVenda(null);
          setErr("order_id não informado.");
          return;
        }

        if (orderId) {
          // 1) POST
          try {
            const r1 = await fetch("/api/pagbank/status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order_id: orderId,
                pedido_id: pedidoId || null,
                venda_id: vendaId || null,
                grupo_id: grupoId || null,
              }),
              cache: "no-store",
            });

            const parsed = await safeJson(r1);

            if (r1.ok && parsed.ok && parsed.json?.ok) {
              const v = extractVenda(parsed.json);
              if (!cancelled) {
                setVenda(v);
                setDebugFonte("api:/api/pagbank/status (POST)");
              }
              const apiCpf = onlyDigits(v?.cliente_tax_id || "");
              if (!cancelled && apiCpf && apiCpf.length === 11 && !cpfQS) setCpf(apiCpf);
              return;
            }
          } catch {
            // segue pro GET
          }

          // 2) GET
          try {
            const url = `/api/pagbank/status?order_id=${encodeURIComponent(orderId)}${
              pedidoId ? `&pedido_id=${encodeURIComponent(pedidoId)}` : ""
            }${vendaId ? `&venda_id=${encodeURIComponent(vendaId)}` : ""}${
              grupoId ? `&grupo_id=${encodeURIComponent(grupoId)}` : ""
            }`;

            const r2 = await fetch(url, { cache: "no-store" });
            const parsed2 = await safeJson(r2);

            if (r2.ok && parsed2.ok && parsed2.json?.ok) {
              const v = extractVenda(parsed2.json);
              if (!cancelled) {
                setVenda(v);
                setDebugFonte(`api:${url} (GET)`);
              }
              const apiCpf = onlyDigits(v?.cliente_tax_id || "");
              if (!cancelled && apiCpf && apiCpf.length === 11 && !cpfQS) setCpf(apiCpf);
              return;
            }

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
        const ss = readSessionCheckout();
        if (ss) {
          const v = extractVenda(ss) || (ss as VendaLike);
          if (!cancelled) {
            setVenda(v);
            setDebugFonte("sessionStorage:fallback");
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
          if (!cancelled && ssCpf && ssCpf.length === 11 && !cpfQS) setCpf(ssCpf);
          return;
        }

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
  }, [orderId, pedidoId, vendaId, grupoId]);

  // ✅ itens + taxa entrega (para PagBank somar corretamente)
  const baseItems = useMemo(() => extractItems(venda), [venda]);
  const taxaEntregaCents = useMemo(() => extractTaxaEntregaCents(venda), [venda]);
  const items = useMemo(() => appendEntregaItem(baseItems, taxaEntregaCents), [baseItems, taxaEntregaCents]);

  const totalFromItems = useMemo(() => sumTotal(items), [items]);

  const totalCentavos = useMemo(() => {
    // prioridade: items -> total_centavos -> total/subtotal
    const a = totalFromItems;
    if (a > 0) return a;

    const b = toCentsSmart(venda?.total_centavos);
    if (b > 0) return b;

    const c = toCentsSmart(venda?.total);
    if (c > 0) return c;

    const d = toCentsSmart(venda?.subtotal);
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

  function onPaid() {
    alert("Pagamento aprovado 🎉");
    router.push("/fv");
  }

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
      {debugFonte && <div className="mb-4 text-xs opacity-60">Fonte: {debugFonte}</div>}

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
