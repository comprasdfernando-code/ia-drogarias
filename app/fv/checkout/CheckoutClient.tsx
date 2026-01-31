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
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function centsFromMaybe(v: any): number {
  // tenta converter vários formatos para CENTAVOS
  if (v == null) return 0;
  if (typeof v === "number") {
    // heurística: se já parece centavos (>= 1000 normalmente) mantém, senão assume reais
    if (v >= 1000) return Math.round(v);
    return Math.round(v * 100);
  }
  const str = String(v).trim();
  if (!str) return 0;

  // "13,99" -> 13.99 reais
  const norm = str.replace(/\./g, "").replace(",", ".");
  const n = Number(norm);
  if (!Number.isFinite(n)) return 0;
  if (n >= 1000) return Math.round(n);
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

  // formatos possíveis:
  // { ok:true, venda:{...} }
  // { ok:true, pedido:{...} }
  // { venda:{...} }
  // { pedido:{...} }
  const v =
    payload?.venda ??
    payload?.pedido ??
    payload?.data?.venda ??
    payload?.data?.pedido ??
    payload;

  if (!v || typeof v !== "object") return null;

  // normaliza alguns nomes comuns
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
  };

  return venda;
}

function extractItems(v: VendaLike | null) {
  const arr = (Array.isArray(v?.itens) && v?.itens) || (Array.isArray(v?.items) && v?.items) || [];
  return arr.map((i: any, idx: number) => {
    const qty = Number(pickFirst(i?.quantity, i?.qty, i?.qtd, 1)) || 1;

    // tenta achar preço em CENTAVOS
    const unitCents = centsFromMaybe(
      pickFirst(
        i?.unit_amount,       // já em centavos (PagBank)
        i?.preco_centavos,    // centavos
        i?.unitAmount,        // centavos
        i?.price_cents,       // centavos
        i?.preco,             // reais
        i?.price,             // reais
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
      unit_amount: unitCents,
    };
  });
}

function sumTotal(items: { unit_amount: number; quantity: number }[]) {
  return items.reduce((acc, it) => acc + (Number(it.unit_amount) || 0) * (Number(it.quantity) || 0), 0);
}

function readSessionCheckout(): AnyObj | null {
  // tenta achar qualquer chave que você possa ter usado
  try {
    // prioridade: chave explícita
    const direct = sessionStorage.getItem("fv_checkout");
    if (direct) return JSON.parse(direct);

    // fallback: varrer chaves que começam com fv_checkout
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

export default function CheckoutClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const orderId = sp.get("order_id") || "";
  const pedidoId = sp.get("pedido_id") || "";
  const vendaId = sp.get("venda_id") || "";
  const grupoId = sp.get("grupo_id") || "";

  // se vier cpf por query string (opcional)
  const cpfQS = onlyDigits(sp.get("cpf") || "");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [debugFonte, setDebugFonte] = useState<string | null>(null);

  const [venda, setVenda] = useState<VendaLike | null>(null);

  // CPF editável (resolve teu problema: PagbankPayment só enxerga cliente.tax_id)
  const [cpf, setCpf] = useState<string>(cpfQS);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // precisa ter ao menos order_id (PagBank) OU pedido/venda pra fallback
        if (!orderId && !pedidoId && !vendaId && !grupoId) {
          setDebugFonte("sem_params");
          setVenda(null);
          setErr("order_id não informado.");
          return;
        }

        // 1) tenta API principal (POST)
        if (orderId) {
          try {
            const r1 = await fetch("/api/pagbank/status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ order_id: orderId, pedido_id: pedidoId || null, venda_id: vendaId || null, grupo_id: grupoId || null }),
              cache: "no-store",
            });

            const parsed = await safeJson(r1);

            if (r1.ok && parsed.ok && parsed.json?.ok) {
              const v = extractVenda(parsed.json);
              if (!cancelled) {
                setVenda(v);
                setDebugFonte("api:/api/pagbank/status (POST)");
              }
              // se API já trouxe CPF, seta
              const apiCpf = onlyDigits(v?.cliente_tax_id || "");
              if (!cancelled && apiCpf && apiCpf.length === 11 && !cpfQS) setCpf(apiCpf);
              return;
            }

            // se veio HTML/erro/404, cai pro GET
          } catch {
            // segue para GET/fallback
          }

          // 2) tenta GET (algumas rotas ficam mais fáceis assim)
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

            // Se retornou HTML, mostra um erro “bonito”
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
            // continua para session fallback
            if (!cancelled) setErr(String(e?.message || e));
          }
        }

        // 3) fallback sessionStorage (se a API falhar)
        const ss = readSessionCheckout();
        if (ss) {
          const v = extractVenda(ss) || (ss as VendaLike);
          if (!cancelled) {
            setVenda(v);
            setDebugFonte("sessionStorage:fallback");
          }

          const ssCpf = onlyDigits(
            pickFirst(ss?.cliente_tax_id, ss?.cpf, ss?.cliente?.tax_id, ss?.cliente?.cpf, ss?.tax_id, ss?.customer?.tax_id, ss?.customer?.cpf) || ""
          );
          if (!cancelled && ssCpf && ssCpf.length === 11 && !cpfQS) setCpf(ssCpf);
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
  }, [orderId, pedidoId, vendaId, grupoId]);

  const items = useMemo(() => extractItems(venda), [venda]);
  const totalFromItems = useMemo(() => sumTotal(items), [items]);

  const totalCentavos = useMemo(() => {
    // prioridade: items -> total_centavos -> total/subtotal
    const a = totalFromItems;
    if (a > 0) return a;

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
      tax_id: baseCpf, // ✅ aqui está o pulo do gato (CPF editável)
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

  // Se total ficou 0, não deixa pagar (evita erro do PagBank)
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

      {/* ✅ CPF aqui resolve o “coloquei no carrinho mas ele diz que não tem CPF” */}
      <div className="mb-4 rounded-2xl border p-4">
        <div className="mb-2 text-sm font-semibold">CPF (obrigatório para PIX)</div>
        <input
          value={cpf}
          onChange={(e) => setCpf(onlyDigits(e.target.value).slice(0, 11))}
          placeholder="Digite seu CPF (11 dígitos)"
          inputMode="numeric"
          className="w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-200"
        />
        <div className="mt-2 text-xs opacity-60">
          Dica: só números. Ex: 12345678901
        </div>
      </div>

      <PagbankPayment
        orderId={orderId}
        cliente={cliente}
        items={items}
        onPaid={onPaid}
      />
    </div>
  );
}
