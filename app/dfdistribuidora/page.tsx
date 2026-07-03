// app/dfdistribuidora/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "./_components/cart";
import { useToast } from "./_components/toast";
import { useCartUI } from "./_components/cart-ui";
import ClientProfileGate from "./_components/ClientProfileGate";
import FVBanners from "./_components/FVBanners";

/* =========================
   SENHA SIMPLES (LOCAL)
========================= */
const DF_SENHA = "112233";
const LS_KEY = "df_public_ok";

/* =========================
   CONFIG
========================= */
type DFProduto = {
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
  estoque: number | null;
};

const PROD_TABLE = "df_produtos";
const RPC_SEARCH = "df_search_produtos";
const PREFIX = "/dfdistribuidora";

const WHATS_DF = "5511952068432";

const BRAND_TOP = "IA";
const BRAND_SUB = "• DF";

const TAXA_ENTREGA_FIXA = 10;

const HOME_LIMIT = 150;
const SEARCH_LIMIT = 180;
const SEARCH_DEBOUNCE = 350;

const PROFILE_LS = "df_cliente_profile";

/* =========================
   HELPERS
========================= */
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

/* =========================
   PAGE WRAPPER
========================= */
export default function DFDistribuidoraHomePage() {
  const [ok, setOk] = useState(false);
  const [senha, setSenha] = useState("");

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem(LS_KEY) === "1";
    if (saved) setOk(true);
  }, []);

  function entrar() {
    if (senha === DF_SENHA) {
      localStorage.setItem(LS_KEY, "1");
      setOk(true);
    } else {
      alert("Senha incorreta.");
    }
  }

  function sair() {
    localStorage.removeItem(LS_KEY);
    setOk(false);
    setSenha("");
  }

  if (!ok) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border rounded-3xl shadow-sm p-6">
          <div className="text-xl font-extrabold text-gray-900">Acesso • DF Distribuidora</div>
          <div className="text-sm text-gray-600 mt-1">Digite a senha para entrar.</div>

          <input
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? entrar() : null)}
            type="password"
            placeholder="Senha"
            className="mt-4 w-full border rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />

          <button
            onClick={entrar}
            className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white rounded-2xl py-3 font-extrabold"
          >
            Entrar
          </button>

          <div className="mt-3 text-[11px] text-gray-500">Fica salvo neste navegador (localStorage).</div>
        </div>
      </div>
    );
  }

  // ✅ cliente é obrigado a cadastrar perfil antes de ver produtos
  return (
    <ClientProfileGate>
      <DFDistribuidoraHome onSair={sair} />
    </ClientProfileGate>
  );
}

