"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PagbankPayment from "../_components/PagbankPayment";

type Venda = {
  id: string;
  status: string | null;
  pagamento: string | null;

  total: number | null;
  subtotal: number | null;
  taxa_entrega: number | null;

  cliente_nome: string | null;
  cliente_email: string | null;
  cliente_tax_id: string | null;
  cliente_whatsapp: string | null;
};

type VendaItem = {
  venda_id: string;
  reference_id: string | null;
  ean: string | null;
  nome: string | null;
  qty: number | null;
  unit_amount: number | null; // centavos
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

export default function CheckoutPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const vendaId = sp.get("venda") || "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [venda, setVenda] = useState<Venda | null>(null);
  const [itens, setItens] = useState<VendaItem[]>([]);

  useEffect(() => {
    (async () => {
      setErr(null);

      if (!vendaId) {
        setErr("Venda inválida.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: v, error: e1 } = await supabase.from("vendas_site").select("*").eq("id", vendaId).maybeSingle();
        if (e1) throw e1;
        if (!v) throw new Error("Venda não encontrada.");

        const { data: its, error: e2 } = await supabase.from("vendas_site_itens").select("*").eq("venda_id", vendaId);
        if (e2) throw e2;

        setVenda(v as any);
        setItens((its || []) as any[]);
      } catch (e: any) {
        setErr(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [vendaId]);

  const cliente = useMemo(() => {
    if (!venda) return null;
    return {
      name: venda.cliente_nome || "Cliente",
      email: venda.cliente_email || "cliente@iadrogarias.com",
      tax_id: onlyDigits(venda.cliente_tax_id || ""),
      phone: onlyDigits(venda.cliente_whatsapp || ""),
    };
  }, [venda]);

  const items = useMemo(() => {
    return itens.map((it) => ({
      reference_id: String(it.reference_id || it.ean || "item"),
      name: String(it.nome || "Item"),
      quantity: Number(it.qty || 1),
      unit_amount: Number(it.unit_amount || 0),
    }));
  }, [itens]);

  function handlePaid() {
    alert("Pagamento aprovado 🎉");
    // opcional: router.push(`/fv/pedido/${vendaId}`);
    // ou página de obrigado:
    // router.push(`/fv/obrigado?venda=${vendaId}`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <div className="rounded-2xl border bg-white p-4">Carregando checkout…</div>
      </div>
    );
  }

  if (err || !venda || !cliente) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <div className="rounded-2xl border bg-red-50 p-4 text-sm">{err || "Erro no checkout."}</div>
        <button className="mt-3 rounded-xl border px-4 py-2 font-extrabold" onClick={() => router.push("/fv")}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-extrabold">Finalizar pagamento</h1>

      <div className="mb-3 rounded-2xl border bg-white p-4">
        <div className="text-sm text-gray-600">Venda</div>
        <div className="font-extrabold">{venda.id}</div>
        <div className="text-xs text-gray-500">Status: {venda.status || "—"}</div>
      </div>

      <PagbankPayment orderId={venda.id} cliente={cliente} items={items} onPaid={handlePaid} />
    </div>
  );
}
