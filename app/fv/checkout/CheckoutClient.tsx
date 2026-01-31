"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PagbankPayment from "../_components/PagbankPayment";

type VendaSite = {
  id: string;
  status: string | null;
  cliente_nome: string | null;
  cliente_email: string | null;
  cliente_tax_id: string | null;
  cliente_phone: string | null;
  itens: any[] | null;
  total_centavos: number | null;
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

export default function CheckoutClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const orderId = sp.get("order_id") || ""; // vem do carrinho
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [venda, setVenda] = useState<VendaSite | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        if (!orderId) {
          setErr("order_id não informado.");
          setVenda(null);
          return;
        }

        const r = await fetch("/api/pagbank/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId }),
          cache: "no-store",
        });
        const j = await r.json();
        if (!r.ok || !j?.ok) throw new Error(j?.error || "Falha ao buscar venda");

        setVenda(j?.venda || null);
      } catch (e: any) {
        setErr(String(e?.message || e));
        setVenda(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const cliente = useMemo(() => {
    const v = venda;
    return {
      name: v?.cliente_nome || "Cliente",
      email: v?.cliente_email || "cliente@iadrogarias.com",
      tax_id: onlyDigits(v?.cliente_tax_id || ""),
      phone: onlyDigits(v?.cliente_phone || ""),
    };
  }, [venda]);

  const items = useMemo(() => {
    const arr = Array.isArray(venda?.itens) ? venda!.itens! : [];
    // Espera itens no formato do seu PagbankPayment: unit_amount (centavos)
    return arr.map((i: any, idx: number) => ({
      reference_id: String(i?.reference_id || i?.ean || i?.id || `item-${idx + 1}`),
      name: String(i?.name || i?.nome || "Item"),
      quantity: Number(i?.quantity || i?.qtd || 1),
      unit_amount: Number(i?.unit_amount || i?.preco_centavos || i?.unitAmount || 0),
    }));
  }, [venda]);

  function onPaid() {
    // aqui você pode atualizar status, redirecionar, etc
    alert("Pagamento aprovado 🎉");
    router.push("/fv"); // ou /fv/pedido/xxxx
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
