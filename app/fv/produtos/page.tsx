"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

import { CartProvider, useCart } from "../_components/cart";
import { ToastProvider, useToast } from "../_components/toast";
import FVBanners from "../_components/FVBanners";

type FVProduto = {
  id: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;
  pmc: number | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  destaque_home: boolean | null;
  ativo: boolean | null;
  imagens: string[] | null;
};

const WHATS_FV = "5511952068432";
const TAXA_ENTREGA_FIXA = 10;

const HOME_LIMIT = 2500;
const SEARCH_LIMIT = 100;
const SEARCH_DEBOUNCE = 350;

const LS_OPEN_CART = "fv_open_cart";

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcOff(pmc?: number | null, promo?: number | null) {
  const a = Number(pmc || 0);
  const b = Number(promo || 0);
  if (!a || !b || b >= a) return 0;
  return Math.round(((a - b) / a) * 100);
}

function precoFinal(p: {
  pmc?: number | null;
  em_promocao?: boolean | null;
  preco_promocional?: number | null;
  percentual_off?: number | null;
}) {
  const pmc = Number(p.pmc || 0);
  const promo = Number(p.preco_promocional || 0);
  const emPromo = !!p.em_promocao && promo > 0 && (!pmc || promo < pmc);
  const final = emPromo ? promo : pmc;
  const offFromDb = Number(p.percentual_off || 0);
  const off = emPromo ? (offFromDb > 0 ? offFromDb : calcOff(pmc, promo)) : 0;
  return { emPromo, pmc, promo, final, off };
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0 && imagens[0]) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

