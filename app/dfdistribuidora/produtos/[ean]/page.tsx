// app/dfdistribuidora/produtos/[ean]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import { CartProvider, useCart } from "../../_components/cart";
import { ToastProvider, useToast } from "../../_components/toast";

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
  ativo: boolean | null;
  imagens: string[] | null;
  estoque: number | null;
};

const PROD_TABLE = "df_produtos";
const PREFIX = "/dfdistribuidora";
const WHATS_DF = "5511952068432";

/* =========================
   HELPERS
========================= */
function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0 && imagens[0]) return imagens[0];
  return "/produtos/caixa-padrao.png";
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

function waLink(phone: string, msg: string) {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

/* =========================
   PAGE WRAPPER
========================= */
export default function DFProdutoPageWrapper() {
  return (
    <CartProvider>
      <ToastProvider>
        <DFProdutoPage />
      </ToastProvider>
    </CartProvider>
  );
}

/* =========================
   PAGE
========================= */
function DFProdutoPage() {
  const params = useParams<{ ean: string }>();
  const eanRaw = params?.ean ? decodeURIComponent(String(params.ean)) : "";

  const [loading, setLoading] = useState(true);
  const [produto, setProduto] = useState<DFProduto | null>(null);

  const [qtd, setQtd] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);

  const cart = useCart();
  const { push } = useToast();

  const qtdCarrinho = cart.countItems;
  const totalCarrinho = cart.subtotal;

  const estoqueAtual = Number(produto?.estoque ?? 0);
  const indisponivel = !produto || estoqueAtual <= 0 || produto.ativo === false;

  const pr = useMemo(() => (produto ? precoFinal(produto) : { emPromo: false, pmc: 0, promo: 0, final: 0, off: 0 }), [produto]);

  // mapa de estoque só desse item (pra trava do modal)
  const estoqueByEan = useMemo(() => {
    const m = new Map<string, number>();
    if (produto?.ean) m.set(produto.ean, estoqueAtual);
    return m;
  }, [produto?.ean, estoqueAtual]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setProduto(null);

      try {
        const digits = (eanRaw || "").replace(/\D/g, "");
        if (!digits) {
          setProduto(null);
          return;
        }

        const { data, error } = await supabase
          .from(PROD_TABLE)
          .select("id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,ativo,imagens,estoque")
          .eq("ean", digits)
          .single();

        if (error) throw error;
        setProduto((data as DFProduto) ?? null);
      } catch (e) {
        console.error("Erro load produto DF:", e);
        setProduto(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [eanRaw]);

  const whatsappMsg = useMemo(() => {
    if (!produto) return "Olá! Quero um orçamento na DF Distribuidora.";
    const linhas = [
      `Olá! Quero este item:`,
      ``,
      `• ${produto.nome}`,
      `• EAN: ${produto.ean}`,
      produto.apresentacao ? `• Apresentação: ${produto.apresentacao}` : null,
      produto.laboratorio ? `• Laboratório: ${produto.laboratorio}` : null,
      ``,
      `Pode confirmar disponibilidade e prazo?`,
    ].filter(Boolean) as string[];

    return linhas.join("\n");
  }, [produto]);

  function addToCart() {
    if (!produto) return;
    if (indisponivel) {
      push({ title: "Indisponível 😕", desc: "Sem estoque no momento." });
      return;
    }

    const want = Math.max(1, Math.floor(Number(qtd || 1)));
    const already = cart.items.find((x) => x.ean === produto.ean)?.qtd ?? 0;

    if (estoqueAtual > 0 && already + want > estoqueAtual) {
      const canAdd = Math.max(0, estoqueAtual - already);
      if (canAdd <= 0) {
        push({ title: "Sem estoque 😕", desc: "Você já atingiu o limite disponível." });
        return;
      }

      cart.addItem(
        {
          ean: produto.ean,
          nome: produto.nome,
          laboratorio: produto.laboratorio,
          apresentacao: produto.apresentacao,
          imagem: firstImg(produto.imagens),
          preco: pr.final || 0,
        },
        canAdd
      );

      push({ title: "Adicionado ✅", desc: `${canAdd}x (limite do estoque)` });
      setQtd(1);
      return;
    }

    cart.addItem(
      {
        ean: produto.ean,
        nome: produto.nome,
        laboratorio: produto.laboratorio,
        apresentacao: produto.apresentacao,
        imagem: firstImg(produto.imagens),
        preco: pr.final || 0,
      },
      want
    );

    push({ title: "Adicionado ✅", desc: `${want}x no carrinho` });
    setQtd(1);
  }

  function comprarAbrirCarrinho() {
    // comportamento típico: se não tiver no carrinho, adiciona 1 e abre
    if (!produto) return;
    if (!indisponivel) {
      const already = cart.items.find((x) => x.ean === produto.ean)?.qtd ?? 0;
      if (already === 0) {
        // adiciona 1
        cart.addItem(
          {
            ean: produto.ean,
            nome: produto.nome,
            laboratorio: produto.laboratorio,
            apresentacao: produto.apresentacao,
            imagem: firstImg(produto.imagens),
            preco: pr.final || 0,
          },
          1
        );
      }
      setCartOpen(true);
      return;
    }

    push({ title: "Indisponível 😕", desc: "Sem estoque no momento." });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-14 text-gray-600">Carregando produto…</div>
      </main>
    );
  }

  if (!produto) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="bg-white border rounded-2xl p-6">
            <div className="text-red-600 font-extrabold">Produto não encontrado 😕</div>
            <div className="text-gray-600 mt-2">Verifique o EAN e tente novamente.</div>
            <div className="mt-4">
              <Link className="px-4 py-2 rounded-xl bg-blue-700 text-white font-extrabold" href={PREFIX}>
                Voltar para a loja
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={PREFIX} className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold">
            ← Voltar
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setCartOpen(true)}
              className="relative px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold"
              title="Abrir carrinho"
            >
              🛒 {brl(totalCarrinho)}
              {qtdCarrinho > 0 && (
                <span className="absolute -top-2 -right-2 h-6 min-w-[24px] px-1 rounded-full bg-green-400 text-blue-900 text-xs font-extrabold flex items-center justify-center border-2 border-white">
                  {qtdCarrinho}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white border rounded-3xl shadow-sm p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* imagem */}
            <div className="bg-gray-50 rounded-3xl p-6 flex items-center justify-center">
              <Image
                src={firstImg(produto.imagens)}
                alt={produto.nome}
                width={420}
                height={420}
                className="object-contain max-h-[380px]"
              />
            </div>

            {/* infos */}
            <div>
              <div className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">
                {produto.laboratorio || "—"}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-blue-950 mt-1">{produto.nome}</h1>

              {produto.apresentacao ? (
                <div className="text-gray-600 mt-1">{produto.apresentacao}</div>
              ) : null}

              <div className="mt-5">
                {pr.emPromo ? (
                  <>
                    <div className="text-sm text-gray-500">
                      De <span className="line-through">{brl(pr.pmc)}</span>{" "}
                      {pr.off > 0 ? (
                        <span className="ml-2 inline-block bg-red-600 text-white text-xs font-extrabold px-2 py-1 rounded-full">
                          {pr.off}% OFF
                        </span>
                      ) : null}
                    </div>
                    <div className="text-3xl font-extrabold text-blue-900 mt-1">Por {brl(pr.final)}</div>
                  </>
                ) : (
                  <div className="text-3xl font-extrabold text-blue-900">{brl(pr.final)}</div>
                )}
              </div>

              <div className="mt-4 text-sm text-gray-700">
                {indisponivel ? (
                  <span className="font-extrabold text-gray-500">Sem estoque</span>
                ) : (
                  <span>
                    Estoque disponível: <b>{estoqueAtual}</b>
                  </span>
                )}
              </div>

              {/* qty + botões */}
              <div className="mt-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded-2xl overflow-hidden bg-white">
                    <button
                      onClick={() => setQtd((x) => Math.max(1, x - 1))}
                      className="w-12 h-11 font-extrabold hover:bg-gray-50"
                      disabled={indisponivel}
                    >
                      –
                    </button>
                    <div className="w-14 text-center font-extrabold">{qtd}</div>
                    <button
                      onClick={() => setQtd((x) => x + 1)}
                      className="w-12 h-11 font-extrabold hover:bg-gray-50"
                      disabled={indisponivel}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={addToCart}
                    disabled={indisponivel}
                    className={`flex-1 h-11 rounded-2xl font-extrabold ${
                      indisponivel ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    Adicionar ao carrinho
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* ✅ Comprar abre carrinho */}
                  <button
                    onClick={comprarAbrirCarrinho}
                    className={`h-12 rounded-2xl font-extrabold ${
                      indisponivel ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800 text-white"
                    }`}
                    disabled={indisponivel}
                    title="Abrir carrinho"
                  >
                    Comprar (abrir carrinho)
                  </button>

                  {/* WhatsApp secundário */}
                  <a
                    href={waLink(WHATS_DF, whatsappMsg)}
                    target="_blank"
                    rel="noreferrer"
                    className="h-12 rounded-2xl font-extrabold border bg-white hover:bg-gray-50 text-center flex items-center justify-center"
                    title="Falar no WhatsApp"
                  >
                    💬 Falar no WhatsApp
                  </a>
                </div>

                <Link
                  href={PREFIX}
                  className="h-12 rounded-2xl font-extrabold border bg-white hover:bg-gray-50 text-center flex items-center justify-center"
                >
                  Continuar comprando
                </Link>
              </div>

              <div className="mt-5 text-xs text-gray-500">
                EAN: <b>{produto.ean}</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ MODAL DO CARRINHO */}
      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} whats={WHATS_DF} estoqueByEan={estoqueByEan} />
    </main>
  );
}
function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}


/* =========================
   CART MODAL (ESTILO PDV + dados entrega/pagamento)
   - com taxaEntregaFixa via prop (evita erro de scope)
   - limpar carrinho robusto (funciona com vários formatos de useCart)
   - finalizar via button (pronto pra gerar "notinha" depois)
========================= */
function CartModal({
  open,
  onClose,
  whats,
  estoqueByEan,
  taxaEntregaFixa = 10,
  onAfterFinalize,
}: {
  open: boolean;
  onClose: () => void;
  whats: string;
  estoqueByEan: Map<string, number>;
  taxaEntregaFixa?: number;
  onAfterFinalize?: (payload: {
    mensagem: string;
    clienteNome: string;
    clienteTelefone: string;
    tipoEntrega: "ENTREGA" | "RETIRADA";
    endereco: string;
    numero: string;
    bairro: string;
    pagamento: "PIX" | "CARTAO" | "DINHEIRO" | "COMBINAR";
    taxaEntrega: number;
    total: number;
    subtotal: number;
    itens: Array<{ ean: string; nome: string; qtd: number; preco: number }>;
  }) => void;
}) {
  const cart = useCart();

  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [tipoEntrega, setTipoEntrega] = useState<"ENTREGA" | "RETIRADA">("ENTREGA");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");

  const [pagamento, setPagamento] = useState<"PIX" | "CARTAO" | "DINHEIRO" | "COMBINAR">("PIX");

  const taxaEntrega = tipoEntrega === "ENTREGA" ? Number(taxaEntregaFixa || 0) : 0;
  const total = Number(cart.subtotal || 0) + taxaEntrega;

  function incSafe(ean: string) {
    const est = Number(estoqueByEan.get(ean) ?? 0);
    const it = cart.items.find((x: any) => x.ean === ean);
    if (!it) return;
    if (est > 0 && it.qtd >= est) return;
    cart.inc(ean);
  }

  function setQtdSafe(ean: string, qtd: number) {
    const est = Number(estoqueByEan.get(ean) ?? 0);
    const alvo = Math.max(1, Math.floor(Number(qtd || 1)));
    const final = est > 0 ? Math.min(alvo, est) : alvo;

    const it = cart.items.find((x: any) => x.ean === ean);
    if (!it) return;

    if (final > it.qtd) {
      for (let i = 0; i < final - it.qtd; i++) incSafe(ean);
    } else if (final < it.qtd) {
      for (let i = 0; i < it.qtd - final; i++) cart.dec(ean);
    }
  }

  // ✅ limpar carrinho robusto (serve pra home e produto ficarem sincronizados QUANDO o provider é o mesmo)
  function clearCartSafe() {
    const anyCart: any = cart as any;

    if (typeof anyCart.clearCart === "function") return anyCart.clearCart();
    if (typeof anyCart.clearAll === "function") return anyCart.clearAll();
    if (typeof anyCart.reset === "function") return anyCart.reset();
    if (typeof anyCart.clear === "function") return anyCart.clear();

    // fallback universal: remove item por item
    (cart.items || []).forEach((it: any) => cart.remove(it.ean));
  }

  const canCheckout = useMemo(() => {
    if ((cart.items || []).length === 0) return false;
    if (!clienteNome.trim()) return false;
    if (onlyDigits(clienteTelefone).length < 10) return false;

    if (tipoEntrega === "ENTREGA") {
      if (!endereco.trim() || !numero.trim() || !bairro.trim()) return false;
    }
    return true;
  }, [cart.items?.length, clienteNome, clienteTelefone, tipoEntrega, endereco, numero, bairro]);

  const mensagem = useMemo(() => {
    let msg = `🧾 *Pedido DF Distribuidora*\n\n`;
    msg += `👤 Cliente: ${clienteNome || "—"}\n`;
    msg += `📞 WhatsApp: ${clienteTelefone || "—"}\n\n`;

    msg +=
      tipoEntrega === "ENTREGA"
        ? `🚚 *Entrega*\n${endereco}, ${numero} - ${bairro}\nTaxa: ${brl(taxaEntrega)}\n\n`
        : `🏪 *Retirada na loja*\n\n`;

    msg += `💳 Pagamento: ${pagamento}\n\n🛒 *Itens:*\n`;
    (cart.items || []).forEach((i: any) => {
      msg += `• ${i.nome} (${i.ean}) — ${i.qtd}x — ${brl(Number(i.preco || 0) * Number(i.qtd || 0))}\n`;
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
    taxaEntrega,
    total,
    cart.subtotal,
  ]);

  function finalizar() {
    if (!canCheckout) return;

    // abre whatsapp
    window.open(waLink(whats, mensagem), "_blank");

    // hook pronto pra você gerar "notinha" depois
    onAfterFinalize?.({
      mensagem,
      clienteNome,
      clienteTelefone,
      tipoEntrega,
      endereco,
      numero,
      bairro,
      pagamento,
      taxaEntrega,
      total,
      subtotal: Number(cart.subtotal || 0),
      itens: (cart.items || []).map((i: any) => ({
        ean: i.ean,
        nome: i.nome,
        qtd: Number(i.qtd || 0),
        preco: Number(i.preco || 0),
      })),
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white p-4 overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Seu carrinho</h2>
          <button onClick={onClose} className="px-3 py-2 rounded-xl border font-extrabold">
            Continuar comprando
          </button>
        </div>

        {/* ITENS */}
        <div className="mt-4">
          {(cart.items || []).length === 0 ? (
            <div className="text-gray-600 bg-gray-50 border rounded-2xl p-4">Seu carrinho está vazio.</div>
          ) : (
            (cart.items || []).map((it: any) => {
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

                        <button onClick={() => cart.remove(it.ean)} className="ml-auto text-red-600 font-extrabold">
                          Excluir
                        </button>
                      </div>

                      <div className="mt-2 text-xs text-gray-600">
                        {est > 0 ? (
                          <span>
                            Disponível: <b>{est}</b>
                          </span>
                        ) : (
                          <span className="text-red-600 font-bold">Sem estoque / indisponível</span>
                        )}
                      </div>

                      <div className="mt-2 font-extrabold text-blue-900">
                        Total item: {brl(Number(it.preco || 0) * Number(it.qtd || 0))}
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
            placeholder="WhatsApp com DDD (ex: 11999999999)"
            value={clienteTelefone}
            onChange={(e) => setClienteTelefone(e.target.value)}
            className="w-full border p-2 rounded"
          />
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
        <div className="mt-4">
          <div className="font-bold mb-2">Pagamento</div>

          <div className="flex flex-wrap gap-2">
            {(["PIX", "CARTAO", "DINHEIRO", "COMBINAR"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPagamento(p)}
                className={`px-3 py-2 rounded ${pagamento === p ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* TOTAL */}
        <div className="mt-4 border-t pt-3">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <b>{brl(cart.subtotal)}</b>
          </div>
          <div className="flex justify-between">
            <span>Taxa</span>
            <b>{brl(taxaEntrega)}</b>
          </div>
          <div className="flex justify-between text-lg">
            <span className="font-extrabold">Total</span>
            <span className="font-extrabold">{brl(total)}</span>
          </div>
        </div>

        {/* AÇÕES */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={clearCartSafe} className="py-3 rounded-xl border font-extrabold" title="Limpar carrinho">
            Limpar
          </button>

          <button
            onClick={finalizar}
            className={`py-3 rounded-xl font-extrabold ${
              canCheckout ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!canCheckout}
            title={canCheckout ? "Finalizar no WhatsApp" : "Preencha nome/Whats e itens (e endereço se entrega)."}
          >
            Finalizar no WhatsApp
          </button>
        </div>

        {!canCheckout ? (
          <div className="mt-2 text-xs text-gray-500">
            Para liberar: informe <b>Nome</b>, <b>WhatsApp</b> e adicione itens. Se escolher <b>Entrega</b>, preencha{" "}
            <b>Endereço/Número/Bairro</b>.
          </div>
        ) : null}
      </div>
    </div>
  );
}
