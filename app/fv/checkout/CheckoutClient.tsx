"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PagbankPayment from "../_components/PagbankPayment";
import { useCustomer } from "../_components/useCustomer";
import { useCart } from "../_components/cart";

type Metodo = "pix" | "cartao";

type EnderecoEntrega = {
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
  referencia: string;
};

type VendaLike = {
  id?: string;
  status?: string | null;
  cliente_nome?: string | null;
  cliente_email?: string | null;
  cliente_tax_id?: string | null;
  cliente_phone?: string | null;
  itens?: any[] | null;
  items?: any[] | null;
  total_centavos?: number | null;
  total?: number | null;
  subtotal?: number | null;
  entrega?: any | null;
  pedido_id?: string | null;
  grupo_id?: string | null;
  pagbank_id?: string | null;
};



function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function brlFromCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function centsFromMaybe(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number") {
    if (Number.isInteger(v) && v >= 1000) return Math.round(v);
    return Math.round(v * 100);
  }

  const str = String(v).trim();
  if (!str) return 0;

  const norm = str.replace(/\./g, "").replace(",", ".");
  const n = Number(norm);
  if (!Number.isFinite(n)) return 0;

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

  return {
    id: pickFirst(v?.id, v?.pedido_id, v?.venda_id, v?.order_id) as any,
    status: pickFirst(v?.status, v?.situacao, v?.state) as any,

    cliente_nome: pickFirst(
      v?.cliente_nome,
      v?.nome,
      v?.customer_name,
      v?.cliente?.nome,
      v?.customer?.name
    ) as any,

    cliente_email: pickFirst(
      v?.cliente_email,
      v?.email,
      v?.customer_email,
      v?.cliente?.email,
      v?.customer?.email
    ) as any,

    cliente_tax_id: pickFirst(
      v?.cliente_tax_id,
      v?.cpf,
      v?.tax_id,
      v?.customer_tax_id,
      v?.cliente?.cpf,
      v?.cliente?.tax_id,
      v?.customer?.tax_id
    ) as any,

    cliente_phone: pickFirst(
      v?.cliente_phone,
      v?.telefone,
      v?.phone,
      v?.customer_phone,
      v?.cliente?.telefone,
      v?.cliente?.whatsapp,
      v?.customer?.phone
    ) as any,

    itens: (Array.isArray(v?.itens) ? v?.itens : null) as any,
    items: (Array.isArray(v?.items) ? v?.items : null) as any,

    total_centavos: (v?.total_centavos ?? v?.totalCentavos ?? null) as any,
    total: (v?.total ?? v?.valor_total ?? v?.amount ?? null) as any,
    subtotal: (v?.subtotal ?? null) as any,

    entrega: (v?.entrega ?? v?.delivery ?? v?.endereco_entrega ?? null) as any,

    pedido_id: (v?.pedido_id ?? null) as any,
    grupo_id: (v?.grupo_id ?? null) as any,

    pagbank_id: (v?.pagbank_id ?? v?.charge_id ?? null) as any,
  };
}

