"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PagbankPayment from "../_components/PagbankPayment";

type CheckoutPayload = {
  order_id: string;
  pedido_id?: string | null;
  grupo_id?: string | null;
  total_centavos?: number | null;
  pagamento?: "PIX" | "CARTAO" | "DINHEIRO" | "COMBINAR" | string;

  cliente?: {
    name?: string | null;
    email?: string | null;
    tax_id?: string | null; // CPF
    phone?: string | null;
  };

  items?: Array<{
    reference_id?: string;
    name?: string;
    quantity?: number;
    unit_amount?: number; // centavos
  }>;

  entrega?: any;
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function brlFromCentavos(cents: number) {
  const v = (Number(cents || 0) / 100) || 0;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function safeJsonParse<T>(txt: string | null): T | null {
  if (!txt) return null;
  try {
    return JSON.parse(txt) as T;
  } catch {
    return null;
  }
}

function computeTotalCentavos(items: any[] | undefined | null) {
  const arr = Array.isArray(items) ? items : [];
  return arr.reduce((acc, it) => {
    const q = Number(it?.quantity || 0);
    const ua = Number(it?.unit_amount || 0);
    return acc + Math.max(0, q) * Math.max(0, ua);
  }, 0);
}

function normalizeItems(payload: CheckoutPayload | null) {
  const arr = Array.isArray(payload?.items) ? payload!.items! : [];
  return arr
    .map((i: any, idx: number) => ({
      reference_id: String(i?.reference_id || `item-${idx + 1}`),
      name: String(i?.name || "Item"),
      quantity: Math.max(1, Number(i?.quantity || 1)),
      unit_amount: Math.max(0, Number(i?.unit_amount || 0)),
    }))
    .filter((x) => x.unit_amount > 0 && x.quantity > 0);
}

function findPayloadByPedidoId(pedidoId: string) {
  try {
    // procura em todas as chaves fv_checkout_*
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i) || "";
      if (!k.startsWith("fv_checkout_")) continue;
      const raw = sessionStorage.getItem(k);
      const p = safeJsonParse<CheckoutPayload>(raw);
      if (p?.pedido_id && String(p.pedido_id) === String(pedidoId)) {
        return { key: k, payload: p };
      }
    }
  } catch {}
  return null;
}

export default function CheckoutClient() {
  // ✅ Suspense aqui dentro resolve o erro do Next:
  // "useSearchParams should be wrapped in a suspense boundary"
  return (
    <Suspense fallback={<div className="p-6">Carregando checkout…</div>}>
      <CheckoutInner />
    </Suspense>
  );
}