function waLink(phone: string, msg: string) {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function normalizeSearch(raw: string) {
  return raw
    .toLowerCase()
    .replace(/(\d+)\s*(mg|ml|mcg|g|ui|iu)/gi, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

/* ✅ WRAPPER GARANTINDO PROVIDERS */
export default function FVProdutosPage() {
  return (
    <CartProvider>
      <ToastProvider>
        <FVProdutosInner />
      </ToastProvider>
    </CartProvider>
  );
}

function FVProdutosInner() {
  const [loadingHome, setLoadingHome] = useState(true);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [busca, setBusca] = useState("");

  const [homeProdutos, setHomeProdutos] = useState<FVProduto[]>([]);
  const [resultado, setResultado] = useState<FVProduto[]>([]);

  const [cartOpen, setCartOpen] = useState(false);

  const cart = useCart();
  const totalCarrinho = cart.subtotal;
  const qtdCarrinho = cart.countItems;

  const isSearching = !!busca.trim();

  // ✅ abrir carrinho automaticamente quando vier do botão "Comprar"
  useEffect(() => {
    const flag = typeof window !== "undefined" ? localStorage.getItem(LS_OPEN_CART) : null;
    if (flag === "1") {
      localStorage.removeItem(LS_OPEN_CART);
      setCartOpen(true);
    }
  }, []);

  useEffect(() => {
    async function loadHome() {
      try {
        setLoadingHome(true);
        const { data, error } = await supabase
          .from("fv_produtos")
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens"
          )
          .eq("ativo", true)
          .limit(HOME_LIMIT);

        if (error) throw error;

        const arr = (data || []) as FVProduto[];
        arr.sort((a, b) => {
          const da = a.destaque_home ? 1 : 0;
          const db = b.destaque_home ? 1 : 0;
          if (db !== da) return db - da;

          const pa = a.em_promocao ? 1 : 0;
          const pb = b.em_promocao ? 1 : 0;
          if (pb !== pa) return pb - pa;

          const ca = (a.categoria || "Outros").toLowerCase();
          const cb = (b.categoria || "Outros").toLowerCase();
          const ccmp = ca.localeCompare(cb);
          if (ccmp !== 0) return ccmp;

          return (a.nome || "").localeCompare(b.nome || "");
        });

        setHomeProdutos(arr);
      } catch (e) {
        console.error("Erro loadHome:", e);
        setHomeProdutos([]);
      } finally {
        setLoadingHome(false);
      }
    }
    loadHome();
  }, []);

  useEffect(() => {
    async function search() {
      const raw = busca.trim();
      if (!raw) {
        setResultado([]);
        return;
      }

      setLoadingBusca(true);

      try {
        const normalized = normalizeSearch(raw);
        const { data, error } = await supabase.rpc("fv_search_produtos", { q: normalized, lim: SEARCH_LIMIT });
        if (error) throw error;
        setResultado(((data || []) as FVProduto[]) ?? []);
      } catch (e) {
        console.error("Erro search (RPC):", e);

        // fallback simples
        try {
          const digits = onlyDigits(raw);
          let query = supabase
            .from("fv_produtos")
            .select(
              "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens"
            )
            .eq("ativo", true)
            .limit(SEARCH_LIMIT);

          if (digits.length >= 8 && digits.length <= 14) query = query.or(`ean.eq.${digits},nome.ilike.%${raw}%`);
          else query = query.ilike("nome", `%${raw}%`);

          const { data, error } = await query;
          if (error) throw error;

          const ordered = ((data || []) as FVProduto[]).sort((a, b) => {
            const pa = a.em_promocao ? 1 : 0;
            const pb = b.em_promocao ? 1 : 0;
            if (pb !== pa) return pb - pa;
            return (a.nome || "").localeCompare(b.nome || "");
          });

          setResultado(ordered);
        } catch (e2) {
          console.error("Erro fallback search:", e2);
          setResultado([]);
        }
      } finally {
        setLoadingBusca(false);
      }
    }

    const timer = setTimeout(search, SEARCH_DEBOUNCE);
    return () => clearTimeout(timer);
  }, [busca]);

  const categoriasHome = useMemo(() => {
    if (busca.trim()) return [];
    const map = new Map<string, FVProduto[]>();
    for (const p of homeProdutos) {
      const cat = (p.categoria || "Outros").trim() || "Outros";
      if (!map.has(cat)) map.set(cat, []);
      const arr = map.get(cat)!;
      if (arr.length < 6) arr.push(p);
    }
    return Array.from(map.entries()).slice(0, 6);
  }, [homeProdutos, busca]);

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-40 bg-blue-700 shadow">
        <div className="mx-auto max-w-6xl px-4 py-3">
          {/* MOBILE */}
          <div className="flex items-center justify-between gap-3 md:hidden">
            <div className="text-white font-extrabold whitespace-nowrap">
              IA Drogarias <span className="opacity-80">• FV</span>
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className="relative text-white font-extrabold whitespace-nowrap bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full"
              title="Abrir carrinho"
            >
              🛒 {brl(totalCarrinho)}
              {qtdCarrinho > 0 && (
                <span className="absolute -top-2 -right-2 h-6 min-w-[24px] px-1 rounded-full bg-green-400 text-blue-900 text-xs font-extrabold flex items-center justify-center border-2 border-blue-700">
                  {qtdCarrinho}
                </span>
              )}
            </button>
          </div>

          <div className="mt-3 md:hidden">
            <div className="relative">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite o nome do medicamento ou EAN..."
                className="w-full rounded-full bg-white/95 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-white/20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {busca.trim() ? (
                  <button
                    onClick={() => setBusca("")}
                    className="text-xs font-extrabold px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                    title="Limpar"
                  >
                    Limpar
                  </button>
                ) : null}
                <span className="text-blue-900 bg-green-400/90 px-2 py-1 rounded-full text-xs font-extrabold">🔎</span>
              </div>
            </div>

            {isSearching && (
              <div className="mt-1 text-[11px] text-white/80">
                {loadingBusca ? "Buscando…" : resultado.length ? `${resultado.length} resultado(s)` : " "}
              </div>
            )}
          </div>

          {/* DESKTOP */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-white font-extrabold whitespace-nowrap">
              IA Drogarias <span className="opacity-80">• FV</span>
            </div>

            <div className="flex-1">
              <div className="relative">
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Digite o nome do medicamento ou EAN..."
                  className="w-full rounded-full bg-white/95 px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-white/20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {busca.trim() ? (
                    <button
                      onClick={() => setBusca("")}
                      className="text-xs font-extrabold px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                      title="Limpar"
                    >
                      Limpar
                    </button>
                  ) : null}
                  <span className="text-blue-900 bg-green-400/90 px-2 py-1 rounded-full text-xs font-extrabold">🔎</span>
                </div>
              </div>

              {isSearching && (
                <div className="mt-1 text-[11px] text-white/80">
                  {loadingBusca ? "Buscando…" : resultado.length ? `${resultado.length} resultado(s)` : " "}
                </div>
              )}
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className="relative text-white font-extrabold hookup whitespace-nowrap bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full"
              title="Abrir carrinho"
            >
              🛒 <span className="hidden lg:inline">Carrinho • </span>
              {brl(totalCarrinho)}
              {qtdCarrinho > 0 && (
                <span className="absolute -top-2 -right-2 h-6 min-w-[24px] px-1 rounded-full bg-green-400 text-blue-900 text-xs font-extrabold flex items-center justify-center border-2 border-blue-700">
                  {qtdCarrinho}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="mt-4">
        <FVBanners />
      </div>

      <section className="max-w-6xl mx-auto px-4">
        {isSearching ? (
          <div className="mt-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">
              Resultados <span className="text-gray-500">({resultado.length})</span>
            </h2>

            {loadingBusca ? (
              <GridSkeleton />
            ) : resultado.length === 0 ? (
              <div className="bg-white border rounded-2xl p-6 text-gray-600">Nenhum produto encontrado.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
                {resultado.map((p) => (
                  <ProdutoCardUltra key={p.id} p={p} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {loadingHome ? (
              <GridSkeleton />
            ) : (
              categoriasHome.map(([cat, itens]) => (
                <div key={cat}>
                  <div className="flex justify-end mb-2">
                    <Link href={`/fv/categoria/${encodeURIComponent(cat)}`} className="text-sm text-blue-700 hover:underline">
                      Ver todos →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
                    {itens.map((p) => (
                      <ProdutoCardUltra key={p.id} p={p} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-12 pb-12">
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <h3 className="text-xl md:text-2xl font-extrabold text-gray-900">Compra rápida</h3>
          <p className="text-gray-600 mt-1">Adicione no carrinho e finalize no WhatsApp em poucos cliques.</p>
        </div>
      </section>

      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} />
    </main>
  );
}

/* ✅ MODAL COMPLETO (DADOS + ENTREGA/RETIRADA + PAGAMENTO + TOTAL) */
function CartModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cart = useCart();

  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [tipoEntrega, setTipoEntrega] = useState<"ENTREGA" | "RETIRADA">("ENTREGA");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");

  const [pagamento, setPagamento] = useState<"PIX" | "CARTAO" | "DINHEIRO" | "COMBINAR">("PIX");

  const taxaEntrega = tipoEntrega === "ENTREGA" ? TAXA_ENTREGA_FIXA : 0;
  const total = cart.subtotal + taxaEntrega;

  const canCheckout = useMemo(() => {
    if (!cart.items.length) return false;
    if (!clienteNome.trim()) return false;
    if (onlyDigits(clienteTelefone).length < 10) return false;
    if (tipoEntrega === "ENTREGA") {
      if (!endereco.trim() || !numero.trim() || !bairro.trim()) return false;
    }
    return true;
  }, [cart.items.length, clienteNome, clienteTelefone, tipoEntrega, endereco, numero, bairro]);

  const mensagem = useMemo(() => {
    let msg = `🧾 *Pedido Farmácia Virtual*\n\n`;
    msg += `👤 Cliente: ${clienteNome || "-"}\n`;
    msg += `📞 WhatsApp: ${clienteTelefone || "-"}\n\n`;

    msg +=
      tipoEntrega === "ENTREGA"
        ? `🚚 *Entrega*\n${endereco || "-"}, ${numero || "-"} - ${bairro || "-"}\nTaxa: ${brl(taxaEntrega)}\n\n`
        : `🏪 *Retirada na loja*\n\n`;

    msg += `💳 Pagamento: ${pagamento}\n\n🛒 *Itens:*\n`;
    cart.items.forEach((i) => {
      msg += `• ${i.nome} (${i.ean}) — ${i.qtd}x — ${brl(i.preco * i.qtd)}\n`;
    });

    msg += `\nSubtotal: ${brl(cart.subtotal)}\n`;
    msg += `Total: ${brl(total)}\n\n`;
    msg += `Pode confirmar disponibilidade e prazo?`;

    return msg;
  }, [cart.items, cart.subtotal, clienteNome, clienteTelefone, tipoEntrega, endereco, numero, bairro, pagamento, taxaEntrega, total]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-2xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-extrabold text-lg">🛒 Seu carrinho</div>
          <button onClick={onClose} className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold">
            Continuar comprando
          </button>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          {cart.items.length === 0 ? (
            <div className="text-gray-600 bg-gray-50 border rounded-2xl p-4">Seu carrinho está vazio. Adicione itens 😊</div>
          ) : (
            <div className="space-y-3">
              {cart.items.map((it) => (
                <div key={it.ean} className="border rounded-2xl p-3 flex gap-3">
                  <div className="h-14 w-14 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                    <Image src={it.imagem || "/produtos/caixa-padrao.png"} alt={it.nome} width={64} height={64} className="object-contain" />
                  </div>

                  <div className="flex-1">
                    <div className="font-extrabold text-sm line-clamp-2">{it.nome}</div>
                    <div className="text-xs text-gray-500">EAN: {it.ean}</div>
                    <div className="mt-1 font-extrabold text-blue-900">{brl(it.preco)}</div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center border rounded-xl overflow-hidden">
                        <button onClick={() => cart.dec(it.ean)} className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold">
                          –
                        </button>
                        <div className="w-10 text-center font-extrabold text-sm">{it.qtd}</div>
                        <button onClick={() => cart.inc(it.ean)} className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold">
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => cart.remove(it.ean)}
                        className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-extrabold ml-auto"
                        title="Remover item"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="mt-2 font-extrabold text-blue-900">Total item: {brl(it.preco * it.qtd)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DADOS */}
          <div className="mt-6 bg-gray-50 border rounded-2xl p-4">
            <div className="font-extrabold text-gray-900">Dados</div>

            <div className="mt-3 space-y-2">
              <input
                placeholder="Nome do cliente"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="w-full border bg-white p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
              />

              <input
                placeholder="WhatsApp com DDD (ex: 11999999999)"
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                className="w-full border bg-white p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* ENTREGA */}
          <div className="mt-4 bg-gray-50 border rounded-2xl p-4">
            <div className="font-extrabold text-gray-900">Entrega</div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setTipoEntrega("ENTREGA")}
                className={`px-3 py-2 rounded-xl flex-1 font-extrabold ${
                  tipoEntrega === "ENTREGA" ? "bg-blue-700 text-white" : "bg-white border"
                }`}
              >
                Entrega
              </button>

              <button
                onClick={() => setTipoEntrega("RETIRADA")}
                className={`px-3 py-2 rounded-xl flex-1 font-extrabold ${
                  tipoEntrega === "RETIRADA" ? "bg-blue-700 text-white" : "bg-white border"
                }`}
              >
                Retirada
              </button>
            </div>

            {tipoEntrega === "ENTREGA" ? (
              <div className="mt-3 space-y-2">
                <input
                  placeholder="Endereço"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full border bg-white p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
                />
                <div className="flex gap-2">
                  <input
                    placeholder="Número"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="w-full border bg-white p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
                  />
                  <input
                    placeholder="Bairro"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full border bg-white p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="text-sm font-extrabold text-blue-900">Taxa fixa: {brl(taxaEntrega)}</div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-gray-700">Você poderá retirar na loja após confirmação.</div>
            )}
          </div>

          {/* PAGAMENTO */}
          <div className="mt-4 bg-gray-50 border rounded-2xl p-4">
            <div className="font-extrabold text-gray-900">Pagamento</div>

            <div className="mt-3 flex flex-wrap gap-2">
              {["PIX", "CARTAO", "DINHEIRO", "COMBINAR"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPagamento(p as any)}
                  className={`px-3 py-2 rounded-xl font-extrabold ${pagamento === p ? "bg-blue-700 text-white" : "bg-white border"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TOTAL + FINALIZAR */}
        <div className="p-4 border-t">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <b className="text-gray-900">{brl(cart.subtotal)}</b>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Taxa</span>
              <b className="text-gray-900">{brl(taxaEntrega)}</b>
            </div>
            <div className="flex items-center justify-between text-lg font-extrabold">
              <span>Total</span>
              <span className="text-blue-900">{brl(total)}</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => cart.clear()}
              className="px-4 py-3 rounded-2xl border bg-white hover:bg-gray-50 font-extrabold"
              disabled={!cart.items.length}
            >
              Limpar
            </button>

            <a
              className={`px-4 py-3 rounded-2xl font-extrabold text-center ${
                canCheckout ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-200 text-gray-500 pointer-events-none"
              }`}
              href={waLink(WHATS_FV, mensagem)}
              target="_blank"
              rel="noreferrer"
              title={canCheckout ? "Finalizar no WhatsApp" : "Preencha nome/Whats e itens (e endereço se entrega)."}
            >
              Finalizar
            </a>
          </div>

          {!canCheckout ? (
            <div className="mt-2 text-xs text-gray-500">
              Para liberar: informe <b>Nome</b> e <b>Whats</b>. Se escolher <b>Entrega</b>, preencha <b>Endereço/Número/Bairro</b>.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProdutoCardUltra({ p }: { p: FVProduto }) {
  const pr = precoFinal(p);
  const { addItem } = useCart();
  const { push } = useToast();
  const [qtd, setQtd] = useState(1);

  function add() {
    const q = Math.max(1, Math.floor(Number(qtd || 1)));

    addItem(
      {
        ean: p.ean,
        nome: p.nome,
        laboratorio: p.laboratorio,
        apresentacao: p.apresentacao,
        imagem: firstImg(p.imagens),
        preco: pr.final || 0,
      },
      q
    );

    push({ title: "Adicionado ao carrinho ✅", desc: `${p.nome} • ${q}x` });
    setQtd(1);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      <div className="relative p-3">
        <Link
          href={`/fv/produtos/${encodeURIComponent(p.ean)}`}
          className="bg-gray-50 rounded-xl p-2 flex items-center justify-center hover:opacity-95 transition"
        >
          <Image src={firstImg(p.imagens)} alt={p.nome || "Produto"} width={240} height={240} className="rounded object-contain h-24 sm:h-28" />
        </Link>

        {pr.emPromo && pr.off > 0 && (
          <span className="absolute top-3 right-3 text-[11px] font-extrabold bg-red-600 text-white px-2 py-1 rounded-full shadow-sm">
            {pr.off}% OFF
          </span>
        )}
      </div>

      <div className="px-3 pb-3 flex-1 flex flex-col">
        <div className="text-[11px] text-gray-500 line-clamp-1">{p.laboratorio || "—"}</div>

        <Link href={`/fv/produtos/${encodeURIComponent(p.ean)}`} className="mt-1 font-semibold text-blue-950 text-xs sm:text-sm line-clamp-2 hover:underline">
          {p.nome}
        </Link>

        {p.apresentacao && <div className="text-[11px] text-gray-600 mt-1 line-clamp-1">{p.apresentacao}</div>}

        <div className="mt-2">
          {pr.emPromo ? (
            <>
              <div className="text-xs text-gray-500">
                De <span className="line-through">{brl(pr.pmc)}</span>
              </div>
              <div className="text-base font-extrabold text-blue-900">Por {brl(pr.final)}</div>
            </>
          ) : (
            <div className="text-base font-extrabold text-blue-900">{brl(pr.final)}</div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center border rounded-xl overflow-hidden">
            <button onClick={() => setQtd((x) => Math.max(1, x - 1))} className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold">
              –
            </button>
            <div className="w-10 text-center font-extrabold text-sm">{qtd}</div>
            <button onClick={() => setQtd((x) => x + 1)} className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold">
              +
            </button>
          </div>

          <button onClick={add} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-xs sm:text-sm font-extrabold">
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-3">
            <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          </div>
          <div className="px-3 pb-3">
            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
            <div className="mt-2 h-4 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="mt-2 h-4 w-28 bg-gray-100 rounded animate-pulse" />
            <div className="mt-3 h-10 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