function extractItems(v: VendaLike | null) {
  const arr =
    (Array.isArray(v?.itens) && v?.itens) ||
    (Array.isArray(v?.items) && v?.items) ||
    [];

  return arr.map((i: any, idx: number) => {
    const qty = Number(pickFirst(i?.quantity, i?.qty, i?.qtd, 1)) || 1;

    const unitCents = centsFromMaybe(
      pickFirst(
        i?.unit_amount,
        i?.preco_centavos,
        i?.unitAmount,
        i?.price_cents,
        i?.preco,
        i?.price,
        i?.valor_unitario,
        i?.valor
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
  return items.reduce(
    (acc, it) =>
      acc + (Number(it.unit_amount) || 0) * (Number(it.quantity) || 0),
    0
  );
}

function readSessionCheckout(orderId?: string) {
  try {
    if (orderId) {
      const byOrder = sessionStorage.getItem(`fv_checkout_${orderId}`);
      if (byOrder) return JSON.parse(byOrder);
    }

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

function hasEndereco(e: EnderecoEntrega) {
  return !!(e.endereco.trim() && e.numero.trim() && e.bairro.trim());
}

export default function CheckoutClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const { user, profile } = useCustomer();
  const cart = useCart();

  const enderecoCart = cart?.endereco;

  const [enderecoEntrega, setEnderecoEntrega] = useState<EnderecoEntrega>({
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "São Paulo",
    estado: "SP",
    complemento: "",
    referencia: "",
  });

  const orderId = sp.get("order_id") || "";
  const pedidoIdQS = sp.get("pedido_id") || "";
  const vendaId = sp.get("venda_id") || "";
  const grupoIdQS = sp.get("grupo_id") || "";
  const cpfQS = onlyDigits(sp.get("cpf") || "");

  const metodoQS = (sp.get("metodo") || "pix").toLowerCase();
  const metodoInitial: Metodo = metodoQS === "cartao" ? "cartao" : "pix";

  const [metodo, setMetodo] = useState<Metodo>(metodoInitial);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [debugFonte, setDebugFonte] = useState<string | null>(null);
  const [venda, setVenda] = useState<VendaLike | null>(null);
  const [cpf, setCpf] = useState<string>(cpfQS);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const m = (sp.get("metodo") || "pix").toLowerCase();
    setMetodo(m === "cartao" ? "cartao" : "pix");
  }, [sp]);

  useEffect(() => {
    if (!enderecoCart) return;

    setEnderecoEntrega({
      cep: enderecoCart.cep || "",
      endereco: enderecoCart.endereco || "",
      numero: enderecoCart.numero || "",
      bairro: enderecoCart.bairro || "",
      cidade: enderecoCart.cidade || "São Paulo",
      estado: enderecoCart.estado || "SP",
      complemento: enderecoCart.complemento || "",
      referencia: enderecoCart.referencia || "",
    });
  }, [enderecoCart]);

  useEffect(() => {
    const e = (venda as any)?.entrega || {};
    const rua = pickFirst(e?.endereco, e?.rua, e?.logradouro, e?.address);
    const numero = pickFirst(e?.numero, e?.number);
    const bairro = pickFirst(e?.bairro, e?.district);
    const cep = pickFirst(e?.cep, e?.zipcode, e?.zip_code);
    const cidade = pickFirst(e?.cidade, e?.city);
    const estado = pickFirst(e?.estado, e?.uf, e?.state);

    if (!rua && !numero && !bairro) return;

    setEnderecoEntrega((prev) => ({
      cep: String(pickFirst(cep, prev.cep, "") || ""),
      endereco: String(pickFirst(rua, prev.endereco, "") || ""),
      numero: String(pickFirst(numero, prev.numero, "") || ""),
      bairro: String(pickFirst(bairro, prev.bairro, "") || ""),
      cidade: String(pickFirst(cidade, prev.cidade, "São Paulo") || "São Paulo"),
      estado: String(pickFirst(estado, prev.estado, "SP") || "SP"),
      complemento: String(pickFirst(e?.complemento, prev.complemento, "") || ""),
      referencia: String(pickFirst(e?.referencia, prev.referencia, "") || ""),
    }));
  }, [venda]);

  function updateEnderecoEntrega(campo: keyof EnderecoEntrega, valor: string) {
    setEnderecoEntrega((prev) => ({ ...prev, [campo]: valor }));
  }

  useEffect(() => {
    if (cpfQS) return;
    if (onlyDigits(cpf).length === 11) return;

    const cpfPerfil = onlyDigits((profile as any)?.cpf || "");
    if (cpfPerfil.length === 11) {
      setCpf(cpfPerfil);
      return;
    }

    const cpfMeta = onlyDigits((user as any)?.user_metadata?.cpf || "");
    if (cpfMeta.length === 11) setCpf(cpfMeta);
  }, [cpfQS, cpf, profile, user]);

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
                setStatus(
                  String(parsed.json?.status || v?.status || "").toUpperCase() ||
                    null
                );
              }

              const apiCpf = onlyDigits(v?.cliente_tax_id || "");
              if (!cancelled && apiCpf.length === 11 && !cpfQS) setCpf(apiCpf);

              return;
            }
          } catch {}

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
                setStatus(
                  String(parsed2.json?.status || v?.status || "").toUpperCase() ||
                    null
                );
              }

              const apiCpf = onlyDigits(v?.cliente_tax_id || "");
              if (!cancelled && apiCpf.length === 11 && !cpfQS) setCpf(apiCpf);

              return;
            }

            if (!r2.ok && !parsed2.ok) {
              const snippet = String(parsed2.raw || "").slice(0, 140);
              throw new Error(
                `Falha ao buscar venda (HTTP ${r2.status}). Resposta: ${snippet}`
              );
            }

            if (parsed2.ok && parsed2.json && !parsed2.json?.ok) {
              throw new Error(parsed2.json?.error || "Falha ao buscar venda");
            }
          } catch (e: any) {
            if (!cancelled) setErr(String(e?.message || e));
          }
        }

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

        if (!cancelled) {
          setVenda(null);
          setDebugFonte("sem_dados");
          setErr(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, pedidoIdQS, vendaId, grupoIdQS, cpfQS]);

  const itemsBase = useMemo(() => extractItems(venda), [venda]);

  const temEnderecoCarrinho = hasEndereco(enderecoEntrega);

  const tipoEntrega = String(
    pickFirst(
      (venda as any)?.entrega?.tipo_entrega,
      (venda as any)?.tipo_entrega,
      temEnderecoCarrinho ? "entrega" : "retirada"
    ) || "retirada"
  ).toLowerCase();

  const taxaEntregaCents = useMemo(() => {
  const t = pickFirst(
    (venda as any)?.entrega?.taxa,
    (venda as any)?.taxa_entrega,
    null
  );

  const cents = centsFromMaybe(t);
  return cents > 0 ? cents : 0;
}, [venda]);

  const precisaEndereco = !tipoEntrega.includes("retirada") || taxaEntregaCents > 0;
  const enderecoCompleto = !precisaEndereco || hasEndereco(enderecoEntrega);

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
    const nomeReal = pickFirst(
      venda?.cliente_nome,
      (profile as any)?.nome,
      (user as any)?.user_metadata?.nome,
      (user as any)?.email?.split("@")?.[0],
      "Cliente"
    );

    const emailReal = pickFirst(
      venda?.cliente_email,
      (profile as any)?.email,
      (user as any)?.email,
      "cliente@iadrogarias.com"
    );

    const cpfReal = onlyDigits(
      pickFirst(
        venda?.cliente_tax_id,
        cpfQS,
        cpf,
        (profile as any)?.cpf,
        (user as any)?.user_metadata?.cpf,
        ""
      ) || ""
    );

    const phoneReal = onlyDigits(
      String(
        pickFirst(
          venda?.cliente_phone,
          (profile as any)?.telefone,
          (profile as any)?.whatsapp,
          (user as any)?.user_metadata?.telefone,
          ""
        ) || ""
      )
    );

    return {
      name: String(nomeReal || "Cliente"),
      email: String(emailReal || "cliente@iadrogarias.com"),
      tax_id: cpfReal,
      phone: phoneReal,
    };
  }, [venda, cpf, cpfQS, profile, user]);

  const pedidoId = useMemo(
    () => String(pickFirst(venda?.pedido_id, pedidoIdQS, venda?.id, "") || ""),
    [venda, pedidoIdQS]
  );

  const grupoId = useMemo(
    () => String(pickFirst(venda?.grupo_id, grupoIdQS, "") || ""),
    [venda, grupoIdQS]
  );

  async function confirmPaidBackend() {
    try {
      await fetch("/api/fv/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          pedido_id: pedidoId || null,
          grupo_id: grupoId || null,
          status: "PAID",
          endereco_entrega: precisaEndereco ? enderecoEntrega : null,
        }),
      });
    } catch {}
  }

  async function onPaid() {
    await confirmPaidBackend();
    clearPossibleCarts();

    try {
      cart?.clear?.();
    } catch {}

    try {
      sessionStorage.removeItem(`fv_checkout_${orderId}`);
      sessionStorage.removeItem("fv_checkout");
    } catch {}

    router.replace("/fv?paid=1");
  }

  function pushMetodo(next: Metodo) {
    const params = new URLSearchParams(sp.toString());
    params.set("metodo", next);
    router.replace(`/fv/checkout?${params.toString()}`);
  }

  function goIdentificacaoEntrega() {
    router.push(
      `/fv/checkout/identificacao?return=${encodeURIComponent(
        `/fv/checkout?${sp.toString()}`
      )}`
    );
  }

  const subtotalSemFrete = Math.max(0, totalCentavos - taxaEntregaCents);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white p-6 shadow-sm">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-80 animate-pulse rounded-3xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (totalCentavos <= 0 || items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-black text-slate-900">Finalizar pagamento</h1>

          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="font-black text-red-700">
              Seu pedido ficou com total zerado ou sem itens válidos.
            </div>
            <div className="mt-2 text-sm text-red-700">
              Volte ao carrinho e finalize novamente.
            </div>
          </div>

          <button
            className="mt-4 rounded-2xl bg-[#0D47A1] px-5 py-3 text-sm font-black text-white"
            onClick={() => router.push("/fv/carrinho")}
          >
            Voltar para o carrinho
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between rounded-3xl bg-white px-5 py-4 shadow-sm">
          <div>
            <h1 className="text-xl font-black text-slate-950">Finalizar pagamento</h1>
            <p className="text-xs font-semibold text-slate-500">
              Pedido seguro pela IA Drogarias
            </p>
          </div>

          <button
            onClick={() => router.push("/fv/carrinho")}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            ← Carrinho
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_370px]">
          <div className="space-y-4">
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-black text-slate-900">Identificação</h2>
                  <p className="text-xs text-slate-500">
                    Dados do cliente para emissão do pedido
                  </p>
                </div>

                <button
                  onClick={goIdentificacaoEntrega}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                >
                  Alterar
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="text-[11px] font-black uppercase text-slate-400">
                    Nome
                  </div>
                  <div className="mt-1 font-bold text-slate-800">{cliente.name}</div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="text-[11px] font-black uppercase text-slate-400">
                    E-mail
                  </div>
                  <div className="mt-1 truncate font-bold text-slate-800">
                    {cliente.email}
                  </div>
                </div>

                {cliente.phone && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="text-[11px] font-black uppercase text-slate-400">
                      WhatsApp
                    </div>
                    <div className="mt-1 font-bold text-slate-800">{cliente.phone}</div>
                  </div>
                )}
              </div>

              {metodo === "pix" && (
                <div className="mt-4">
                  <div className="mb-2 text-sm font-black text-slate-800">
                    CPF obrigatório para PIX
                  </div>

                  <input
                    value={cpf}
                    onChange={(e) => setCpf(onlyDigits(e.target.value).slice(0, 11))}
                    placeholder="Digite seu CPF"
                    inputMode="numeric"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100"
                  />

                  <div className="mt-1 text-xs text-slate-400">Somente números.</div>
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black text-slate-900">Entrega</h2>
                  <p className="text-xs text-slate-500">
                    Confira os dados antes de gerar o pagamento
                  </p>
                </div>

                <button
                  type="button"
                  onClick={goIdentificacaoEntrega}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                >
                  Alterar entrega
                </button>
              </div>

              {precisaEndereco ? (
                <>
                  <div className="mb-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <div className="text-xs font-black text-[#0D47A1]">
                      Endereço principal da sua conta ✅
                    </div>
                    <div className="mt-1 text-sm font-black text-slate-900">
                      {enderecoEntrega.endereco}, {enderecoEntrega.numero} —{" "}
                      {enderecoEntrega.bairro}
                    </div>
                    <div className="text-xs text-slate-500">
                      {enderecoEntrega.cidade} - {enderecoEntrega.estado}
                      {enderecoEntrega.cep ? ` • CEP: ${enderecoEntrega.cep}` : ""}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={enderecoEntrega.endereco}
                      onChange={(e) => updateEnderecoEntrega("endereco", e.target.value)}
                      placeholder="Endereço"
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100 sm:col-span-2"
                    />

                    <input
                      value={enderecoEntrega.numero}
                      onChange={(e) => updateEnderecoEntrega("numero", e.target.value)}
                      placeholder="Número"
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100"
                    />

                    <input
                      value={enderecoEntrega.bairro}
                      onChange={(e) => updateEnderecoEntrega("bairro", e.target.value)}
                      placeholder="Bairro"
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100"
                    />

                    <input
                      value={enderecoEntrega.cep}
                      onChange={(e) => updateEnderecoEntrega("cep", e.target.value)}
                      placeholder="CEP"
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100"
                    />

                    <input
                      value={enderecoEntrega.cidade}
                      onChange={(e) => updateEnderecoEntrega("cidade", e.target.value)}
                      placeholder="Cidade"
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100"
                    />

                    <input
                      value={enderecoEntrega.estado}
                      onChange={(e) =>
                        updateEnderecoEntrega(
                          "estado",
                          e.target.value.toUpperCase().slice(0, 2)
                        )
                      }
                      placeholder="UF"
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100"
                    />

                    <input
                      value={enderecoEntrega.complemento}
                      onChange={(e) =>
                        updateEnderecoEntrega("complemento", e.target.value)
                      }
                      placeholder="Complemento"
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                  Retirada na loja ou entrega sem necessidade de endereço adicional.
                </div>
              )}

              {!enderecoCompleto && (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-black text-amber-800">
                  Preencha endereço, número e bairro para liberar o pagamento.
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="font-black text-slate-900">Pagamento</h2>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => pushMetodo("pix")}
                  className={[
                    "rounded-2xl border px-4 py-3 text-sm font-black",
                    metodo === "pix"
                      ? "border-[#0D47A1] bg-[#0D47A1] text-white"
                      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                  ].join(" ")}
                >
                  PIX / QRCode
                </button>

                <button
                  type="button"
                  onClick={() => pushMetodo("cartao")}
                  className={[
                    "rounded-2xl border px-4 py-3 text-sm font-black",
                    metodo === "cartao"
                      ? "border-[#0D47A1] bg-[#0D47A1] text-white"
                      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                  ].join(" ")}
                >
                  Cartão
                </button>
              </div>

              <div className="mt-4">
                {enderecoCompleto ? (
                  <PagbankPayment
  metodo={metodo}
  orderId={orderId}
  cliente={{
    name: venda?.cliente_nome || cliente.name || "Cliente",
    email: venda?.cliente_email || cliente.email || "cliente@iadrogarias.com",
    tax_id:
      metodo === "pix"
        ? onlyDigits(cpf)
        : onlyDigits(venda?.cliente_tax_id || cliente.tax_id || ""),
    phone: onlyDigits(venda?.cliente_phone || cliente.phone || ""),
  }}
  items={itemsBase}
  onPaid={onPaid}
/>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-2xl bg-slate-200 px-4 py-4 text-sm font-black text-slate-500"
                  >
                    Complete o endereço para continuar
                  </button>
                )}
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-3xl bg-white p-5 shadow-sm lg:sticky lg:top-5">
            <h2 className="font-black text-slate-950">Resumo do pedido</h2>

            <div className="mt-4 max-h-[320px] space-y-3 overflow-auto pr-1">
              {itemsBase.map((it) => (
                <div
                  key={it.reference_id}
                  className="flex gap-3 rounded-2xl border border-slate-100 p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-[#0D47A1]">
                    {it.quantity}x
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-black text-slate-800">
                      {it.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Cód: {it.reference_id}
                    </div>
                  </div>

                  <div className="text-right text-sm font-black text-slate-900">
                    {brlFromCents(it.unit_amount * it.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <b>{brlFromCents(subtotalSemFrete)}</b>
              </div>

              <div className="flex justify-between text-sm text-slate-600">
                <span>Entrega</span>
                <b>
                  {taxaEntregaCents > 0
                    ? brlFromCents(taxaEntregaCents)
                    : "Grátis/Retirada"}
                </b>
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-3 text-lg font-black text-slate-950">
                <span>Total</span>
                <span className="text-[#0D47A1]">
                  {brlFromCents(totalCentavos)}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push("/fv/carrinho")}
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              ← Voltar para o carrinho
            </button>

            <button
              onClick={goIdentificacaoEntrega}
              className="mt-2 w-full rounded-2xl bg-[#0D47A1] px-4 py-3 text-sm font-black text-white hover:brightness-95"
            >
              Alterar identificação e entrega
            </button>

            {err && (
              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                {err}
              </div>
            )}

            {debugFonte && (
              <div className="mt-3 text-[10px] text-slate-300">
                Fonte: {debugFonte}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}