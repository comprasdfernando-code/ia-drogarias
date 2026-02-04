"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { brl } from "@/lib/brl";

const BASE = "/autoeletrico/ninhocar";
const WHATS = "5511948343725";

function buildWhatsAppLink(numberE164: string, msg: string) {
  const clean = numberE164.replace(/\D/g, "");
  const text = encodeURIComponent(msg);
  return `https://wa.me/${clean}?text=${text}`;
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

type Produto = {
  id: string;
  nome: string;
  slug: string;
  ean: string | null;
  estoque: number;
  preco: number;
  preco_promocional: number | null;
  em_promocao: boolean;
  categoria: string | null;
  imagens: string[] | null;
  ativo: boolean;
};

type CartItem = {
  produto_id: string;
  nome: string;
  ean: string | null;
  preco: number;
  quantidade: number;
  img: string | null;
};

function getImagemUrl(p: Produto) {
  const img = (p.imagens?.[0] || "").trim();
  if (!img) return "/placeholder-produto.png";
  try {
    return img.startsWith("http") ? encodeURI(img) : img;
  } catch {
    return img;
  }
}

export default function LojaNinhoCarPage() {
  const [tab, setTab] = useState<"conveniencia" | "servicos">("conveniencia");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savingComanda, setSavingComanda] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("ninhocar_produtos")
        .select(
          "id,nome,slug,ean,estoque,preco,preco_promocional,em_promocao,categoria,imagens,ativo"
        )
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (!mounted) return;

      if (error) {
        console.error(error.message);
        setProdutos([]);
      } else {
        setProdutos((data || []) as Produto[]);
      }
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const conveniencia = useMemo(() => {
    const qq = norm(q);
    const qDigits = onlyDigits(q);

    return produtos
      .filter((p) => {
        const cat = norm(p.categoria || "");
        const isConv =
          cat.includes("conven") || cat.includes("conveni") || cat === "conv";
        if (!isConv) return false;

        if (!qq && !qDigits) return true;

        const blob = norm(`${p.nome} ${p.categoria || ""}`);
        const eanDigits = onlyDigits(p.ean || "");
        return (
          (qq && blob.includes(qq)) || (qDigits && eanDigits.includes(qDigits))
        );
      })
      .slice(0, 120);
  }, [produtos, q]);

  function addToCart(p: Produto) {
    const precoFinal =
      p.em_promocao && p.preco_promocional
        ? Number(p.preco_promocional)
        : Number(p.preco);

    setCart((prev) => {
      const idx = prev.findIndex((i) => i.produto_id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantidade: next[idx].quantidade + 1 };
        return next;
      }
      return [
        ...prev,
        {
          produto_id: p.id,
          nome: p.nome,
          ean: p.ean,
          preco: precoFinal,
          quantidade: 1,
          img: getImagemUrl(p),
        },
      ];
    });

    setCartOpen(true);
  }

  function inc(id: string) {
    setCart((prev) =>
      prev.map((i) =>
        i.produto_id === id ? { ...i, quantidade: i.quantidade + 1 } : i
      )
    );
  }

  function dec(id: string) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.produto_id === id ? { ...i, quantidade: i.quantidade - 1 } : i
        )
        .filter((i) => i.quantidade > 0)
    );
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((i) => i.produto_id !== id));
  }

  const subtotal = useMemo(
    () => cart.reduce((acc, i) => acc + Number(i.preco) * Number(i.quantidade), 0),
    [cart]
  );

  // ✅ SALVAR COMANDA (status = "aberta") + rollback se itens falharem
  async function salvarComanda(clienteNome: string, clienteWhats: string, obs: string) {
    if (cart.length === 0) {
      alert("Carrinho vazio.");
      return;
    }

    setSavingComanda(true);

    let comandaId: string | null = null;

    try {
      const total = Number(subtotal) || 0;
      const whatsDigits = onlyDigits(clienteWhats);

      // 1) cria comanda
      const { data: cmd, error: errCmd } = await supabase
        .from("ninhocar_comandas")
        .insert([
          {
            status: "aberta", // ✅ importante: o caixa deve buscar "aberta"
            cliente_nome: (clienteNome || "").trim() || null,
            cliente_whatsapp: whatsDigits || null,
            subtotal: total,
            desconto: 0,
            total: total,
            observacao: (obs || "").trim() || null,
          },
        ])
        .select("id")
        .single();

      if (errCmd) throw new Error(errCmd.message);
      if (!cmd?.id) throw new Error("Comanda não retornou ID.");

      comandaId = cmd.id as string;

      // 2) itens
      const itensPayload = cart.map((i) => ({
        comanda_id: comandaId,
        produto_id: i.produto_id,
        nome: i.nome,
        ean: i.ean,
        preco: Number(i.preco) || 0,
        quantidade: Number(i.quantidade) || 1,
        subtotal: (Number(i.preco) || 0) * (Number(i.quantidade) || 1),
      }));

      const { error: errItens } = await supabase
        .from("ninhocar_comanda_itens")
        .insert(itensPayload);

      if (errItens) throw new Error(errItens.message);

      alert(`✅ Comanda salva! ID: ${comandaId.slice(0, 8)}...`);

      // ✅ limpa carrinho e fecha modal
      setCart([]);
      setCartOpen(false);
    } catch (e: any) {
      console.error(e);

      // rollback simples: se criou comanda, remove
      if (comandaId) {
        try {
          await supabase.from("ninhocar_comandas").delete().eq("id", comandaId);
        } catch (rbErr) {
          console.error("Rollback falhou:", rbErr);
        }
      }

      alert(`Erro ao salvar comanda: ${e?.message || "erro"}`);
    } finally {
      setSavingComanda(false);
    }
  }

  const waOrcamento = buildWhatsAppLink(
    WHATS,
    "Olá! Vim pela Loja da Ninho Car. Quero orçamento de Auto Elétrica / Som 🙂"
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/60 bg-zinc-950/85 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href={`${BASE}`} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-400 text-zinc-950 font-black flex items-center justify-center">
              NC
            </div>
            <div className="leading-tight">
              <div className="font-extrabold tracking-wide">
                NINHO <span className="text-yellow-400">CAR</span>
              </div>
              <div className="text-xs text-zinc-400">Loja & Serviços</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`${BASE}/loja/caixa`}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
            >
              Caixa
            </Link>

            <button
              onClick={() => setCartOpen(true)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
            >
              Carrinho ({cart.reduce((a, i) => a + i.quantidade, 0)})
            </button>

            <a
              href={waOrcamento}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-yellow-400 px-3 py-2 text-sm font-extrabold text-zinc-950 hover:brightness-110"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      <div
        className="pointer-events-none fixed inset-0 bg-center bg-no-repeat opacity-[0.03]"
        style={{ backgroundImage: "url('/ninhocar/logo-bg.png')", backgroundSize: "560px" }}
      />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Loja <span className="text-yellow-400">Ninho Car</span>
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Conveniência + Auto Elétrica & Som
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTab("conveniencia")}
              className={`rounded-2xl px-4 py-2 text-sm font-extrabold border ${
                tab === "conveniencia"
                  ? "bg-yellow-400 text-zinc-950 border-yellow-300"
                  : "bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              🛒 Conveniência
            </button>
            <button
              onClick={() => setTab("servicos")}
              className={`rounded-2xl px-4 py-2 text-sm font-extrabold border ${
                tab === "servicos"
                  ? "bg-yellow-400 text-zinc-950 border-yellow-300"
                  : "bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              ⚡ Serviços
            </button>
          </div>
        </div>

        {tab === "conveniencia" ? (
          <>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nome ou EAN (código de barras)"
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
                />
                <div className="mt-2 text-xs text-zinc-500">
                  Dica: cole ou digite o <b>EAN</b> para achar o produto na hora.
                </div>
              </div>
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-44 rounded-2xl border border-zinc-800 bg-zinc-900/30 animate-pulse"
                    />
                  ))}
                </div>
              ) : conveniencia.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-sm text-zinc-300">
                  Nenhum item encontrado.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {conveniencia.map((p) => {
                    const precoFinal =
                      p.em_promocao && p.preco_promocional
                        ? Number(p.preco_promocional)
                        : Number(p.preco);

                    return (
                      <div
                        key={p.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 hover:bg-zinc-900"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                          <img
                            src={getImagemUrl(p)}
                            alt={p.nome}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="mt-3">
                          <div className="line-clamp-2 text-sm font-bold">{p.nome}</div>

                          <div className="mt-2 flex items-center gap-2">
                            <div className="text-sm font-extrabold text-yellow-300">
                              {brl(precoFinal)}
                            </div>
                            {p.em_promocao && p.preco ? (
                              <div className="text-xs text-zinc-400 line-through">
                                {brl(p.preco)}
                              </div>
                            ) : null}
                          </div>

                          <button
                            onClick={() => addToCart(p)}
                            className="mt-3 w-full rounded-xl bg-yellow-400 px-3 py-2 text-center text-xs font-extrabold text-zinc-950 hover:brightness-110"
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-5">
              <h2 className="text-xl font-extrabold">⚡ Serviços de Auto Elétrica & Som</h2>
              <p className="mt-1 text-sm text-zinc-300">
                Atendimento rápido, diagnóstico e instalação com qualidade. Peça orçamento no WhatsApp.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={waOrcamento}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-extrabold text-zinc-950 hover:brightness-110"
                >
                  Pedir orçamento no WhatsApp
                </a>
                <button
                  onClick={() => setTab("conveniencia")}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800"
                >
                  Ver itens da Conveniência
                </button>
              </div>
            </div>

            <aside className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-5">
              <h3 className="text-base font-extrabold">Como funciona</h3>
              <ol className="mt-3 space-y-2 text-sm text-zinc-300">
                <li className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                  1) Você chama no WhatsApp e manda o problema.
                </li>
                <li className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                  2) Fazemos diagnóstico e passamos orçamento.
                </li>
                <li className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                  3) Serviço feito e você resolve sua vida na conveniência.
                </li>
              </ol>
            </aside>
          </section>
        )}

        <div className="mt-10">
          <Link
            href={`${BASE}`}
            className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
          >
            ← Voltar para Home
          </Link>
        </div>
      </main>

      <CartModal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        inc={inc}
        dec={dec}
        removeItem={removeItem}
        subtotal={subtotal}
        salvarComanda={salvarComanda}
        saving={savingComanda}
      />
    </div>
  );
}

