"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

import { useCart } from "./_components/cart";
import { useToast } from "./_components/toast";
import FVBanners from "./_components/FVBanners";

/* =========================
   CONFIG DRF
========================= */
const LOJA_SLUG = "drogariaredefabiano";
const PREFIX = "/drogarias/drogariaredefabiano";
const WHATS_DRF = "5511952068432";

// VIEW loja x catálogo
const VIEW_LOJA = "fv_produtos_loja_view";

const HOME_LIMIT = 150;
const SEARCH_LIMIT = 180;
const SEARCH_DEBOUNCE = 350;

type DRFProdutoView = {
  produto_id: string;
  farmacia_slug: string;

  ean: string;
  nome: string;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;
  imagens: any; // jsonb pode vir array/string

  // catálogo (✅ agora existe na view pelo SQL acima)
  pmc: number | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;

  // loja
  estoque: number | null;
  preco_venda: number | null;
  disponivel_farmacia: boolean | null;
};

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

function waLink(phone: string, msg: string) {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

/** blindagem: jsonb pode vir array, string JSON, etc */
function normalizeImgs(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);

  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {}
  }

  // jsonb object -> values
  if (v && typeof v === "object") {
    const vals = Object.values(v).map(String).filter(Boolean);
    return vals;
  }

  return [];
}

function firstImg(imagens?: any) {
  const arr = normalizeImgs(imagens);
  if (arr.length > 0 && arr[0]) return arr[0];
  return "/produtos/caixa-padrao.png";
}

/**
 * ✅ mesma lógica do PDV:
 * 1) se loja tem preco_venda > 0, usa
 * 2) senão, se em promoção e promo válida (promo > 0 e (pmc==0/null ou promo < pmc)), usa promo
 * 3) senão usa pmc
 */
function precoFinal(p: DRFProdutoView) {
  const loja = Number(p.preco_venda || 0);

  const pmc = Number(p.pmc || 0);
  const promo = Number(p.preco_promocional || 0);

  const emPromo = !!p.em_promocao && promo > 0 && (!pmc || promo < pmc);
  const final = loja > 0 ? loja : emPromo ? promo : pmc;

  const off = Number(p.percentual_off || 0);
  return { final: Number(final || 0), emPromo, off };
}

