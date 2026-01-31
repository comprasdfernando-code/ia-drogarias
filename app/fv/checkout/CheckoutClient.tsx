"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PagbankPayment from "../_components/PagbankPayment";

/* =========================
   TIPOS
========================= */
type VendaSite = {
  id?: string;
  status?: string | null;

  cliente_nome?: string | null;
  cliente_email?: string | null;
  cliente_tax_id?: string | null;
  cliente_phone?: string | null;

  itens?: any[] | null;

  total_centavos?: number | null;
  total?: number | null;
  total_reais?: number | null;
};

type CheckoutItem = {
  reference_id?: string;
  name: string;
  quantity: number;
  unit_amount: number; // centavos
};

type Cliente = {
  name: string;
  email: string;
  tax_id?: string;
  phone?: string;
};

/* =========================
   HELPERS
========================= */
function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function toNumber(v: any, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function normalizeItem(i: any, idx: number): CheckoutItem {
  // tenta cobrir o máximo de formatos possíveis
  const quantity = toNumber(i?.quantity ?? i?.qtd ?? i?.qty ?? 1, 1);

  // unit_amount em centavos
  // tenta: unit_amount | preco_centavos | unitAmount | price_cents
  // tenta reais: preco | price | valor -> converte para centavos se parecer decimal
  let unit = i?.unit_amount ?? i?.preco_centavos ?? i?.unitAmount ?? i?.price_cents ?? null;

  if (unit == null) {
    const maybeReais = i?.preco ?? i?.price ?? i?.valor ?? i?.unit_price ?? null;
    if (maybeReais != null) {
      const vr = toNumber(maybeReais, 0);
      // se for algo tipo 19.99, converte p/ centavos
      unit = Math.round(vr * 100);
    } else {
      unit = 0;
    }
  } else {
    unit = toNumber(unit, 0);
  }

  const reference_id = String(i?.reference_id ?? i?.ean ?? i?.id ?? `item-${idx + 1}`);
  const name = String(i?.name ?? i?.nome ?? i?.titulo ?? "Item");

  return { reference_id, name, quantity, unit_amount: unit };
}

function calcTotalCentavos(items: CheckoutItem[]) {
  return items.reduce((acc, it) => acc + toNumber(it.unit_amount) * toNumber(it.quantity, 1), 0);
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function safeFetchJson(input: RequestInfo, init?: RequestInit) {
  const r = await fetch(input, init);
  const text = await r.text();

  // Quando a rota não existe no Next, geralmente vem HTML 404 (doctype)
  const trimmed = (text || "").trim();
  const isHtml = trimmed.startsWith("<!DOCTYPE html>") || trimmed.startsWith("<html");

  const j = isHtml ? null : safeJsonParse(text);
  return { r, text, j, isHtml };
}

function pickLatestCheckoutFromSession(): any | null {
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("fv_checkout_")) keys.push(k);
    }
    if (!keys.length) return null;

    // tenta pegar o mais recente: se a chave tiver timestamp no final, usa isso.
    const scored = keys
      .map((k) => {
        const m = k.match(/fv_checkout_(\d+)/);
        const ts = m ? Number(m[1]) : 0;
        return { k, ts };
      })
      .sort((a, b) => b.ts - a.ts);

    for (const { k } of scored) {
      const raw = sessionStorage.getItem(k);
      if (!raw) continue;
      const obj = safeJsonParse(raw);
      if (obj) return { _key: k, ...obj };
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeVendaFromSession(s: any): VendaSite {
  // padrões comuns que você pode ter salvo
  return {
    id: s?.venda_id ?? s?.pedido_id ?? s?.id ?? null,
    status: s?.status ?? null,

    cliente_nome: s?.cliente?.name ?? s?.cliente_nome ?? s?.nome ?? null,
    cliente_email: s?.cliente?.email ?? s?.cliente_email ?? s?.email ?? null,
    cliente_tax_id: s?.cliente?.tax_id ?? s?.cliente_tax_id ?? s?.cpf ?? null,
    cliente_phone: s?.cliente?.phone ?? s?.cliente_phone ?? s?.telefone ?? null,

    itens: s?.items ?? s?.itens ?? s?.cart?.items ?? null,

    total_centavos:
      s?.total_centavos ??
      s?.total_cents ??
      (s?.total != null ? Math.round(Number(s.total) * 100) : null) ??
      (s?.total_reais != null ? Math.round(Number(s.total_reais) * 100) : null) ??
      null,
  };
}

/* =========================
   COMPONENT
========================= */
export default function CheckoutClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const orderId = sp.get("order_id") || "";
  const pedidoId = sp.get("pedido_id") || "";
  const vendaId = sp.get("venda_id") || "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [venda, setVenda] = useState<VendaSite | null>(null);
  const [debugSource, setDebugSource] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setDebugSource(null);

        // precisa ter pelo menos algum identificador
        if (!orderId && !pedidoId && !vendaId) {
          // tenta achar do sessionStorage mesmo assim
          const s = pickLatestCheckoutFromSession();
          if (s) {
            const v = normalizeVendaFromSession(s);
            if (!alive) return;
            setVenda(v);
            setDebugSource(`sessionStorage:${s?._key || "fv_checkout_*"}`);
            return;
          }

          setErr("order_id não informado (e não achei fv_checkout_* no sessionStorage).");
          setVenda(null);
          return;
        }

        // 1) tenta API status
        const { r, j, text, isHtml } = await safeFetchJson("/api/pagbank/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            order_id: orderId || undefined,
            pedido_id: pedidoId || undefined,
            venda_id: vendaId || undefined,
          }),
        });

        if (!r.ok || !j?.ok || isHtml) {
          // 2) fallback sessionStorage
          const s = pickLatestCheckoutFromSession();
          if (s) {
            const v = normalizeVendaFromSession(s);
            if (!alive) return;
            setVenda(v);
            setDebugSource(`sessionStorage:${s?._key || "fv_checkout_*"}`);

            // se a API falhou, mas temos session, não é erro fatal
            // (só mostra debug se quiser)
            return;
          }

          // sem session, aí sim erro
          const hint =
            isHtml || String(text || "").includes("<!DOCTYPE html>")
              ? "A rota /api/pagbank/status parece não existir no deploy (voltou HTML/404)."
              : "A API /api/pagbank/status respondeu erro.";

          const apiMsg =
            (j && (j.error || j.message)) ||
            (text && text.slice(0, 120)) ||
            `HTTP ${r.status}`;

          setErr(`${hint} Detalhe: ${apiMsg}`);
          setVenda(null);
          return;
        }

        if (!alive) return;
        setVenda(j?.venda || null);
        setDebugSource("api:/api/pagbank/status");
      } catch (e: any) {
        // 3) fallback final sessionStorage
        const s = pickLatestCheckoutFromSession();
        if (s) {
          const v = normalizeVendaFromSession(s);
          if (!alive) return;
          setVenda(v);
          setDebugSource(`sessionStorage:${s?._key || "fv_checkout_*"}`);
          return;
        }

        if (!alive) return;
        setErr(String(e?.message || e));
        setVenda(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [orderId, pedidoId, vendaId]);

  const cliente: Cliente = useMemo(() => {
    const v = venda;
    return {
      name: v?.cliente_nome || "Cliente",
      email: v?.cliente_email || "cliente@iadrogarias.com",
      tax_id: onlyDigits(v?.cliente_tax_id || "") || undefined,
      phone: onlyDigits(v?.cliente_phone || "") || undefined,
    };
  }, [venda]);

  const items: CheckoutItem[] = useMemo(() => {
    const arr = Array.isArray(venda?.itens) ? (venda!.itens as any[]) : [];
    return arr.map((i, idx) => normalizeItem(i, idx));
  }, [venda]);

  const totalCentavos = useMemo(() => {
    // prioridade: total_centavos vindo do backend/session
    const v = venda;
    const explicit =
      v?.total_centavos != null
        ? toNumber(v.total_centavos, 0)
        : v?.total_reais != null
        ? Math.round(toNumber(v.total_reais, 0) * 100)
        : v?.total != null
        ? Math.round(toNumber(v.total, 0) * 100)
        : null;

    const calc = calcTotalCentavos(items);
    // se explicit vier zerado e itens tiverem valor, usa cálculo
    if ((explicit == null || explicit <= 0) && calc > 0) return calc;

    return explicit ?? calc;
  }, [venda, items]);

  const itemsFixed = useMemo(() => {
    // se o total ficou certo, mas algum item veio zerado, não inventa preço:
    // mantém como está (assim você detecta a origem).
    // (se quiser, depois fazemos fallback de preço pelo catalogo)
    return items;
  }, [items]);

  function onPaid() {
    alert("Pagamento aprovado 🎉");
    router.push("/fv");
  }

  if (loading) return <div className="p-6">Carregando…</div>;

  if (err) {
    return (
      <div className="p-6">
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>

        <button
          className="rounded-xl border px-4 py-2 text-sm"
          onClick={() => router.push("/fv")}
        >
          Voltar para a loja
        </button>
      </div>
    );
  }

  if (!venda) return <div className="p-6">Venda não encontrada.</div>;

  // Segurança: se total ou itens inválidos, já avisa (evita PIX 0,00)
  if (!itemsFixed.length || totalCentavos <= 0) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <h1 className="mb-4 text-xl font-semibold">Finalizar pagamento</h1>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="font-semibold">
            Seu pedido ficou com total zerado (R$ 0,00) ou sem itens válidos.
          </div>
          <div className="mt-2 text-red-700/90">
            Volte ao carrinho e finalize novamente. Se persistir, me mande print do
            <code className="mx-1 rounded bg-white/60 px-1">sessionStorage</code>
            com a chave <code className="rounded bg-white/60 px-1">fv_checkout_*</code>.
          </div>
          {debugSource && (
            <div className="mt-2 text-xs opacity-80">
              Fonte: <span className="font-mono">{debugSource}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            className="rounded-xl border px-4 py-2 text-sm"
            onClick={() => router.push("/fv")}
          >
            Voltar para a loja
          </button>
          <button
            className="rounded-xl border px-4 py-2 text-sm"
            onClick={() => location.reload()}
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }

  // Ajuste: se o PagbankPayment calcula total pelos items, garanta que os itens tenham os valores certos
  // (aqui já está em centavos)
  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-semibold">Finalizar pagamento</h1>

      {/* debug discreto (pode remover depois) */}
      {debugSource && (
        <div className="mb-3 text-xs opacity-60">
          Fonte: <span className="font-mono">{debugSource}</span>
        </div>
      )}

      <PagbankPayment
        orderId={orderId || String(venda?.id || "")}
        cliente={cliente}
        items={itemsFixed}
        onPaid={onPaid}
      />
    </div>
  );
}
