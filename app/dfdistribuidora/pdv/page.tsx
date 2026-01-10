// app/dfdistribuidora/pdv/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

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
};

type CartItem = {
  id: string;
  ean: string;
  nome: string;
  imagem: string | null;
  preco: number; // unitário
  qtd: number;
};

const PROD_TABLE = "df_produtos";
const RPC_SEARCH = "df_search_produtos"; // se não existir, fallback
const WHATS = "5511952068432";

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

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function normalizePhoneBR(v: string) {
  // deixa só números; se vier sem 55, a gente coloca na mensagem mesmo
  return onlyDigits(v);
}

function isValidPhoneBR(v: string) {
  const d = normalizePhoneBR(v);
  // aceita 10/11 dígitos (sem DDI) ou 12/13 (com 55)
  return d.length === 10 || d.length === 11 || d.length === 12 || d.length === 13;
}

export default function PDVDF() {
  const [produtos, setProdutos] = useState<DFProduto[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [loadingBusca, setLoadingBusca] = useState(false);

  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // checkout form
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [tipoEntrega, setTipoEntrega] = useState<"ENTREGA" | "RETIRADA">("ENTREGA");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [referencia, setReferencia] = useState("");

  const [pagamento, setPagamento] = useState<"PIX" | "DINHEIRO" | "CARTAO" | "TRANSFERENCIA" | "COMBINAR">("PIX");
  const [trocoPara, setTrocoPara] = useState("");

  const [taxaEntrega, setTaxaEntrega] = useState<number>(0);

  // ✅ carregar produtos
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from(PROD_TABLE)
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens"
          )
          .eq("ativo", true)
          .limit(2000);

        if (error) throw error;
        setProdutos((data || []) as DFProduto[]);
      } catch (e) {
        console.error("Erro load produtos PDV DF:", e);
        setProdutos([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ✅ busca (RPC ou fallback)
  useEffect(() => {
    async function run() {
      const raw = busca.trim();
      if (!raw) return;

      setLoadingBusca(true);
      try {
        const normalized = raw
          .toLowerCase()
          .replace(/(\d+)\s*(mg|ml|mcg|g|ui|iu)/gi, "$1 $2")
          .replace(/\s+/g, " ")
          .trim();

        const { data, error } = await supabase.rpc(RPC_SEARCH, { q: normalized, lim: 120 });
        if (error) throw error;

        setProdutos(((data || []) as DFProduto[]) ?? []);
      } catch (e) {
        try {
          const digits = raw.replace(/\D/g, "");
          let query = supabase
            .from(PROD_TABLE)
            .select(
              "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens"
            )
            .eq("ativo", true)
            .limit(200);

          if (digits.length >= 8 && digits.length <= 14) query = query.or(`ean.eq.${digits},nome.ilike.%${raw}%`);
          else query = query.ilike("nome", `%${raw}%`);

          const { data, error } = await query;
          if (error) throw error;

          setProdutos((data || []) as DFProduto[]);
        } catch (e2) {
          console.error("Erro fallback busca PDV DF:", e2);
        }
      } finally {
        setLoadingBusca(false);
      }
    }

    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [busca]);

  // ✅ totais
  const subtotal = useMemo(() => carrinho.reduce((acc, it) => acc + Number(it.preco || 0) * Number(it.qtd || 0), 0), [carrinho]);
  const total = useMemo(() => subtotal + Number(taxaEntrega || 0), [subtotal, taxaEntrega]);
  const qtdCarrinho = useMemo(() => carrinho.reduce((acc, it) => acc + it.qtd, 0), [carrinho]);

  function qtdNoCarrinho(id: string) {
    return carrinho.find((x) => x.id === id)?.qtd || 0;
  }

  function addProduto(p: DFProduto, qtdAdd = 1) {
    const pr = precoFinal(p);
    const preco = Number(pr.final || 0);

    setCarrinho((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qtd: copy[idx].qtd + qtdAdd, preco };
        return copy;
      }
      return [
        ...prev,
        { id: p.id, ean: p.ean, nome: p.nome, imagem: firstImg(p.imagens), preco, qtd: Math.max(1, qtdAdd) },
      ];
    });
  }

  function incItem(id: string) {
    setCarrinho((prev) => prev.map((x) => (x.id === id ? { ...x, qtd: x.qtd + 1 } : x)));
  }

  function decItem(id: string) {
    setCarrinho((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, qtd: Math.max(1, x.qtd - 1) } : x))
        .filter((x) => x.qtd > 0)
    );
  }

  function setQtdItem(id: string, qtd: number) {
    const q = Math.max(1, Math.floor(Number(qtd || 1)));
    setCarrinho((prev) => prev.map((x) => (x.id === id ? { ...x, qtd: q } : x)));
  }

  function removeItem(id: string) {
    setCarrinho((prev) => prev.filter((x) => x.id !== id));
  }

  function clearCart() {
    setCarrinho([]);
  }

  const canCheckout = useMemo(() => {
    if (!carrinho.length) return false;
    if (!clienteNome.trim()) return false;
    if (!clienteTelefone.trim() || !isValidPhoneBR(clienteTelefone)) return false;

    if (tipoEntrega === "ENTREGA") {
      if (!endereco.trim() || !numero.trim() || !bairro.trim()) return false;
    }

    if (pagamento === "DINHEIRO") {
      const t = trocoPara.trim();
      if (t && Number(t.replace(",", ".")) < total) return false;
    }

    return true;
  }, [carrinho.length, clienteNome, clienteTelefone, tipoEntrega, endereco, numero, bairro, pagamento, trocoPara, total]);

  const mensagemWhats = useMemo(() => {
    const nome = clienteNome.trim() || "Cliente";
    const tel = normalizePhoneBR(clienteTelefone);
    const entregaTxt =
      tipoEntrega === "RETIRADA"
        ? "Retirada na loja"
        : `Entrega:\n- Endereço: ${endereco}${numero ? `, ${numero}` : ""}\n- Bairro: ${bairro}${cidade ? `\n- Cidade: ${cidade}` : ""}${
            referencia ? `\n- Referência: ${referencia}` : ""
          }\n- Taxa: ${brl(taxaEntrega)}`;

    const pagTxt =
      pagamento === "DINHEIRO"
        ? `Dinheiro${trocoPara.trim() ? ` (troco para ${brl(Number(trocoPara.replace(",", ".")))})` : ""}`
        : pagamento;

    let msg = `🧾 Pedido DF Distribuidora\n\n👤 Cliente: ${nome}\n📞 Telefone: ${tel || clienteTelefone}\n\n`;

    msg += `📦 ${entregaTxt}\n\n`;
    msg += `💳 Pagamento: ${pagTxt}\n\n`;

    msg += `🛒 Itens:\n`;
    for (const it of carrinho) {
      msg += `• ${it.nome} (${it.ean}) — ${it.qtd}x — ${brl(it.preco * it.qtd)}\n`;
    }

    msg += `\nSubtotal: ${brl(subtotal)}\n`;
    if (tipoEntrega === "ENTREGA") msg += `Taxa entrega: ${brl(taxaEntrega)}\n`;
    msg += `TOTAL: ${brl(total)}\n`;

    if (observacoes.trim()) msg += `\n📝 Observações: ${observacoes.trim()}\n`;

    msg += `\nPode confirmar disponibilidade e prazo?`;
    return msg;
  }, [
    carrinho,
    clienteNome,
    clienteTelefone,
    tipoEntrega,
    endereco,
    numero,
    bairro,
    cidade,
    referencia,
    pagamento,
    trocoPara,
    taxaEntrega,
    subtotal,
    total,
    observacoes,
  ]);

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      {/* LOGO */}
      <div className="flex justify-center mb-4">
        <Image src="/df-distribuidora-logo.png" alt="Logo DF Distribuidora" width={120} height={120} />
      </div>

      <h1 className="text-2xl font-extrabold text-center mb-4 text-gray-900">PDV — DF Distribuidora</h1>

      {/* BUSCA */}
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="Digite o nome do produto ou EAN…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full p-3 border rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
          {busca.trim() ? (
            <button
              onClick={() => setBusca("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-extrabold px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
              title="Limpar"
            >
              Limpar
            </button>
          ) : null}
        </div>

        <div className="mt-2 text-xs text-gray-500">{loading || loadingBusca ? "Carregando…" : `${produtos.length} produto(s)`}</div>
      </div>

      {/* LISTA */}
      <div className="max-w-6xl mx-auto mt-4 grid gap-3">
        {loading ? (
          <SkeletonList />
        ) : produtos.length === 0 ? (
          <div className="bg-white border rounded-2xl p-6 text-gray-600">Nenhum produto encontrado.</div>
        ) : (
          produtos
            .filter((p) => (p.nome || "").toLowerCase().includes(busca.toLowerCase()))
            .slice(0, 200)
            .map((p) => {
              const pr = precoFinal(p);
              const qtd = qtdNoCarrinho(p.id);

              return (
                <div key={p.id} className="p-3 bg-white shadow-sm rounded-2xl border flex justify-between items-center gap-3">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="h-14 w-14 rounded-xl bg-gray-50 border overflow-hidden flex items-center justify-center">
                      <Image src={firstImg(p.imagens)} alt={p.nome || "Produto"} width={64} height={64} className="object-contain" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-extrabold text-sm sm:text-base line-clamp-2 text-gray-900">{p.nome}</p>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {p.laboratorio || "—"} {p.apresentacao ? `• ${p.apresentacao}` : ""}
                      </div>

                      <div className="mt-1">
                        {pr.emPromo ? (
                          <div className="text-sm">
                            <span className="text-gray-500 line-through mr-2">{brl(pr.pmc)}</span>
                            <span className="text-blue-700 font-extrabold">{brl(pr.final)}</span>
                            {pr.off > 0 ? (
                              <span className="ml-2 text-[11px] font-extrabold bg-red-600 text-white px-2 py-1 rounded-full">{pr.off}% OFF</span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="text-blue-700 font-extrabold">{brl(pr.final)}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => decItem(p.id)}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl font-extrabold"
                      title="Diminuir"
                      disabled={qtd <= 0}
                    >
                      -
                    </button>

                    <span className="font-extrabold w-8 text-center">{qtd}</span>

                    <button onClick={() => addProduto(p, 1)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold" title="Adicionar">
                      +
                    </button>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* BOTÃO FLUTUANTE */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-full shadow-lg text-lg font-extrabold hover:bg-green-700 transition"
      >
        🛒 Carrinho ({qtdCarrinho})
      </button>

      {/* DRAWER CARRINHO + CHECKOUT */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />

          <div className="absolute top-0 right-0 h-full w-full sm:w-[520px] bg-white shadow-xl border-l flex flex-col">
            {/* header */}
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <div className="font-extrabold text-lg">🛒 Carrinho & Checkout</div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold"
              >
                Continuar comprando
              </button>
            </div>

            {/* body */}
            <div className="p-4 flex-1 overflow-auto space-y-6">
              {/* itens */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-gray-900">Itens</div>
                  <button
                    onClick={clearCart}
                    className={`text-xs font-extrabold px-3 py-1 rounded-full border bg-white hover:bg-gray-50 ${
                      carrinho.length ? "" : "opacity-50 pointer-events-none"
                    }`}
                  >
                    Limpar
                  </button>
                </div>

                {carrinho.length === 0 ? (
                  <div className="mt-3 text-gray-600 bg-gray-50 border rounded-2xl p-4">Seu carrinho está vazio.</div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {carrinho.map((it) => (
                      <div key={it.id} className="border rounded-2xl p-3 flex gap-3 items-start">
                        <div className="h-14 w-14 rounded-xl bg-gray-50 border overflow-hidden flex items-center justify-center">
                          <Image src={it.imagem || "/produtos/caixa-padrao.png"} alt={it.nome} width={64} height={64} className="object-contain" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-sm line-clamp-2">{it.nome}</div>
                          <div className="text-xs text-gray-500">EAN: {it.ean}</div>
                          <div className="mt-1 text-sm font-extrabold text-blue-900">{brl(it.preco)}</div>

                          {/* controles */}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <div className="flex items-center border rounded-xl overflow-hidden">
                              <button onClick={() => decItem(it.id)} className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold">
                                –
                              </button>

                              <input
                                value={it.qtd}
                                onChange={(e) => setQtdItem(it.id, Number(e.target.value))}
                                className="w-12 h-9 text-center font-extrabold text-sm outline-none"
                                inputMode="numeric"
                              />

                              <button onClick={() => incItem(it.id)} className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold">
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(it.id)}
                              className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-extrabold"
                            >
                              Excluir
                            </button>

                            <div className="ml-auto font-extrabold text-gray-900">{brl(it.preco * it.qtd)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* dados comprador */}
              <div className="bg-gray-50 border rounded-3xl p-4">
                <div className="font-extrabold text-gray-900">Dados do comprador</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600">Nome</label>
                    <input
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      className="mt-1 w-full rounded-2xl border px-3 py-2 bg-white outline-none focus:ring-4 focus:ring-blue-100"
                      placeholder="Nome do cliente"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-600">WhatsApp</label>
                    <input
                      value={clienteTelefone}
                      onChange={(e) => setClienteTelefone(e.target.value)}
                      className={`mt-1 w-full rounded-2xl border px-3 py-2 bg-white outline-none focus:ring-4 ${
                        !clienteTelefone || isValidPhoneBR(clienteTelefone) ? "focus:ring-blue-100" : "focus:ring-red-100 border-red-300"
                      }`}
                      placeholder="(11) 9xxxx-xxxx"
                      inputMode="tel"
                    />
                    {clienteTelefone && !isValidPhoneBR(clienteTelefone) ? (
                      <div className="text-[11px] text-red-600 mt-1">Digite um telefone válido (com DDD).</div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs font-bold text-gray-600">Observações</label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-2xl border px-3 py-2 bg-white outline-none focus:ring-4 focus:ring-blue-100"
                    placeholder="Ex.: precisa NF, urgência, etc."
                  />
                </div>
              </div>

              {/* entrega/retirada */}
              <div className="bg-gray-50 border rounded-3xl p-4">
                <div className="font-extrabold text-gray-900">Retirada ou entrega</div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setTipoEntrega("ENTREGA")}
                    className={`px-4 py-2 rounded-2xl font-extrabold border ${
                      tipoEntrega === "ENTREGA" ? "bg-blue-700 text-white border-blue-700" : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    Entrega
                  </button>
                  <button
                    onClick={() => setTipoEntrega("RETIRADA")}
                    className={`px-4 py-2 rounded-2xl font-extrabold border ${
                      tipoEntrega === "RETIRADA" ? "bg-blue-700 text-white border-blue-700" : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    Retirada
                  </button>
                </div>

                {tipoEntrega === "ENTREGA" ? (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-gray-600">Endereço</label>
                      <input
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        className="mt-1 w-full rounded-2xl border px-3 py-2 bg-white outline-none focus:ring-4 focus:ring-blue-100"
                        placeholder="Rua / Avenida"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-600">Número</label>
                      <input
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        className="mt-1 w-full rounded-2xl border px-3 py-2 bg-white outline-none focus:ring-4 focus:ring-blue-100"
                        placeholder="123"
                        inputMode="numeric"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-600">Bairro</label>
                      <input
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        className="mt-1 w-full rounded-2xl border px-3 py-2 bg-white outline-none focus:ring-4 focus:ring-blue-100"
                        placeholder="Bairro"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-600">Cidade (opcional)</label>
                      <input
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        className="mt-1 w-full rounded-2xl border px-3 py-2 bg-white outline-none focus:ring-4 focus:ring-blue-100"
                        placeholder="Cidade"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-600">Referência (opcional)</label>
                      <input
                        value={referencia}
                        onChange={(e) => setReferencia(e.target.value)}
                        className="mt-1 w-full rounded-2xl border px-3 py-2 bg-white outline-none focus:ring-4 focus:ring-blue-100"
                        placeholder="Próximo a..."
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-gray-600">Taxa de entrega</label>
                      <input
                        value={String(taxaEntrega ?? 0)}
                        onChange={(e) => setTaxaEntrega(Number(e.target.value.replace(",", ".")) || 0)}
                        className="mt-1 w-full rounded-2xl border px-3 py-2 bg-white outline-none focus:ring-4 focus:ring-blue-100"
                        placeholder="0"
                        inputMode="decimal"
                      />
                      <div className="text-[11px] text-gray-500 mt-1">Se quiser, deixe 0 e combine no WhatsApp.</div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-gray-700 bg-white border rounded-2xl p-3">
                    ✅ Retirada na loja — confirme horário no WhatsApp.
                  </div>
                )}
              </div>

              {/* pagamento */}
              <div className="bg-gray-50 border rounded-3xl p-4">
                <div className="font-extrabold text-gray-900">Forma de pagamento</div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(["PIX", "CARTAO", "DINHEIRO", "TRANSFERENCIA", "COMBINAR"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPagamento(m)}
                      className={`px-3 py-2 rounded-2xl font-extrabold border text-sm ${
                        pagamento === m ? "bg-blue-700 text-white border-blue-700" : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {pagamento === "DINHEIRO" ? (
                  <div className="mt-3">
                    <label className="text-xs font-bold text-gray-600">Troco para (opcional)</label>
                    <input
                      value={trocoPara}
                      onChange={(e) => setTrocoPara(e.target.value)}
                      className="mt-1 w-full rounded-2xl border px-3 py-2 bg-white outline-none focus:ring-4 focus:ring-blue-100"
                      placeholder={`Ex.: ${brl(total + 10)}`}
                      inputMode="decimal"
                    />
                    {trocoPara.trim() && Number(trocoPara.replace(",", ".")) < total ? (
                      <div className="text-[11px] text-red-600 mt-1">Troco precisa ser maior ou igual ao total.</div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* resumo */}
              <div className="bg-white border rounded-3xl p-4 shadow-sm">
                <div className="font-extrabold text-gray-900">Resumo</div>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-extrabold">{brl(subtotal)}</span>
                  </div>

                  {tipoEntrega === "ENTREGA" ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxa entrega</span>
                      <span className="font-extrabold">{brl(taxaEntrega)}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between text-base">
                    <span className="text-gray-900 font-extrabold">TOTAL</span>
                    <span className="text-blue-900 font-extrabold">{brl(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="p-4 border-t bg-white">
              <a
                href={waLink(WHATS, mensagemWhats)}
                target="_blank"
                rel="noreferrer"
                className={`w-full block text-center py-3 rounded-2xl font-extrabold ${
                  canCheckout ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-200 text-gray-500 pointer-events-none"
                }`}
              >
                Finalizar no WhatsApp
              </a>

              {!canCheckout ? (
                <div className="mt-2 text-[11px] text-gray-500">
                  Preencha: <b>nome</b>, <b>telefone</b>
                  {tipoEntrega === "ENTREGA" ? (
                    <>
                      , <b>endereço</b>, <b>número</b>, <b>bairro</b>
                    </>
                  ) : null}
                  .
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* botão carrinho */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-full shadow-lg text-lg font-extrabold hover:bg-green-700 transition"
      >
        🛒 Carrinho ({qtdCarrinho})
      </button>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="max-w-6xl mx-auto mt-4 space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bg-white border rounded-2xl p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-gray-100 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
              <div className="mt-2 h-3 w-64 bg-gray-100 rounded animate-pulse" />
              <div className="mt-2 h-3 w-28 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-10 w-24 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
