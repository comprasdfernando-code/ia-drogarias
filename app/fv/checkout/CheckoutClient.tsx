"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PagbankPayment from "../_components/PagbankPayment";

type VendaSite = {
  id?: string;
  status?: string | null;

  cliente_nome?: string | null;
  cliente_email?: string | null;
  cliente_tax_id?: string | null;
  cliente_phone?: string | null;

  itens?: any[] | null;

  // alguns lugares podem vir com total em centavos ou reais
  total_centavos?: number | null;
  total?: number | null;
  total_reais?: number | null;
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

/** Converte valores que podem vir em reais OU centavos para centavos */
function toCents(v: any): number {
  if (v === null || v === undefined) return 0;

  // se vier string "19,99" ou "19.99"
  if (typeof v === "string") {
    const s = v.trim().replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    if (!Number.isFinite(n)) return 0;
    // se for 0..9999 assume reais, converte
    if (n > 0 && n < 100000) return Math.round(n * 100);
    return Math.round(n);
  }

  if (typeof v === "number") {
    if (!Number.isFinite(v)) return 0;

    // heurística:
    // - se tiver casas decimais, provavelmente reais (19.99)
    const hasDecimals = Math.abs(v - Math.round(v)) > 0.000001;
    if (hasDecimals) return Math.round(v * 100);

    // - se for pequeno demais (ex.: 20), pode ser reais (20) -> 2000
    //   MAS cuidado: pode ser centavos 20 também. Vamos assumir:
    //   se for <= 9999, costuma ser reais no front; se for centavos geralmente fica >= 100.
    //   Aqui, vamos usar: se for <= 9999 e NÃO parece centavos, tratar como reais.
    if (v > 0 && v <= 9999) return Math.round(v * 100);

    // - senão já deve ser centavos
    return Math.round(v);
  }

  return 0;
}

/** Tenta achar um payload salvo no sessionStorage no padrão fv_checkout_* */
function findCheckoutInSession(pedidoId?: string) {
  try {
    if (typeof window === "undefined") return null;

    // se tiver pedidoId, tentamos bater direto
    if (pedidoId) {
      const direct = sessionStorage.getItem(`fv_checkout_${pedidoId}`);
      if (direct) return JSON.parse(direct);
    }

    // senão, procura o último que existir
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("fv_checkout_")) keys.push(k);
    }
    keys.sort(); // geralmente tem timestamp/uuid no final, mas ok
    const lastKey = keys[keys.length - 1];
    if (!lastKey) return null;

    const raw = sessionStorage.getItem(lastKey);
    if (!raw) return null;

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** fetch JSON seguro (evita "Unexpected end of JSON input") */
async function safeFetchJson(input: RequestInfo, init?: RequestInit) {
  const r = await fetch(input, init);
  const text = await r.text();
  let j: any = null;

  if (text && text.trim()) {
    try {
      j = JSON.parse(text);
    } catch {
      // se o backend devolver HTML/empty, mantém null
      j = null;
    }
  }

  return { r, j, text };
}

export default function CheckoutClient() {
  const sp = useSearchParams();
  const router = useRouter();

  // Pode vir do carrinho / do seu fluxo:
  const orderIdParam = sp.get("order_id") || "";
  const pedidoId = sp.get("pedido_id") || "";
  const vendaId = sp.get("venda_id") || "";

  const [resolvedOrderId, setResolvedOrderId] = useState<string>(orderIdParam);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [venda, setVenda] = useState<VendaSite | null>(null);

  // CPF manual (pra PIX)
  const [cpf, setCpf] = useState("");

  // 1) Resolve order_id se não vier na URL
  useEffect(() => {
    if (orderIdParam) {
      setResolvedOrderId(orderIdParam);
      return;
    }

    // tenta recuperar do sessionStorage
    const ss = findCheckoutInSession(pedidoId || undefined);

    // algumas possibilidades de como você pode ter salvo:
    // ss.order_id, ss.orderId, ss.pagbank_order_id, etc.
    const possible =
      ss?.order_id ||
      ss?.orderId ||
      ss?.pagbank_order_id ||
      ss?.pagbank?.order_id ||
      "";

    if (possible) {
      setResolvedOrderId(String(possible));
      return;
    }

    // sem order_id, não trava aqui ainda: vamos tentar buscar pelo pedido_id/venda_id
    setResolvedOrderId("");
  }, [orderIdParam, pedidoId]);

  // 2) Busca a venda no backend (status)
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      setVenda(null);

      try {
        // Se não tenho nada pra identificar, erro.
        if (!resolvedOrderId && !pedidoId && !vendaId) {
          setErr("order_id não informado (e não encontrei no sessionStorage).");
          return;
        }

        // Tentativa A: POST /api/pagbank/status (seu código original)
        // Enviamos o máximo de chaves possíveis (order_id, pedido_id, venda_id)
        const body = JSON.stringify({
          order_id: resolvedOrderId || undefined,
          pedido_id: pedidoId || undefined,
          venda_id: vendaId || undefined,
        });

        let resp = await safeFetchJson("/api/pagbank/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          cache: "no-store",
        });

        // Se o endpoint não aceita POST (405) ou não existe (404), tenta GET
        if (resp.r.status === 405 || resp.r.status === 404) {
          const qs = new URLSearchParams();
          if (resolvedOrderId) qs.set("order_id", resolvedOrderId);
          if (pedidoId) qs.set("pedido_id", pedidoId);
          if (vendaId) qs.set("venda_id", vendaId);

          resp = await safeFetchJson(`/api/pagbank/status?${qs.toString()}`, {
            method: "GET",
            cache: "no-store",
          });
        }

        const { r, j, text } = resp;

        if (!r.ok) {
          throw new Error(
            `Falha ao buscar venda (HTTP ${r.status}). Verifique /api/pagbank/status.` +
              (text ? ` Resposta: ${text.slice(0, 120)}` : "")
          );
        }

        // Espera { ok: true, venda: {...} }
        if (!j?.ok) {
          throw new Error(j?.error || "Falha ao buscar venda (payload inválido).");
        }

        const v: VendaSite | null = j?.venda || null;
        setVenda(v);

        // Pré-preencher CPF se vier do banco
        const cpfDb = onlyDigits(v?.cliente_tax_id || "");
        if (cpfDb.length === 11) setCpf(cpfDb);

        // Se a API devolveu order_id, fixa aqui
        const ord = String(j?.order_id || v?.id || "").trim();
        if (!resolvedOrderId && j?.order_id) setResolvedOrderId(String(j.order_id));
      } catch (e: any) {
        setErr(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [resolvedOrderId, pedidoId, vendaId]);

  const cliente = useMemo(() => {
    const v = venda;
    const cpfDigits = onlyDigits(cpf);

    return {
      name: v?.cliente_nome || "Cliente",
      email: v?.cliente_email || "cliente@iadrogarias.com",
      tax_id: cpfDigits || undefined,
      phone: onlyDigits(v?.cliente_phone || "") || undefined,
    };
  }, [venda, cpf]);

  const items = useMemo(() => {
    const arr = Array.isArray(venda?.itens) ? (venda!.itens as any[]) : [];

    return arr
      .map((i: any, idx: number) => {
        const qty = Number(i?.quantity ?? i?.qtd ?? 1);
        const unitRaw =
          i?.unit_amount ??
          i?.preco_centavos ??
          i?.unitAmount ??
          i?.preco ??
          i?.valor ??
          0;

        const unit_amount = toCents(unitRaw);

        return {
          reference_id: String(
            i?.reference_id || i?.ean || i?.produto_id || i?.id || `item-${idx + 1}`
          ),
          name: String(i?.name || i?.nome || "Item"),
          quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
          unit_amount,
        };
      })
      .filter((it) => it.unit_amount > 0 && it.quantity > 0);
  }, [venda]);

  const total = useMemo(() => {
    // prioridade: total vindo do backend, senão soma dos itens
    const backendTotal =
      toCents(venda?.total_centavos) ||
      toCents(venda?.total_reais) ||
      toCents(venda?.total) ||
      0;

    if (backendTotal > 0) return backendTotal;

    return items.reduce((acc, it) => acc + it.unit_amount * it.quantity, 0);
  }, [venda, items]);

  function onPaid() {
    alert("Pagamento aprovado 🎉");
    router.push("/fv");
  }

  if (loading) return <div className="p-6">Carregando…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!venda) return <div className="p-6">Venda não encontrada.</div>;

  // Se ficou zerado, mostra diagnóstico (isso é o que estava acontecendo contigo)
  if (!items.length || total <= 0) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <h1 className="mb-4 text-xl font-semibold">Finalizar pagamento</h1>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="font-semibold">
            Seu pedido ficou com total zerado (R$ 0,00) ou sem itens válidos.
          </div>
          <div className="mt-2">
            Volte ao carrinho e finalize novamente. Se persistir, me mande print
            do <code className="rounded bg-white/60 px-1">sessionStorage</code>{" "}
            do <code className="rounded bg-white/60 px-1">fv_checkout_*</code>.
          </div>

          <div className="mt-3 text-xs opacity-80">
            Diagnóstico:
            <div>- itens recebidos: {Array.isArray(venda?.itens) ? venda!.itens!.length : 0}</div>
            <div>- itens válidos: {items.length}</div>
            <div>- total backend: {String(venda?.total_centavos ?? venda?.total_reais ?? venda?.total ?? "n/a")}</div>
          </div>
        </div>

        <button
          className="mt-4 rounded-xl border px-4 py-3"
          onClick={() => router.push("/fv")}
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-semibold">Finalizar pagamento</h1>

      {/* CPF obrigatório pro PIX */}
      <div className="mb-4 rounded-2xl border p-4">
        <div className="text-sm font-semibold">CPF para pagamento (PIX)</div>
        <div className="mt-2 flex flex-col gap-2">
          <input
            value={cpf}
            onChange={(e) => setCpf(onlyDigits(e.target.value))}
            placeholder="Digite o CPF (11 números)"
            inputMode="numeric"
            className="w-full rounded-xl border px-3 py-2"
            maxLength={14}
          />
          <div className="text-xs opacity-70">
            * O PagBank exige CPF do pagador no PIX.
          </div>
        </div>
      </div>

      <PagbankPayment
        orderId={resolvedOrderId || (orderIdParam || "")}
        cliente={cliente}
        items={items}
        onPaid={onPaid}
      />
    </div>
  );
}
