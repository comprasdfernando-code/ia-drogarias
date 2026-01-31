"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PagbankPayment from "../_components/PagbankPayment";

type PedidoFV = {
  id: string;
  grupo_id: string | null;
  status: string | null;

  cliente_nome: string | null;
  cliente_email: string | null;
  cliente_cpf: string | null;
  cliente_whatsapp: string | null;

  pagamento: string | null;
  tipo_entrega: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;

  itens: any[] | null;
  total: number | null; // em reais
  total_centavos: number | null; // se existir no seu banco (opcional)
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

export default function CheckoutClient() {
  const sp = useSearchParams();
  const router = useRouter();

  // ✅ agora aceitamos os 3
  const pedidoId = sp.get("pedido_id") || "";
  const grupoId = sp.get("grupo_id") || "";
  const orderIdFromUrl = sp.get("order_id") || "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [orderId, setOrderId] = useState<string>(orderIdFromUrl);
  const [pedido, setPedido] = useState<PedidoFV | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // 1) se já veio order_id, só segue (pode opcionalmente buscar pedido)
        if (orderIdFromUrl) {
          setOrderId(orderIdFromUrl);
          return;
        }

        // 2) se não veio order_id, precisa ter pedido_id ou grupo_id
        if (!pedidoId && !grupoId) {
          setErr("pedido_id ou grupo_id não informado.");
          return;
        }

        // 3) cria/recupera order_id baseado no(s) pedido(s)
        const r = await fetch("/api/pagbank/create-from-pedido", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ pedido_id: pedidoId || null, grupo_id: grupoId || null }),
        });

        const text = await r.text();
        let j: any = null;
        try {
          j = text ? JSON.parse(text) : null;
        } catch {
          // se vier vazio/html, evita “Unexpected end of JSON”
          j = null;
        }

        if (!r.ok || !j?.ok) {
          throw new Error(j?.error || `Falha ao criar pagamento (HTTP ${r.status}).`);
        }

        setOrderId(String(j.order_id || ""));
        setPedido((j.pedido as PedidoFV) || null);

        // ✅ mantém a URL “bonita” com order_id pra refresh funcionar
        const next = `/fv/checkout?order_id=${encodeURIComponent(j.order_id)}${
          j?.pedido_id ? `&pedido_id=${encodeURIComponent(j.pedido_id)}` : ""
        }${j?.grupo_id ? `&grupo_id=${encodeURIComponent(j.grupo_id)}` : ""}`;
        router.replace(next);
      } catch (e: any) {
        setErr(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId, grupoId, orderIdFromUrl]);

  const cliente = useMemo(() => {
    const p = pedido;
    return {
      name: p?.cliente_nome || "Cliente",
      email: p?.cliente_email || "cliente@iadrogarias.com",
      tax_id: onlyDigits(p?.cliente_cpf || ""), // ✅ CPF
      phone: onlyDigits(p?.cliente_whatsapp || ""),
    };
  }, [pedido]);

  const items = useMemo(() => {
    const arr = Array.isArray(pedido?.itens) ? pedido!.itens! : [];
    return arr.map((i: any, idx: number) => ({
      reference_id: String(i?.reference_id || i?.ean || i?.id || `item-${idx + 1}`),
      name: String(i?.name || i?.nome || "Item"),
      quantity: Number(i?.quantity || i?.qtd || 1),
      unit_amount: Number(i?.unit_amount || i?.preco_centavos || i?.unitAmount || 0),
    }));
  }, [pedido]);

  function onPaid() {
    alert("Pagamento aprovado 🎉");
    router.push("/fv");
  }

  if (loading) return <div className="p-6">Carregando…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;

  if (!orderId) return <div className="p-6">order_id não encontrado.</div>;

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-semibold">Finalizar pagamento</h1>

      <PagbankPayment orderId={orderId} cliente={cliente} items={items} onPaid={onPaid} />
    </div>
  );
}