/* =========================
   PAGE (loja do cliente)
========================= */
function DFDistribuidoraHome({ onSair }: { onSair: () => void }) {
  const [loadingHome, setLoadingHome] = useState(true);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [busca, setBusca] = useState("");

  const [homeProdutos, setHomeProdutos] = useState<DFProduto[]>([]);
  const [resultado, setResultado] = useState<DFProduto[]>([]);

  const { cartOpen, openCart, closeCart } = useCartUI();

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

  useEffect(() => {
    async function loadHome() {
      try {
        setLoadingHome(true);

        const { data, error } = await supabase
          .from(PROD_TABLE)
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens,estoque"
          )
          .eq("ativo", true)
          .gt("estoque", 0)
          .order("destaque_home", { ascending: false })
          .order("em_promocao", { ascending: false })
          .order("estoque", { ascending: false })
          .order("nome", { ascending: true })
          .limit(HOME_LIMIT);

        if (error) throw error;

        setHomeProdutos(((data || []) as DFProduto[]) ?? []);
      } catch (e) {
        console.error("Erro loadHome DF:", e);
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
        const { data, error } = await supabase.rpc(RPC_SEARCH, { q: normalized, lim: SEARCH_LIMIT });
        if (error) throw error;
        setResultado(((data || []) as DFProduto[]) ?? []);
      } catch (e) {
        try {
          const digits = onlyDigits(raw);

          let query = supabase
            .from(PROD_TABLE)
            .select(
              "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens,estoque"
            )
            .eq("ativo", true)
            .limit(SEARCH_LIMIT);

          if (digits.length >= 8 && digits.length <= 14) query = query.or(`ean.eq.${digits},nome.ilike.%${raw}%`);
          else query = query.ilike("nome", `%${raw}%`);

          const { data, error } = await query
            .order("em_promocao", { ascending: false })
            .order("nome", { ascending: true });

          if (error) throw error;

          setResultado(((data || []) as DFProduto[]) ?? []);
        } catch (e2) {
          console.error("Erro fallback search DF:", e2);
          setResultado([]);
        }
      } finally {
        setLoadingBusca(false);
      }
    }

    const timer = setTimeout(search, SEARCH_DEBOUNCE);
    return () => clearTimeout(timer);
  }, [busca]);

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-40 bg-blue-700 shadow">
        <div className="mx-auto max-w-6xl px-4 py-3">
          {/* MOBILE */}
          <div className="flex items-center justify-between gap-3 md:hidden">
            <div className="text-white font-extrabold whitespace-nowrap">
              {BRAND_TOP} <span className="opacity-80">{BRAND_SUB}</span>
            </div>

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

              <button
                onClick={onSair}
                className="text-white font-extrabold bg-white/10 hover:bg-white/15 px-3 py-2 rounded-full"
                title="Sair"
              >
                Sair
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
              {BRAND_TOP} <span className="opacity-80">{BRAND_SUB}</span>
            </div>

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

            <button
              onClick={onSair}
              className="text-white font-extrabold bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full"
              title="Sair"
            >
              Sair
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
              <div className="space-y-3">
                {resultado.map((p) => (
                  <ProdutoCardUltra
                    key={p.id}
                    p={p}
                    prefix={PREFIX}
                    onEncomendar={() => encomendarDF(p)}
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
              <div className="bg-white border rounded-2xl p-6 text-gray-600">Nenhum produto com estoque disponível no momento.</div>
            ) : (
              <div className="space-y-3">
                {homeProdutos.map((p) => (
                  <ProdutoCardUltra
                    key={p.id}
                    p={p}
                    prefix={PREFIX}
                    onEncomendar={() => encomendarDF(p)}
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
          <p className="text-gray-600 mt-1">Escolha os produtos na lista, monte o carrinho automaticamente e finalize o pedido em poucos cliques.</p>
        </div>
      </section>

      <CartModal open={cartOpen} onClose={closeCart} whats={WHATS_DF} estoqueByEan={estoqueByEan} />
    </main>
  );

  function encomendarDF(p: DFProduto) {
    const msg =
      `Olá! Quero encomendar este item:\n\n` +
      `• ${p.nome} (EAN: ${p.ean})\n` +
      (p.apresentacao ? `• Apresentação: ${p.apresentacao}\n` : "") +
      (p.laboratorio ? `• Laboratório: ${p.laboratorio}\n` : "") +
      `\nPode me avisar prazo e valor?`;

    window.open(waLink(WHATS_DF, msg), "_blank");
  }
}

/* =========================
   CART MODAL + salva pedido (Whats opcional)
========================= */
function CartModal({
  open,
  onClose,
  whats, // agora é opcional (mas pode continuar passando)
  estoqueByEan,
}: {
  open: boolean;
  onClose: () => void;
  whats?: string;
  estoqueByEan: Map<string, number>;
}) {
  const cart = useCart();

  const [saving, setSaving] = useState(false);
  const [pedidoCriado, setPedidoCriado] = useState<string | null>(null);

  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [tipoEntrega, setTipoEntrega] = useState<"ENTREGA" | "RETIRADA">("ENTREGA");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");

  const [pagamento, setPagamento] = useState<"PIX" | "CARTAO" | "DINHEIRO">("PIX");
  const [tipoCartao, setTipoCartao] = useState<"CREDITO" | "DEBITO">("CREDITO");
  const [trocoPara, setTrocoPara] = useState("");
  const [semTroco, setSemTroco] = useState(false);

  // ✅ ao abrir, puxa do perfil salvo e preenche automaticamente
  useEffect(() => {
    if (!open) return;

    // quando abrir o carrinho, reseta confirmação
    setPedidoCriado(null);

    try {
      const p = JSON.parse(localStorage.getItem(PROFILE_LS) || "null");
      if (!p) return;

      // Só preenche se o campo estiver vazio (pra não sobrescrever edição do usuário)
      setClienteNome((prev) => (prev?.trim() ? prev : p.responsavel_nome || ""));
      setClienteTelefone((prev) => (prev?.trim() ? prev : p.whatsapp || ""));

      setEndereco((prev) => (prev?.trim() ? prev : p.endereco || ""));
      setNumero((prev) => (prev?.trim() ? prev : p.numero || ""));
      setBairro((prev) => (prev?.trim() ? prev : p.bairro || ""));
    } catch {
      // ignore
    }
  }, [open]);

  const taxaEntrega = tipoEntrega === "ENTREGA" ? TAXA_ENTREGA_FIXA : 0;
  const total = cart.subtotal + taxaEntrega;

  function pagamentoDescricao() {
    if (pagamento === "PIX") return "PIX";
    if (pagamento === "CARTAO") {
      return tipoCartao === "CREDITO" ? "Cartão de Crédito" : "Cartão de Débito";
    }

    if (semTroco) return "Dinheiro - sem necessidade de troco";
    if (trocoPara.trim()) return `Dinheiro - troco para ${trocoPara.trim()}`;
    return "Dinheiro";
  }

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

    if (final > it.qtd) {
      for (let i = 0; i < final - it.qtd; i++) incSafe(ean);
    } else if (final < it.qtd) {
      for (let i = 0; i < it.qtd - final; i++) cart.dec(ean);
    }
  }

  const canCheckout = useMemo(() => {
    if (cart.items.length === 0) return false;
    if (!clienteNome.trim()) return false;
    if (onlyDigits(clienteTelefone).length < 10) return false;

    if (tipoEntrega === "ENTREGA") {
      if (!endereco.trim() || !numero.trim() || !bairro.trim()) return false;
    }
    return true;
  }, [cart.items.length, clienteNome, clienteTelefone, tipoEntrega, endereco, numero, bairro]);

  const mensagem = useMemo(() => {
    let msg = `🧾 *Pedido DF Distribuidora*\n\n`;
    msg += `👤 Cliente: ${clienteNome || "—"}\n`;
    msg += `📞 WhatsApp: ${clienteTelefone || "—"}\n\n`;

    msg +=
      tipoEntrega === "ENTREGA"
        ? `🚚 *Entrega*\n${endereco}, ${numero} - ${bairro}\nTaxa: ${brl(taxaEntrega)}\n\n`
        : `🏪 *Retirada na loja*\n\n`;

    msg += `💳 Pagamento: ${pagamentoDescricao()}\n\n🛒 *Itens:*\n`;
    cart.items.forEach((i) => {
      msg += `• ${i.nome} (${i.ean}) — ${i.qtd}x — ${brl(i.preco * i.qtd)}\n`;
    });

    msg += `\nSubtotal: ${brl(cart.subtotal)}\n`;
    msg += `Taxa: ${brl(taxaEntrega)}\n`;
    msg += `Total: ${brl(total)}\n\n`;
    msg += `Pode confirmar disponibilidade e prazo?`;

    return msg;
  }, [
    cart.items,
    clienteNome,
    clienteTelefone,
    tipoEntrega,
    endereco,
    numero,
    bairro,
    pagamento,
    tipoCartao,
    trocoPara,
    semTroco,
    taxaEntrega,
    total,
    cart.subtotal,
  ]);

  function waLink(phone: string, msg: string) {
    const clean = phone.replace(/\D/g, "");
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  }

  async function criarPedidoNoPainel() {
    let profile: any = null;
    try {
      profile = JSON.parse(localStorage.getItem(PROFILE_LS) || "null");
    } catch {
      // ignore
    }

    const itens = cart.items.map((i) => ({
      ean: i.ean,
      nome: i.nome,
      qtd: i.qtd,
      preco: i.preco,
      subtotal: i.preco * i.qtd,
    }));

    const { data, error } = await supabase.rpc("df_checkout", {
      p_canal: "SITE",
      p_comanda: null,

      p_cliente_nome: clienteNome.trim(),
      p_cliente_whatsapp: onlyDigits(clienteTelefone),

      // ✅ extras do profile (pra não perder)
      p_cliente_cpf: profile?.cpf || null,
      p_cliente_nome_fantasia: profile?.nome_fantasia || null,

      p_tipo_entrega: tipoEntrega,
      p_endereco: tipoEntrega === "ENTREGA" ? endereco.trim() : null,
      p_numero: tipoEntrega === "ENTREGA" ? numero.trim() : null,
      p_bairro: tipoEntrega === "ENTREGA" ? bairro.trim() : null,

      p_pagamento: pagamentoDescricao(),
      p_taxa_entrega: taxaEntrega,
      p_subtotal: cart.subtotal,
      p_total: total,

      p_itens: itens,
    });

    if (error) throw error;
    return (data as string) || "";
  }

  async function finalizarPedido() {
    if (!canCheckout || saving) return;

    setSaving(true);
    try {
      const pedidoId = await criarPedidoNoPainel();

      // ✅ confirma dentro do site
      setPedidoCriado(pedidoId || "OK");

      // ✅ limpa carrinho (se seu hook tiver clear)
      if (typeof (cart as any).clear === "function") (cart as any).clear();
      else {
        // fallback: remove item a item
        cart.items.forEach((it) => cart.remove(it.ean));
      }
    } catch (e) {
      console.error(e);
      alert("Não consegui salvar o pedido. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white p-4 overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Carrinho</h2>
          <button onClick={onClose} className="px-3 py-2 rounded-xl border font-extrabold">
            Continuar comprando
          </button>
        </div>

        {/* ✅ CONFIRMAÇÃO (após salvar) */}
        {pedidoCriado ? (
          <div className="mt-6 rounded-2xl border bg-green-50 p-6 text-center">
            <div className="text-2xl font-extrabold text-green-700">
              Pedido finalizado com sucesso! ✅
            </div>

            <div className="mt-2 text-sm text-gray-900 font-semibold">
              Em breve nossa equipe irá conferir o estoque e dar sequência ao atendimento.
            </div>

            <div className="mt-3 text-sm text-gray-700">
              Pedido criado no sistema: <b>{pedidoCriado}</b>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  setPedidoCriado(null);
                  onClose();
                }}
                className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white py-3 font-extrabold"
              >
                Voltar para a loja
              </button>

              {/* ✅ Opcional: Enviar no WhatsApp também */}
              {whats ? (
                <button
                  onClick={() => {
                    const msgComId = `✅ Pedido criado no sistema: ${pedidoCriado}\n\n${mensagem}`;
                    window.open(waLink(whats, msgComId), "_blank", "noopener,noreferrer");
                  }}
                  className="w-full rounded-xl border py-3 font-extrabold hover:bg-gray-50"
                >
                  Enviar no WhatsApp também (opcional)
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* ITENS */}
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
                        />

                        <button
                          onClick={() => incSafe(it.ean)}
                          disabled={est > 0 ? it.qtd >= est : false}
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

                      <div className="mt-2 font-extrabold text-blue-900">
                        Total item: {brl(it.preco * it.qtd)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DADOS CLIENTE */}
        <div className="mt-4 space-y-2">
          <input
            placeholder="Nome do cliente"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <input
            placeholder="WhatsApp"
            value={clienteTelefone}
            onChange={(e) => setClienteTelefone(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <div className="text-[11px] text-gray-500">Dica: informe com DDD (ex: 11999999999)</div>
        </div>

        {/* ENTREGA */}
        <div className="mt-4">
          <div className="font-bold mb-2">Entrega</div>

          <div className="flex gap-2">
            <button
              onClick={() => setTipoEntrega("ENTREGA")}
              className={`px-3 py-2 rounded flex-1 ${
                tipoEntrega === "ENTREGA" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              Entrega
            </button>

            <button
              onClick={() => setTipoEntrega("RETIRADA")}
              className={`px-3 py-2 rounded flex-1 ${
                tipoEntrega === "RETIRADA" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
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
              />
              <input
                placeholder="Número"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full border p-2 rounded"
              />
              <input
                placeholder="Bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full border p-2 rounded"
              />
              <div className="text-sm font-bold">Taxa fixa: {brl(taxaEntrega)}</div>
            </div>
          )}
        </div>

        {/* PAGAMENTO */}
        <div className="mt-4 rounded-2xl border bg-gray-50 p-3">
          <div className="font-extrabold mb-2">Forma de pagamento</div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPagamento("PIX")}
              className={`rounded-xl px-3 py-2 font-extrabold ${
                pagamento === "PIX" ? "bg-blue-600 text-white" : "bg-white border text-gray-800"
              }`}
            >
              PIX
            </button>

            <button
              type="button"
              onClick={() => setPagamento("CARTAO")}
              className={`rounded-xl px-3 py-2 font-extrabold ${
                pagamento === "CARTAO" ? "bg-blue-600 text-white" : "bg-white border text-gray-800"
              }`}
            >
              Cartão
            </button>

            <button
              type="button"
              onClick={() => setPagamento("DINHEIRO")}
              className={`rounded-xl px-3 py-2 font-extrabold ${
                pagamento === "DINHEIRO" ? "bg-blue-600 text-white" : "bg-white border text-gray-800"
              }`}
            >
              Dinheiro
            </button>
          </div>

          {pagamento === "CARTAO" ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipoCartao("CREDITO")}
                className={`rounded-xl px-3 py-2 text-sm font-extrabold ${
                  tipoCartao === "CREDITO" ? "bg-green-600 text-white" : "bg-white border text-gray-800"
                }`}
              >
                Crédito
              </button>

              <button
                type="button"
                onClick={() => setTipoCartao("DEBITO")}
                className={`rounded-xl px-3 py-2 text-sm font-extrabold ${
                  tipoCartao === "DEBITO" ? "bg-green-600 text-white" : "bg-white border text-gray-800"
                }`}
              >
                Débito
              </button>
            </div>
          ) : null}

          {pagamento === "DINHEIRO" ? (
            <div className="mt-3 space-y-2">
              <input
                placeholder="Troco para quanto? Ex: 200,00"
                value={trocoPara}
                onChange={(e) => setTrocoPara(e.target.value)}
                disabled={semTroco}
                className="w-full border p-2 rounded disabled:bg-gray-100 disabled:text-gray-500"
              />

              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={semTroco}
                  onChange={(e) => {
                    setSemTroco(e.target.checked);
                    if (e.target.checked) setTrocoPara("");
                  }}
                />
                Não precisa de troco
              </label>
            </div>
          ) : null}

          <div className="mt-2 text-xs text-gray-600">
            Vai aparecer no WhatsApp como: <b>{pagamentoDescricao()}</b>
          </div>
        </div>

        {/* TOTAL */}
        <div className="mt-4 border-t pt-3">
          <div>Subtotal: {brl(cart.subtotal)}</div>
          <div>Taxa: {brl(taxaEntrega)}</div>
          <div className="font-extrabold text-lg">Total: {brl(total)}</div>
        </div>

        {/* ✅ FINALIZAR: salva no painel e PRONTO (sem Whats automático) */}
        <button
          disabled={!canCheckout || saving || !!pedidoCriado}
          onClick={finalizarPedido}
          className={`w-full mt-4 text-center py-3 rounded-xl font-extrabold ${
            canCheckout ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-200 text-gray-500"
          } ${saving ? "opacity-70 cursor-wait" : ""}`}
          title={canCheckout ? "Finalizar pedido" : "Preencha nome/Whats e itens (e endereço se entrega)."}
        >
          {saving ? "Finalizando..." : "Finalizar pedido"}
        </button>

        {!canCheckout ? (
          <div className="mt-2 text-xs text-gray-500">
            Para liberar o botão: informe <b>Nome</b>, <b>WhatsApp</b>, e adicione itens. Se escolher <b>Entrega</b>, preencha{" "}
            <b>Endereço/Número/Bairro</b>.
          </div>
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
  p: DFProduto;
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
        push({
          title: "Limite de estoque atingido",
          desc: "Esse produto já está no carrinho com a quantidade disponível.",
        });
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

      push({
        title: "Adicionado ao carrinho ✅",
        desc: `${p.nome} • ${canAdd}x`,
      });

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

    push({
      title: "Adicionado ao carrinho ✅",
      desc: `${p.nome} • ${want}x`,
    });

    setQtd(1);
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="grid grid-cols-[76px_1fr] gap-3 p-3 sm:grid-cols-[96px_1fr_190px] sm:items-center">
        <Link
          href={`${prefix}/produtos/${p.ean}`}
          className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 p-2 sm:h-24 sm:w-24"
        >
          <Image
            src={firstImg(p.imagens)}
            alt={p.nome || "Produto"}
            width={120}
            height={120}
            className="h-full w-full object-contain"
          />
        </Link>

        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {p.categoria ? (
              <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-800">
                {p.categoria}
              </span>
            ) : null}

            {pr.emPromo && pr.off > 0 ? (
              <span className="rounded-full bg-red-600 px-2 py-1 text-[10px] font-black text-white">
                {pr.off}% OFF
              </span>
            ) : null}

            {!indisponivel ? (
              <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-black text-green-700">
                Estoque: {estoqueAtual}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">
                Sem estoque
              </span>
            )}
          </div>

          <Link
            href={`${prefix}/produtos/${p.ean}`}
            className="line-clamp-2 text-sm font-black uppercase text-slate-950 hover:text-blue-800 hover:underline sm:text-base"
          >
            {p.nome}
          </Link>

          <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
            <div>
              <span className="font-bold text-slate-900">Laboratório:</span>{" "}
              {p.laboratorio || "—"}
            </div>

            <div>
              <span className="font-bold text-slate-900">EAN:</span> {p.ean}
            </div>

            <div className="sm:col-span-2">
              <span className="font-bold text-slate-900">Apresentação:</span>{" "}
              {p.apresentacao || "—"}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            {pr.emPromo ? (
              <div>
                <div className="text-[11px] text-slate-500">
                  De <span className="line-through">{brl(pr.pmc)}</span>
                </div>
                <div className="text-xl font-black text-blue-900">
                  {brl(pr.final)}
                </div>
              </div>
            ) : (
              <div className="text-xl font-black text-blue-900">
                {brl(pr.final)}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2 mt-3 flex items-center gap-2 sm:col-span-1 sm:mt-0 sm:flex-col sm:items-stretch">
          <div className="flex items-center overflow-hidden rounded-xl border bg-white">
            <button
              onClick={() => setQtd((x) => Math.max(1, x - 1))}
              className="h-10 w-10 font-black hover:bg-slate-50 disabled:opacity-40"
              disabled={indisponivel}
            >
              –
            </button>

            <div className="h-10 w-12 border-x text-center text-sm font-black leading-10">
              {qtd}
            </div>

            <button
              onClick={() => setQtd((x) => Math.min(estoqueAtual || x + 1, x + 1))}
              className="h-10 w-10 font-black hover:bg-slate-50 disabled:opacity-40"
              disabled={indisponivel}
            >
              +
            </button>
          </div>

          <button
            onClick={add}
            disabled={indisponivel}
            className={`h-10 flex-1 rounded-xl px-4 text-sm font-black sm:w-full ${
              indisponivel
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : "bg-blue-700 text-white hover:bg-blue-800"
            }`}
          >
            {indisponivel ? "Indisponível" : "Adicionar"}
          </button>

          {indisponivel ? (
            <button
              onClick={onEncomendar}
              className="h-10 flex-1 rounded-xl bg-green-600 px-4 text-sm font-black text-white hover:bg-green-700 sm:w-full"
            >
              Encomendar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-6 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-[76px_1fr] gap-3 sm:grid-cols-[96px_1fr_190px] sm:items-center">
            <div className="h-20 w-20 animate-pulse rounded-2xl bg-gray-100 sm:h-24 sm:w-24" />
            <div>
              <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-5 w-64 max-w-full animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-3 w-40 animate-pulse rounded bg-gray-100" />
              <div className="mt-3 h-6 w-28 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="col-span-2 mt-3 h-10 animate-pulse rounded-xl bg-gray-100 sm:col-span-1 sm:mt-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