function CheckoutInner() {
  const sp = useSearchParams();
  const router = useRouter();

  const orderIdFromUrl = sp.get("order_id") || "";
  const pedidoIdFromUrl = sp.get("pedido_id") || "";
  const grupoIdFromUrl = sp.get("grupo_id") || "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [orderId, setOrderId] = useState<string>("");
  const [payload, setPayload] = useState<CheckoutPayload | null>(null);

  // campos editáveis (CPF/Email/Telefone)
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      try {
        let oid = orderIdFromUrl.trim();
        let p: CheckoutPayload | null = null;

        // 1) tenta pelo order_id
        if (oid) {
          const key = `fv_checkout_${oid}`;
          p = safeJsonParse<CheckoutPayload>(sessionStorage.getItem(key));
          if (!p) {
            // se não achou, pode ter sido limpo → tenta pelo pedido_id
            if (pedidoIdFromUrl) {
              const found = findPayloadByPedidoId(pedidoIdFromUrl);
              if (found?.payload) {
                p = found.payload;
                oid = p.order_id || oid;
              }
            }
          }
        } else {
          // 2) sem order_id → tenta achar pelo pedido_id
          if (pedidoIdFromUrl) {
            const found = findPayloadByPedidoId(pedidoIdFromUrl);
            if (found?.payload) {
              p = found.payload;
              oid = p.order_id || "";
            }
          }
        }

        if (!oid) {
          setErr("order_id não informado (e não encontrei pelo pedido_id).");
          setPayload(null);
          setOrderId("");
          return;
        }

        if (!p) {
          setErr(
            "Não encontrei dados do checkout no navegador. Volte ao carrinho e finalize novamente para gerar o pagamento."
          );
          setPayload(null);
          setOrderId(oid);
          return;
        }

        // garantir ids
        p.order_id = p.order_id || oid;
        p.pedido_id = p.pedido_id || pedidoIdFromUrl || null;
        p.grupo_id = p.grupo_id || grupoIdFromUrl || null;

        // hidrata campos editáveis
        setCpf(onlyDigits(p?.cliente?.tax_id || ""));
        setEmail((p?.cliente?.email || "") as string);
        setPhone(onlyDigits(p?.cliente?.phone || ""));

        setOrderId(oid);
        setPayload(p);
      } catch (e: any) {
        setErr(String(e?.message || e));
        setPayload(null);
        setOrderId("");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderIdFromUrl, pedidoIdFromUrl, grupoIdFromUrl]);

  const items = useMemo(() => normalizeItems(payload), [payload]);

  const totalCentavos = useMemo(() => {
    const fromPayload = Number(payload?.total_centavos || 0);
    const fromItems = computeTotalCentavos(items);
    // prefere o maior (evita 0,00)
    return Math.max(fromPayload, fromItems);
  }, [payload, items]);

  const needsCpf = useMemo(() => {
    const pg = String(payload?.pagamento || "PIX").toUpperCase();
    return pg === "PIX" || pg === "CARTAO";
  }, [payload]);

  const cliente = useMemo(() => {
    const nome = payload?.cliente?.name || "Cliente";
    const em = (email || payload?.cliente?.email || "cliente@iadrogarias.com").toString().trim();
    const ph = onlyDigits(phone || (payload?.cliente?.phone || "").toString());
    const tx = onlyDigits(cpf || (payload?.cliente?.tax_id || "").toString());
    return {
      name: nome,
      email: em,
      tax_id: tx,
      phone: ph,
    };
  }, [payload, cpf, email, phone]);

  const cpfOk = !needsCpf || onlyDigits(cliente.tax_id).length === 11;

  function persistPayloadUpdated() {
    if (!payload || !orderId) return;
    const updated: CheckoutPayload = {
      ...payload,
      order_id: orderId,
      cliente: {
        ...(payload.cliente || {}),
        name: cliente.name,
        email: cliente.email,
        tax_id: cliente.tax_id,
        phone: cliente.phone,
      },
      items,
      total_centavos: totalCentavos,
    };
    try {
      sessionStorage.setItem(`fv_checkout_${orderId}`, JSON.stringify(updated));
    } catch {}
    setPayload(updated);
  }

  function onPaid() {
    alert("Pagamento aprovado 🎉");
    router.push("/fv");
  }

  if (loading) return <div className="p-6">Carregando…</div>;
  if (err) return <div className="p-6 text-red-600 font-bold">{err}</div>;

  // segurança extra
  if (!payload) return <div className="p-6">Checkout não encontrado.</div>;

  if (!items.length || totalCentavos <= 0) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-extrabold">Finalizar pagamento</h1>
        <div className="mt-3 rounded-2xl border bg-red-50 p-4 text-red-700 font-bold">
          Seu pedido ficou com total zerado (R$ 0,00) ou sem itens válidos.
          <div className="mt-2 text-sm font-normal text-red-700">
            Volte ao carrinho e finalize novamente. Se persistir, me mande print do `sessionStorage fv_checkout_*`.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-2 text-xl font-extrabold">Finalizar pagamento</h1>

      <div className="mb-4 rounded-2xl border bg-white p-4">
        <div className="text-sm text-gray-600">
          <b>Pedido:</b> {payload.pedido_id || "—"} {payload.grupo_id ? <span>• <b>Grupo:</b> {payload.grupo_id}</span> : null}
        </div>
        <div className="mt-1 text-sm text-gray-600">
          <b>Order:</b> {orderId}
        </div>
        <div className="mt-3 text-2xl font-extrabold text-green-700">{brlFromCentavos(totalCentavos)}</div>

        {/* ✅ CPF/Contato */}
        <div className="mt-4 grid grid-cols-1 gap-2">
          <input
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder={needsCpf ? "CPF (obrigatório para PIX/CARTÃO)" : "CPF (opcional)"}
            className={`w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-4 ${
              needsCpf ? "focus:ring-amber-100" : "focus:ring-blue-100"
            }`}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (recomendado)"
            className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-4 focus:ring-blue-100"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="WhatsApp com DDD (ex: 11999999999)"
            className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-4 focus:ring-blue-100"
          />

          {needsCpf && !cpfOk ? (
            <div className="text-xs font-bold text-red-600">CPF inválido. Informe 11 dígitos.</div>
          ) : (
            <div className="text-[11px] text-gray-500">
              Dica: CPF e WhatsApp só números. Email ajuda na confirmação.
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={persistPayloadUpdated}
              className="flex-1 rounded-xl border bg-white hover:bg-gray-50 px-3 py-2.5 font-extrabold"
            >
              Salvar dados
            </button>
            <button
              type="button"
              onClick={() => router.push("/fv")}
              className="rounded-xl border bg-white hover:bg-gray-50 px-3 py-2.5 font-extrabold"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Pagamento */}
      {!cpfOk ? (
        <div className="rounded-2xl border bg-red-50 p-4 text-red-700 font-bold">
          Para gerar o pagamento, informe o CPF corretamente.
        </div>
      ) : (
        <PagbankPayment orderId={orderId} cliente={cliente} items={items} onPaid={onPaid} />
      )}

      {/* Lista de itens (debug amigável) */}
      <div className="mt-4 rounded-2xl border bg-white p-4">
        <div className="font-extrabold mb-2">Itens</div>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={`${it.reference_id}-${idx}`} className="flex items-start justify-between gap-3 border rounded-xl p-3">
              <div className="min-w-0">
                <div className="font-bold text-sm line-clamp-2">{it.name}</div>
                <div className="text-xs text-gray-500">ref: {it.reference_id}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600">
                  {it.quantity} x {brlFromCentavos(it.unit_amount)}
                </div>
                <div className="font-extrabold">{brlFromCentavos(it.quantity * it.unit_amount)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