export default function DrogariaRedeFabianoHome() {
  const openedByQueryRef = useRef(false);

  const [loadingHome, setLoadingHome] = useState(true);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [busca, setBusca] = useState("");

  const [homeProdutos, setHomeProdutos] = useState<DRFProdutoView[]>([]);
  const [resultado, setResultado] = useState<DRFProdutoView[]>([]);

  const [cartOpen, setCartOpen] = useState(false);
  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);

  const cart = useCart();
  const totalCarrinho = cart.subtotal;
  const qtdCarrinho = cart.countItems;

  const isSearching = !!busca.trim();

  const estoqueByEan = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of homeProdutos) m.set(p.ean, Number(p.estoque ?? 0));
    for (const p of resultado) m.set(p.ean, Number(p.estoque ?? 0));
    return m;
  }, [homeProdutos, resultado]);

  // ✅ ABRIR CARRINHO QUANDO VIER ?openCart=1
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (openedByQueryRef.current) return;

    const sp = new URLSearchParams(window.location.search);
    const v = sp.get("openCart");

    if (v === "1") {
      openedByQueryRef.current = true;
      setCartOpen(true);

      sp.delete("openCart");
      const newQs = sp.toString();
      const newUrl = window.location.pathname + (newQs ? `?${newQs}` : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // HOME
  useEffect(() => {
    async function loadHome() {
      try {
        setLoadingHome(true);

        const { data, error } = await supabase
          .from(VIEW_LOJA)
          .select(
            "produto_id,farmacia_slug,ean,nome,laboratorio,categoria,apresentacao,imagens,pmc,estoque,preco_venda,disponivel_farmacia,em_promocao,preco_promocional,percentual_off"
          )
          .eq("farmacia_slug", LOJA_SLUG)
          .eq("disponivel_farmacia", true)
          .gt("estoque", 0)
          .order("em_promocao", { ascending: false })
          .order("estoque", { ascending: false })
          .order("nome", { ascending: true })
          .limit(HOME_LIMIT);

        if (error) throw error;

        setHomeProdutos(((data || []) as DRFProdutoView[]) ?? []);
      } catch (e) {
        console.error("Erro loadHome DRF:", e);
        setHomeProdutos([]);
      } finally {
        setLoadingHome(false);
      }
    }

    loadHome();
  }, []);

  // SEARCH
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
        const digits = onlyDigits(normalized);

        let q = supabase
          .from(VIEW_LOJA)
          .select(
            "produto_id,farmacia_slug,ean,nome,laboratorio,categoria,apresentacao,imagens,pmc,estoque,preco_venda,disponivel_farmacia,em_promocao,preco_promocional,percentual_off"
          )
          .eq("farmacia_slug", LOJA_SLUG)
          .eq("disponivel_farmacia", true)
          .limit(SEARCH_LIMIT);

        if (digits.length >= 8 && digits.length <= 14) q = q.or(`ean.eq.${digits},nome.ilike.%${raw}%`);
        else q = q.ilike("nome", `%${raw}%`);

        const { data, error } = await q
          .order("em_promocao", { ascending: false })
          .order("estoque", { ascending: false })
          .order("nome", { ascending: true });

        if (error) throw error;

        setResultado(((data || []) as DRFProdutoView[]) ?? []);
      } catch (e) {
        console.error("Erro search DRF:", e);
        setResultado([]);
      } finally {
        setLoadingBusca(false);
      }
    }

    const timer = setTimeout(search, SEARCH_DEBOUNCE);
    return () => clearTimeout(timer);
  }, [busca]);

  function encomendarDRF(p: DRFProdutoView) {
    const msg =
      `Olá! Quero encomendar este item:\n\n` +
      `• ${p.nome} (EAN: ${p.ean})\n` +
      (p.apresentacao ? `• Apresentação: ${p.apresentacao}\n` : "") +
      (p.laboratorio ? `• Laboratório: ${p.laboratorio}\n` : "") +
      `\nPode me avisar prazo e valor?`;

    window.open(waLink(WHATS_DRF, msg), "_blank");
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-40 bg-blue-700 shadow">
        <div className="mx-auto max-w-6xl px-4 py-3">
          {/* MOBILE */}
          <div className="flex items-center justify-between gap-3 md:hidden">
            <div className="text-white font-extrabold whitespace-nowrap">Drogaria • Rede Fabiano</div>

            <div className="flex items-center gap-2">
              <button
                onClick={openCart}
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
          </div>

          <div className="mt-3 md:hidden">
            <div className="relative">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite o nome do produto ou EAN..."
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
                <span className="text-blue-900 bg-green-400/90 px-2 py-1 rounded-full text-xs font-extrabold">
                  🔎
                </span>
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
            <div className="text-white font-extrabold whitespace-nowrap">Drogaria • Rede Fabiano</div>

            <div className="flex-1">
              <div className="relative">
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Digite o nome do produto ou EAN..."
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
                  <span className="text-blue-900 bg-green-400/90 px-2 py-1 rounded-full text-xs font-extrabold">
                    🔎
                  </span>
                </div>
              </div>

              {isSearching && (
                <div className="mt-1 text-[11px] text-white/80">
                  {loadingBusca ? "Buscando…" : resultado.length ? `${resultado.length} resultado(s)` : " "}
                </div>
              )}
            </div>

            <button
              onClick={openCart}
              className="relative text-white font-extrabold whitespace-nowrap bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full"
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
                  <ProdutoCardUltra
                    key={p.produto_id}
                    p={p}
                    prefix={PREFIX}
                    onEncomendar={() => encomendarDRF(p)}
                    estoqueByEan={estoqueByEan}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8">
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">
              Produtos disponíveis <span className="text-gray-500">({homeProdutos.length})</span>
            </h2>

            {loadingHome ? (
              <GridSkeleton />
            ) : homeProdutos.length === 0 ? (
              <div className="bg-white border rounded-2xl p-6 text-gray-600">
                Nenhum produto com estoque disponível no momento.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
                {homeProdutos.map((p) => (
                  <ProdutoCardUltra
                    key={p.produto_id}
                    p={p}
                    prefix={PREFIX}
                    onEncomendar={() => encomendarDRF(p)}
                    estoqueByEan={estoqueByEan}
                  />
                ))}
              </div>
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

      <CartModal open={cartOpen} onClose={closeCart} estoqueByEan={estoqueByEan} />
    </main>
  );
}

/* =========================
   CART MODAL (Finaliza no Supabase - drf_pedidos)
========================= */
function CartModal({
  open,
  onClose,
  estoqueByEan,
}: {
  open: boolean;
  onClose: () => void;
  estoqueByEan: Map<string, number>;
}) {
  const cart = useCart();
  const { push } = useToast();

  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [tipoEntrega, setTipoEntrega] = useState<"ENTREGA" | "RETIRADA">("ENTREGA");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");

  const [pagamento, setPagamento] = useState<"PIX" | "CARTAO" | "DINHEIRO" | "COMBINAR">("PIX");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pedidoId, setPedidoId] = useState<string | null>(null);

  const taxaEntrega = tipoEntrega === "ENTREGA" ? 10 : 0;
  const total = cart.subtotal + taxaEntrega;

  function onlyDigitsLocal(s: string) {
    return (s || "").replace(/\D/g, "");
  }

  const canCheckout = useMemo(() => {
    if (cart.items.length === 0) return false;
    if (!clienteNome.trim()) return false;
    if (onlyDigitsLocal(clienteTelefone).length < 10) return false;
    if (tipoEntrega === "ENTREGA") {
      if (!endereco.trim() || !numero.trim() || !bairro.trim()) return false;
    }
    return true;
  }, [cart.items.length, clienteNome, clienteTelefone, tipoEntrega, endereco, numero, bairro]);

  function incSafe(ean: string) {
    const est = Number(estoqueByEan.get(ean) ?? 0);
    const it = cart.items.find((x) => x.ean === ean);
    if (!it) return;
    if (est > 0 && it.qtd >= est) return;
    cart.inc(ean);
  }

  function setQtdSafe(ean: string, qtd: number) {
    const est = Number(estoqueByEan.get(ean) ?? 0);
    const alvo = Math.max(1, Math.floor(Number(qtd || 1)));
    const final = est > 0 ? Math.min(alvo, est) : alvo;

    const it = cart.items.find((x) => x.ean === ean);
    if (!it) return;

    if (final > it.qtd) for (let i = 0; i < final - it.qtd; i++) incSafe(ean);
    if (final < it.qtd) for (let i = 0; i < it.qtd - final; i++) cart.dec(ean);
  }

  function clearCartSafe() {
    const anyCart = cart as any;
    if (typeof anyCart.clear === "function") {
      anyCart.clear();
      return;
    }
    cart.items.forEach((i) => cart.remove(i.ean));
  }

  async function finalizarPedido() {
    if (!canCheckout || submitting) return;

    try {
      setSubmitting(true);

      const itens = cart.items.map((i) => ({
        ean: i.ean,
        nome: i.nome,
        qtd: i.qtd,
        preco_unit: Number(i.preco || 0),
        total_item: Number((i.preco || 0) * i.qtd),
        imagem: i.imagem || null,
      }));

      const payload = {
        status: "NOVO",
        canal: "FV",
        comanda: null,

        cliente_nome: clienteNome.trim(),
        cliente_whatsapp: onlyDigitsLocal(clienteTelefone),

        tipo_entrega: tipoEntrega,
        endereco: tipoEntrega === "ENTREGA" ? endereco.trim() : null,
        numero: tipoEntrega === "ENTREGA" ? numero.trim() : null,
        bairro: tipoEntrega === "ENTREGA" ? bairro.trim() : null,

        pagamento,

        taxa_entrega: Number(taxaEntrega.toFixed(2)),
        subtotal: Number(Number(cart.subtotal || 0).toFixed(2)),
        total: Number(Number(total || 0).toFixed(2)),

        itens,
      };

      const { data, error } = await supabase.from("drf_pedidos").insert(payload).select("id").single();
      if (error) throw error;

      setPedidoId(data?.id || null);
      setSuccess(true);
      clearCartSafe();

      push({ title: "Pedido enviado ✅", desc: "Seu pedido foi registrado com sucesso." });
    } catch (e: any) {
      console.error("Erro ao finalizar pedido:", e);
      push({
        title: "Falha ao enviar 😕",
        desc: e?.message ? String(e.message) : "Tente novamente.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function fecharTudo() {
    setSuccess(false);
    setPedidoId(null);
    setSubmitting(false);
    onClose();
  }

  useEffect(() => {
    if (!open) {
      setSuccess(false);
      setPedidoId(null);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={success ? fecharTudo : onClose} />

      <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white p-4 overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{success ? "Pedido enviado" : "Carrinho"}</h2>

          <button onClick={success ? fecharTudo : onClose} className="px-3 py-2 rounded-xl border font-extrabold">
            {success ? "Fechar" : "Continuar comprando"}
          </button>
        </div>

        {success ? (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="text-lg font-extrabold text-green-800">✅ Pedido enviado com sucesso!</div>
            <div className="mt-2 text-sm text-green-900">
              {pedidoId ? (
                <>
                  Número do pedido: <b className="break-all">{pedidoId}</b>
                </>
              ) : (
                "Pedido registrado."
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  if (pedidoId) navigator.clipboard?.writeText(pedidoId);
                  push({ title: "Copiado ✅", desc: "ID do pedido copiado." });
                }}
                className="flex-1 py-3 rounded-xl font-extrabold bg-white border hover:bg-gray-50"
                disabled={!pedidoId}
              >
                Copiar ID
              </button>

              <button
                onClick={fecharTudo}
                className="flex-1 py-3 rounded-xl font-extrabold bg-blue-700 hover:bg-blue-800 text-white"
              >
                OK
              </button>
            </div>
          </div>
        ) : null}

        {!success ? (
          <>
            <div className="mt-4">
              {cart.items.length === 0 ? (
                <div className="text-gray-600 bg-gray-50 border rounded-2xl p-4">Seu carrinho está vazio.</div>
              ) : (
                cart.items.map((it) => {
                  const est = Number(estoqueByEan.get(it.ean) ?? 0);
                  const max = Math.max(1, est || 1);
                  const travado = est > 0 ? Math.min(it.qtd, est) : it.qtd;

                  return (
                    <div key={it.ean} className="border rounded-2xl p-3 mb-2">
                      <div className="flex gap-3">
                        <div className="h-14 w-14 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                          <Image
                            src={it.imagem || "/produtos/caixa-padrao.png"}
                            alt={it.nome}
                            width={64}
                            height={64}
                            className="object-contain"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="font-extrabold">{it.nome}</div>
                          <div className="text-xs text-gray-500">EAN: {it.ean}</div>

                          <div className="mt-1 text-sm font-extrabold text-blue-900">{brl(it.preco)}</div>

                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => cart.dec(it.ean)}
                              className="px-3 py-1 bg-gray-200 rounded font-extrabold"
                              disabled={submitting}
                            >
                              -
                            </button>

                            <input
                              type="number"
                              min={1}
                              max={max}
                              value={travado}
                              onChange={(e) => setQtdSafe(it.ean, Number(e.target.value))}
                              className="w-16 border rounded px-2 py-1 text-center font-extrabold"
                              disabled={submitting}
                            />

                            <button
                              onClick={() => incSafe(it.ean)}
                              disabled={submitting || (est > 0 ? it.qtd >= est : false)}
                              className={`px-3 py-1 rounded font-extrabold ${
                                est > 0 && it.qtd >= est
                                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                  : "bg-blue-600 text-white"
                              }`}
                            >
                              +
                            </button>

                            <button
                              onClick={() => cart.remove(it.ean)}
                              className="ml-auto text-red-600 font-extrabold"
                              disabled={submitting}
                            >
                              Excluir
                            </button>
                          </div>

                          <div className="mt-2 text-xs text-gray-600">
                            {est > 0 ? (
                              <span>
                                Disponível: <b>{est}</b>
                              </span>
                            ) : (
                              <span className="text-red-600 font-bold">Atenção: estoque não encontrado (0)</span>
                            )}
                          </div>

                          <div className="mt-2 font-extrabold text-blue-900">Total item: {brl(it.preco * it.qtd)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 space-y-2">
              <input
                placeholder="Nome do cliente"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="w-full border p-2 rounded"
                disabled={submitting}
              />
              <input
                placeholder="WhatsApp"
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                className="w-full border p-2 rounded"
                disabled={submitting}
              />
              <div className="text-[11px] text-gray-500">Dica: informe com DDD (ex: 11999999999)</div>
            </div>

            <div className="mt-4">
              <div className="font-bold mb-2">Entrega</div>

              <div className="flex gap-2">
                <button
                  onClick={() => setTipoEntrega("ENTREGA")}
                  className={`px-3 py-2 rounded flex-1 ${
                    tipoEntrega === "ENTREGA" ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}
                  disabled={submitting}
                >
                  Entrega
                </button>

                <button
                  onClick={() => setTipoEntrega("RETIRADA")}
                  className={`px-3 py-2 rounded flex-1 ${
                    tipoEntrega === "RETIRADA" ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}
                  disabled={submitting}
                >
                  Retirada
                </button>
              </div>

              {tipoEntrega === "ENTREGA" && (
                <div className="mt-3 space-y-2">
                  <input
                    placeholder="Endereço"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="w-full border p-2 rounded"
                    disabled={submitting}
                  />
                  <input
                    placeholder="Número"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="w-full border p-2 rounded"
                    disabled={submitting}
                  />
                  <input
                    placeholder="Bairro"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full border p-2 rounded"
                    disabled={submitting}
                  />
                  <div className="text-sm font-bold">Taxa fixa: {brl(taxaEntrega)}</div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="font-bold mb-2">Pagamento</div>

              <div className="flex flex-wrap gap-2">
                {(["PIX", "CARTAO", "DINHEIRO", "COMBINAR"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPagamento(p)}
                    className={`px-3 py-2 rounded ${pagamento === p ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                    disabled={submitting}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t pt-3">
              <div>Subtotal: {brl(cart.subtotal)}</div>
              <div>Taxa: {brl(taxaEntrega)}</div>
              <div className="font-extrabold text-lg">Total: {brl(total)}</div>
            </div>

            <button
              disabled={!canCheckout || submitting}
              onClick={finalizarPedido}
              className={`w-full mt-4 text-center py-3 rounded-xl font-extrabold ${
                canCheckout && !submitting ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-200 text-gray-500"
              }`}
              title={canCheckout ? "Finalizar pedido" : "Preencha nome/Whats e itens (e endereço se entrega)."}
            >
              {submitting ? "Enviando pedido..." : "Finalizar pedido"}
            </button>

            {!canCheckout ? (
              <div className="mt-2 text-xs text-gray-500">
                Para liberar o botão: informe <b>Nome</b>, <b>WhatsApp</b>, e adicione itens. Se escolher{" "}
                <b>Entrega</b>, preencha <b>Endereço/Número/Bairro</b>.
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

/* =========================
   PRODUTO CARD
========================= */
function ProdutoCardUltra({
  p,
  prefix,
  onEncomendar,
  estoqueByEan,
}: {
  p: DRFProdutoView;
  prefix: string;
  onEncomendar: () => void;
  estoqueByEan: Map<string, number>;
}) {
  const pr = precoFinal(p);
  const cart = useCart();
  const { push } = useToast();
  const [qtd, setQtd] = useState(1);

  const estoqueAtual = Number(estoqueByEan.get(p.ean) ?? p.estoque ?? 0);
  const indisponivel = estoqueAtual <= 0;

  function add() {
    if (indisponivel) return;

    const already = cart.items.find((x) => x.ean === p.ean)?.qtd ?? 0;
    const want = Math.max(1, qtd);

    if (estoqueAtual > 0 && already + want > estoqueAtual) {
      const canAdd = Math.max(0, estoqueAtual - already);
      if (canAdd <= 0) {
        push({ title: "Sem estoque 😕", desc: "Você já atingiu o limite disponível." });
        return;
      }

      cart.addItem(
        {
          ean: p.ean,
          nome: p.nome,
          laboratorio: p.laboratorio,
          apresentacao: p.apresentacao,
          imagem: firstImg(p.imagens),
          preco: pr.final || 0,
        },
        canAdd
      );

      push({ title: "Adicionado ao carrinho ✅", desc: `${p.nome} • ${canAdd}x (limite do estoque)` });
      setQtd(1);
      return;
    }

    cart.addItem(
      {
        ean: p.ean,
        nome: p.nome,
        laboratorio: p.laboratorio,
        apresentacao: p.apresentacao,
        imagem: firstImg(p.imagens),
        preco: pr.final || 0,
      },
      want
    );

    push({ title: "Adicionado ao carrinho ✅", desc: `${p.nome} • ${want}x` });
    setQtd(1);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      <div className="relative p-3">
        <Link
          href={`${prefix}/produtos/${p.ean}`}
          className="bg-gray-50 rounded-xl p-2 flex items-center justify-center hover:opacity-95 transition"
        >
          <Image
            src={firstImg(p.imagens)}
            alt={p.nome || "Produto"}
            width={240}
            height={240}
            className="rounded object-contain h-24 sm:h-28"
          />
        </Link>

        {!!p.em_promocao && pr.off > 0 && (
          <span className="absolute top-3 right-3 text-[11px] font-extrabold bg-red-600 text-white px-2 py-1 rounded-full shadow-sm">
            {pr.off}% OFF
          </span>
        )}
      </div>

      <div className="px-3 pb-3 flex-1 flex flex-col">
        <div className="text-[11px] text-gray-500 line-clamp-1">{p.laboratorio || "—"}</div>

        <Link
          href={`${prefix}/produtos/${p.ean}`}
          className="mt-1 font-semibold text-blue-950 text-xs sm:text-sm line-clamp-2 hover:underline"
        >
          {p.nome}
        </Link>

        {p.apresentacao && <div className="text-[11px] text-gray-600 mt-1 line-clamp-1">{p.apresentacao}</div>}

        <div className="mt-2">
          <div className="text-base font-extrabold text-blue-900">{brl(pr.final)}</div>
        </div>

        <div className="mt-2 text-[11px]">
          {indisponivel ? (
            <span className="font-extrabold text-gray-500">Sem estoque</span>
          ) : (
            <span className="font-bold text-gray-500">Estoque: {estoqueAtual}</span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center border rounded-xl overflow-hidden">
            <button
              onClick={() => setQtd((x) => Math.max(1, x - 1))}
              className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold"
              disabled={indisponivel}
            >
              –
            </button>
            <div className="w-10 text-center font-extrabold text-sm">{qtd}</div>
            <button
              onClick={() => setQtd((x) => x + 1)}
              className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold"
              disabled={indisponivel}
            >
              +
            </button>
          </div>

          <button
            onClick={add}
            disabled={indisponivel}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold ${
              indisponivel ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800 text-white"
            }`}
          >
            {indisponivel ? "Indisponível" : "Comprar"}
          </button>
        </div>

        {indisponivel ? (
          <button
            onClick={onEncomendar}
            className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-xs sm:text-sm font-extrabold"
          >
            Encomendar
          </button>
        ) : null}
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