function CartModal({
  open,
  onClose,
  cart,
  inc,
  dec,
  removeItem,
  subtotal,
  salvarComanda,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  inc: (id: string) => void;
  dec: (id: string) => void;
  removeItem: (id: string) => void;
  subtotal: number;
  salvarComanda: (clienteNome: string, clienteWhats: string, obs: string) => Promise<void>;
  saving: boolean;
}) {
  const [clienteNome, setClienteNome] = useState("");
  const [clienteWhats, setClienteWhats] = useState("");
  const [obs, setObs] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold">🧾 Carrinho / Comanda</div>
            <div className="text-xs text-zinc-400">
              Salva como comanda aberta para o Caixa finalizar.
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold hover:bg-zinc-800"
          >
            Fechar
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {cart.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-300">
              Carrinho vazio.
            </div>
          ) : (
            cart.map((i) => (
              <div
                key={i.produto_id}
                className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-3"
              >
                <div className="h-14 w-14 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                  <img
                    src={i.img || "/placeholder-produto.png"}
                    alt={i.nome}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1">
                  <div className="text-sm font-bold leading-tight">{i.nome}</div>
                  <div className="text-xs text-zinc-400">
                    {i.ean ? `EAN: ${i.ean}` : "Sem EAN"} • {brl(i.preco)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dec(i.produto_id)}
                    className="h-9 w-9 rounded-xl border border-zinc-800 bg-zinc-900 text-sm font-black hover:bg-zinc-800"
                  >
                    -
                  </button>
                  <div className="w-8 text-center text-sm font-extrabold">{i.quantidade}</div>
                  <button
                    onClick={() => inc(i.produto_id)}
                    className="h-9 w-9 rounded-xl border border-zinc-800 bg-zinc-900 text-sm font-black hover:bg-zinc-800"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(i.produto_id)}
                  className="rounded-xl border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-950/50"
                >
                  Remover
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="text-xs text-zinc-400">Cliente (opcional)</div>
            <input
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Nome"
              className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
            />
            <input
              value={clienteWhats}
              onChange={(e) => setClienteWhats(e.target.value)}
              placeholder="WhatsApp (opcional)"
              className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
            />
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Observação (opcional)"
              className="mt-2 w-full min-h-[90px] rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-yellow-400/60"
            />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="text-xs text-zinc-400">Resumo</div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-zinc-300">Subtotal</span>
              <span className="font-extrabold text-yellow-300">{brl(subtotal)}</span>
            </div>

            <button
              disabled={saving || cart.length === 0}
              onClick={() => salvarComanda(clienteNome, clienteWhats, obs)}
              className="mt-4 w-full rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-extrabold text-zinc-950 hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "Salvando comanda..." : "Salvar comanda (Caixa)"}
            </button>

            <button
              onClick={onClose}
              className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-sm font-bold hover:bg-zinc-900"
            >
              Continuar comprando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
