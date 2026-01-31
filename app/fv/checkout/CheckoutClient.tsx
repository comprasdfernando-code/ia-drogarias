"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PagbankPayment from "../_components/PagbankPayment";

type VendaSite = {
  id: string;
  status: string | null;

  // campos possíveis (tabela pode variar)
  cliente_nome?: string | null;
  cliente_email?: string | null;
  cliente_tax_id?: string | null;
  cliente_phone?: string | null;

  tax_id?: string | null;
  cliente_whatsapp?: string | null;
  phone?: string | null;
  email?: string | null;

  itens?: any[] | null;

  total_centavos?: number | null;
  total?: number | null;
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

// ✅ evita "Unexpected end of JSON input"
async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function CheckoutClient() {
  const sp = useSearchParams();
  const router = useRouter();

  // ✅ aceita variações
  const orderId = sp.get("order_id") || sp.get("venda_id") || sp.get("id") || "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [venda, setVenda] = useState<VendaSite | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        if (!orderId) {
          if (!alive) return;
          setErr("order_id não informado.");
          setVenda(null);
          return;
        }

        // 1) tenta POST (seu padrão)
        let r = await fetch("/api/pagbank/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId }),
          cache: "no-store",
        });

        // 2) se API estiver como GET, tenta fallback
        if (r.status === 405) {
          r = await fetch(`/api/pagbank/status?order_id=${encodeURIComponent(orderId)}`, {
            method: "GET",
            cache: "no-store",
          });
        }

        const j = await safeJson(r);

        if (!r.ok) {
          const msg =
            (j && (j.error || j.message)) ||
            `Falha ao buscar venda (HTTP ${r.status}). Verifique /api/pagbank/status.`;
          throw new Error(msg);
        }

        if (!j?.ok) {
          throw new Error(j?.error || "Falha ao buscar venda");
        }

        const v = (j?.venda || null) as VendaSite | null;

        if (!alive) return;
        setVenda(v);
      } catch (e: any) {
        if (!alive) return;
        setErr(String(e?.message || e));
        setVenda(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [orderId]);

  const cliente = useMemo(() => {
    const v = venda;

    // ✅ tolerante a nomes diferentes
    const nome = v?.cliente_nome || "Cliente";
    const email = v?.cliente_email || v?.email || "cliente@iadrogarias.com";
    const tax = onlyDigits(v?.cliente_tax_id || v?.tax_id || "");
    const phone = onlyDigits(v?.cliente_phone || v?.cliente_whatsapp || v?.phone || "");

    return { name: nome, email, tax_id: tax, phone };
  }, [venda]);

  const items = useMemo(() => {
    const arr = Array.isArray(venda?.itens) ? (venda!.itens as any[]) : [];

    // ✅ unit_amount precisa estar em centavos
    return arr.map((i: any, idx: number) => {
      const qty = Number(i?.quantity || i?.qtd || 1);

      // tenta várias chaves
      let unit = Number(i?.unit_amount ?? i?.unitAmount ?? i?.preco_centavos ?? 0);

      // se vier preço em reais (ex: 19.99), converte (heurística)
      if (!unit && i?.preco != null) {
        const p = Number(i.preco);
        if (Number.isFinite(p)) unit = Math.round(p * 100);
      }

      return {
        reference_id: String(i?.reference_id || i?.ean || i?.id || `item-${idx + 1}`),
        name: String(i?.name || i?.nome || "Item"),
        quantity: qty,
        unit_amount: unit,
      };
    });
  }, [venda]);

  function onPaid() {
    alert("Pagamento aprovado 🎉");
    router.push("/fv");
  }

  if (loading) return <div className="p-6">Carregando…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!venda) return <div className="p-6">Venda não encontrada.</div>;

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-semibold">Finalizar pagamento</h1>
      <PagbankPayment orderId={orderId} cliente={cliente} items={items} onPaid={onPaid} />
    </div>
  );
}
