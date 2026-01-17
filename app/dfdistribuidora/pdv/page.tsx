"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

/* =========================
   CONFIG
========================= */
const PROD_TABLE = "df_produtos";
const RPC_SEARCH = "df_search_produtos"; // se não existir, fallback
const WHATS = "5511952068432";
const TAXA_ENTREGA_FIXA = 10;

const HOME_LIMIT = 10; // ✅ deixa leve
const SEARCH_LIMIT = 80; // ✅ resultados da busca
const SEARCH_DEBOUNCE = 350; // ms
const ESTOQUE_LABEL_LOW = 5; // só pra badge "baixo"

/* =========================
   TIPOS
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

type CartItem = {
  id: string;
  ean: string;
  nome: string;
  imagem: string | null;
  preco: number;
  qtd: number;
};

/* =========================
   HELPERS
========================= */
function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function firstImg(imagens?: string[] | null) {
  return imagens?.[0] || "/produtos/caixa-padrao.png";
}

function calcOff(pmc?: number | null, promo?: number | null) {
  const a = Number(pmc || 0);
  const b = Number(promo || 0);
  if (!a || !b || b >= a) return 0;
  return Math.round(((a - b) / a) * 100);
}

function precoFinal(p: DFProduto) {
  const pmc = Number(p.pmc || 0);
  const promo = Number(p.preco_promocional || 0);
  const emPromo = !!p.em_promocao && promo > 0 && (!pmc || promo < pmc);
  const final = emPromo ? promo : pmc;
  const off = emPromo
    ? p.percentual_off && p.percentual_off > 0
      ? p.percentual_off
      : calcOff(pmc, promo)
    : 0;
  return { emPromo, final, pmc, promo, off };
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function waLink(phone: string, msg: string) {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

function normalizeSearch(raw: string) {
  return raw
    .toLowerCase()
    .replace(/(\d+)\s*(mg|ml|mcg|g|ui|iu)/gi, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================
   COMPONENTE
========================= */
export default function PDVDF() {
  // ✅ home leve
  const [home, setHome] = useState<DFProduto[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);

  // ✅ busca remota (todo banco)
  const [busca, setBusca] = useState("");
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [resultado, setResultado] = useState<DFProduto[]>([]);

  // carrinho
  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // checkout
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [tipoEntrega, setTipoEntrega] = useState<"ENTREGA" | "RETIRADA">("ENTREGA");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");

  const [pagamento, setPagamento] = useState<"PIX" | "CARTAO" | "DINHEIRO" | "COMBINAR">("PIX");

  // ✅ estado de salvar
  const [saving, setSaving] = useState(false);
  const [pedidoCriado, setPedidoCriado] = useState<string | null>(null);

  const taxaEntrega = tipoEntrega === "ENTREGA" ? TAXA_ENTREGA_FIXA : 0;

  const isSearching = !!busca.trim();
  const lista = isSearching ? resultado : home;

  // ✅ mapa de estoque por produto (pra travar inc/add no carrinho)
  const estoqueById = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of home) m.set(p.id, Number(p.estoque ?? 0));
    for (const p of resultado) m.set(p.id, Number(p.estoque ?? 0));
    return m;
  }, [home, resultado]);

  /* =========================
     HOME (10 itens)
  ========================= */
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
          .order("destaque_home", { ascending: false })
          .order("em_promocao", { ascending: false })
          .order("nome", { ascending: true })
          .limit(HOME_LIMIT);

        if (error) throw error;
        setHome(((data || []) as DFProduto[]) ?? []);
      } catch (e) {
        console.error("Erro loadHome:", e);
        setHome([]);
      } finally {
        setLoadingHome(false);
      }
    }

    loadHome();
  }, []);

  /* =========================
     BUSCA REMOTA (todo banco)
  ========================= */
  useEffect(() => {
    async function run() {
      const raw = busca.trim();
      if (!raw) {
        setResultado([]);
        return;
      }

      setLoadingBusca(true);

      try {
        const normalized = normalizeSearch(raw);

        // 1) tenta RPC (se existir)
        const { data, error } = await supabase.rpc(RPC_SEARCH, {
          q: normalized,
          lim: SEARCH_LIMIT,
        });
        if (error) throw error;

        setResultado(((data || []) as DFProduto[]) ?? []);
      } catch (e) {
        // 2) fallback sem RPC
        try {
          const digits = onlyDigits(raw);

          let query = supabase
            .from(PROD_TABLE)
            .select(
              "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens,estoque"
            )
            .eq("ativo", true)
            .limit(SEARCH_LIMIT);

          if (digits.length >= 8 && digits.length <= 14) {
            query = query.or(`ean.eq.${digits},nome.ilike.%${raw}%`);
          } else {
            query = query.ilike("nome", `%${raw}%`);
          }

          const { data, error } = await query
            .order("em_promocao", { ascending: false })
            .order("nome", { ascending: true });

          if (error) throw error;

          setResultado(((data || []) as DFProduto[]) ?? []);
        } catch (e2) {
          console.error("Erro fallback busca:", e2);
          setResultado([]);
        }
      } finally {
        setLoadingBusca(false);
      }
    }

    const t = setTimeout(run, SEARCH_DEBOUNCE);
    return () => clearTimeout(t);
  }, [busca]);

  /* =========================
     CARRINHO (com trava de estoque)
  ========================= */
  function addProduto(p: DFProduto) {
    const estoqueAtual = Number(p.estoque ?? 0);
    if (estoqueAtual <= 0) return; // ✅ não adiciona

    const pr = precoFinal(p);
    const preco = Number(pr.final || 0);

    setCarrinho((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        if (copy[idx].qtd >= estoqueAtual) return copy;
        copy[idx] = { ...copy[idx], qtd: copy[idx].qtd + 1, preco };
        return copy;
      }
      return [
        ...prev,
        {
          id: p.id,
          ean: p.ean,
          nome: p.nome,
          imagem: firstImg(p.imagens),
          preco,
          qtd: 1,
        },
      ];
    });

    // quando adiciona algo, limpa mensagem de sucesso anterior
    setPedidoCriado(null);
  }

  function inc(id: string) {
    const estoqueAtual = Number(estoqueById.get(id) ?? 0);
    if (estoqueAtual <= 0) return;

    setCarrinho((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        if (x.qtd >= estoqueAtual) return x;
        return { ...x, qtd: x.qtd + 1 };
      })
    );
  }

  function dec(id: string) {
    setCarrinho((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, qtd: x.qtd - 1 } : x))
        .filter((x) => x.qtd > 0)
    );
  }

  function remove(id: string) {
    setCarrinho((prev) => prev.filter((x) => x.id !== id));
  }

  function setQtd(id: string, qtd: number) {
    const estoqueAtual = Number(estoqueById.get(id) ?? 0);
    const alvo = Math.max(1, Math.floor(Number(qtd || 1)));
    const travado = estoqueAtual > 0 ? Math.min(alvo, estoqueAtual) : 1;

    setCarrinho((prev) =>
      prev.map((x) => (x.id === id ? { ...x, qtd: travado } : x))
    );
  }

  const subtotal = useMemo(
    () => carrinho.reduce((a, b) => a + b.preco * b.qtd, 0),
    [carrinho]
  );
  const total = subtotal + taxaEntrega;

  const qtdCarrinho = useMemo(
    () => carrinho.reduce((acc, it) => acc + it.qtd, 0),
    [carrinho]
  );

  /* =========================
     ENCOMENDAR (quando indisponível)
  ========================= */
  function encomendar(p: DFProduto) {
    const msg =
      `Olá! Quero encomendar este item:\n\n` +
      `• ${p.nome} (EAN: ${p.ean})\n` +
      (p.apresentacao ? `• Apresentação: ${p.apresentacao}\n` : "") +
      (p.laboratorio ? `• Laboratório: ${p.laboratorio}\n` : "") +
      `\nPode me avisar prazo e valor?`;
    window.open(waLink(WHATS, msg), "_blank");
  }

  /* =========================
     WHATS (opcional)
  ========================= */
  const mensagem = useMemo(() => {
    let msg = `🧾 *Pedido DF Distribuidora (PDV)*\n\n`;
    msg += `👤 Cliente: ${clienteNome}\n`;
    msg += `📞 WhatsApp: ${clienteTelefone}\n\n`;

    msg +=
      tipoEntrega === "ENTREGA"
        ? `🚚 *Entrega*\n${endereco}, ${numero} - ${bairro}\nTaxa: ${brl(taxaEntrega)}\n\n`
        : `🏪 *Retirada na loja*\n\n`;

    msg += `💳 Pagamento: ${pagamento}\n\n🛒 *Itens:*\n`;
    carrinho.forEach((i) => {
      msg += `• ${i.nome} (${i.ean}) — ${i.qtd}x — ${brl(i.preco * i.qtd)}\n`;
    });

    msg += `\nSubtotal: ${brl(subtotal)}\n`;
    msg += `Total: ${brl(total)}\n\n`;
    msg += `Pode confirmar?`;

    return msg;
  }, [
    carrinho,
    clienteNome,
    clienteTelefone,
    tipoEntrega,
    endereco,
    numero,
    bairro,
    pagamento,
    subtotal,
    total,
    taxaEntrega,
  ]);

  const canCheckout = useMemo(() => {
    if (carrinho.length === 0) return false;
    if (!clienteNome.trim()) return false;
    if (onlyDigits(clienteTelefone).length < 10) return false;
    if (tipoEntrega === "ENTREGA") {
      if (!endereco.trim() || !numero.trim() || !bairro.trim()) return false;
    }
    return true;
  }, [carrinho.length, clienteNome, clienteTelefone, tipoEntrega, endereco, numero, bairro]);

  /* =========================
     ✅ FINALIZAR PDV (baixa estoque)
  ========================= */
  async function criarPedidoNoPainelPDV() {
    const itens = carrinho.map((i) => ({
      ean: i.ean,
      nome: i.nome,
      qtd: i.qtd,
      preco: i.preco,
      subtotal: i.preco * i.qtd,
    }));

    // ✅ pede comanda
    const comandaRaw = window.prompt("Número da comanda:", "");
    const comanda = (comandaRaw || "").trim() || null;

    const { data, error } = await supabase.rpc("df_checkout", {
      p_canal: "PDV",
      p_comanda: comanda,

      p_cliente_nome: clienteNome.trim(),
      p_cliente_whatsapp: onlyDigits(clienteTelefone),

      p_cliente_cpf: null,
      p_cliente_nome_fantasia: null,

      p_tipo_entrega: tipoEntrega,
      p_endereco: tipoEntrega === "ENTREGA" ? endereco.trim() : null,
      p_numero: tipoEntrega === "ENTREGA" ? numero.trim() : null,
      p_bairro: tipoEntrega === "ENTREGA" ? bairro.trim() : null,

      p_pagamento: pagamento,
      p_taxa_entrega: taxaEntrega,
      p_subtotal: subtotal,
      p_total: total,

      p_itens: itens,
    });

    if (error) throw error;
    return (data as string) || "";
  }

  async function finalizarPDV() {
    if (!canCheckout || saving) return;

    setSaving(true);
    try {
      const pedidoId = await criarPedidoNoPainelPDV();

      // ✅ frase no meio
      setPedidoCriado(pedidoId || "OK");

      // limpa carrinho
      setCarrinho([]);

      // ✅ força recarregar pra atualizar estoques na vitrine
      setTimeout(() => window.location.reload(), 700);
    } catch (e) {
      console.error(e);
      alert("Não consegui finalizar/baixar estoque. Verifique a função df_checkout e permissões.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      {/* LOGO */}
      <div className="flex justify-center mb-4">
        <Image src="/df-distribuidora-logo.png" alt="DF Distribuidora" width={120} height={120} />
      </div>

      <h1 className="text-2xl font-extrabold text-center mb-4">PDV — DF Distribuidora</h1>

      {/* BUSCA */}
      <div className="relative">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto ou EAN..."
          className="w-full p-3 border rounded-2xl mb-2 outline-none focus:ring-4 focus:ring-blue-100"
        />
        {busca.trim() ? (
          <button
            onClick={() => setBusca("")}
            className="absolute right-2 top-2 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-extrabold"
          >
            Limpar
          </button>
        ) : null}
      </div>

      {isSearching ? (
        <div className="text-xs text-gray-500 mb-3">
          {loadingBusca ? "Buscando…" : resultado.length ? `${resultado.length} resultado(s)` : "Nenhum resultado"}
        </div>
      ) : (
        <div className="text-xs text-gray-500 mb-3">
          {loadingHome ? "Carregando vitrine…" : `Vitrine leve: ${home.length} itens`}
        </div>
      )}

      {/* LISTA */}
      <div className="space-y-3">
        {loadingHome && !isSearching ? (
          <div className="bg-white border rounded-2xl p-4 text-gray-600">Carregando…</div>
        ) : (
          lista.map((p) => {
            const pr = precoFinal(p);
            const estoqueAtual = Number(p.estoque ?? 0);
            const indisponivel = estoqueAtual <= 0;

            return (
              <div key={p.id} className="bg-white p-3 rounded-2xl border flex justify-between items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 rounded-xl bg-gray-50 border overflow-hidden flex items-center justify-center">
                    <Image src={firstImg(p.imagens)} alt={p.nome} width={48} height={48} className="object-contain" />
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold line-clamp-1">{p.nome}</div>

                    <div className="text-blue-700 font-extrabold">
                      {brl(pr.final)}
                      {pr.emPromo && pr.off > 0 ? (
                        <span className="ml-2 text-[11px] font-extrabold bg-red-600 text-white px-2 py-1 rounded-full">
                          {pr.off}% OFF
                        </span>
                      ) : null}
                    </div>

                    <div className="text-xs text-gray-500 line-clamp-1">
                      {p.laboratorio || "—"} {p.apresentacao ? `• ${p.apresentacao}` : ""}
                    </div>

                    <div className="mt-1 text-[11px]">
                      {indisponivel ? (
                        <span className="font-extrabold text-gray-500">Sem estoque</span>
                      ) : estoqueAtual <= ESTOQUE_LABEL_LOW ? (
                        <span className="font-extrabold text-yellow-700">Estoque baixo: {estoqueAtual}</span>
                      ) : (
                        <span className="font-bold text-gray-500">Estoque: {estoqueAtual}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AÇÕES */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => addProduto(p)}
                    disabled={indisponivel}
                    className={`px-4 py-2 rounded-xl font-extrabold ${
                      indisponivel ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                    title={indisponivel ? "Sem estoque" : "Adicionar ao carrinho"}
                  >
                    {indisponivel ? "Indisponível" : "+"}
                  </button>

                  {indisponivel ? (
                    <button
                      onClick={() => encomendar(p)}
                      className="px-4 py-2 rounded-xl font-extrabold bg-green-600 hover:bg-green-700 text-white"
                      title="Pedir por encomenda no WhatsApp"
                    >
                      Encomendar
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* BOTÃO CARRINHO */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-full font-extrabold shadow-lg"
      >
        🛒 Carrinho ({qtdCarrinho})
      </button>

      {/* DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />

          <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white p-4 overflow-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold">Carrinho</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-3 py-2 rounded-xl border font-extrabold"
              >
                Continuar comprando
              </button>
            </div>

            {/* ✅ CONFIRMAÇÃO NO MEIO */}
            {pedidoCriado ? (
              <div className="mt-6 rounded-2xl border bg-green-50 p-4">
                <div className="text-lg font-extrabold text-green-700">Pedido finalizado com sucesso ✅</div>
                <div className="text-sm text-gray-700 mt-1">
                  Pedido criado no sistema: <b>{pedidoCriado}</b>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      setPedidoCriado(null);
                      setDrawerOpen(false);
                    }}
                    className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white py-3 font-extrabold"
                  >
                    Voltar
                  </button>

                  <button
                    onClick={() => window.open(waLink(WHATS, `✅ Pedido PDV: ${pedidoCriado}\n\n${mensagem}`), "_blank")}
                    className="w-full rounded-xl border py-3 font-extrabold hover:bg-gray-50"
                  >
                    Enviar no WhatsApp (opcional)
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-4">
              {carrinho.length === 0 ? (
                <div className="text-gray-600 bg-gray-50 border rounded-2xl p-4">Seu carrinho está vazio.</div>
              ) : (
                carrinho.map((i) => {
                  const estoqueAtual = Number(estoqueById.get(i.id) ?? 0);
                  const max = Math.max(1, estoqueAtual || 1);
                  const travado = estoqueAtual > 0 ? Math.min(i.qtd, estoqueAtual) : i.qtd;

                  return (
                    <div key={i.id} className="border rounded-xl p-3 mb-2">
                      <div className="font-bold">{i.nome}</div>
                      <div className="text-sm text-gray-600">{brl(i.preco)}</div>

                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => dec(i.id)} className="px-3 py-1 bg-gray-200 rounded font-extrabold">
                          -
                        </button>

                        <input
                          type="number"
                          min={1}
                          max={max}
                          value={travado}
                          onChange={(e) => setQtd(i.id, Number(e.target.value))}
                          className="w-16 border rounded px-2 py-1 text-center font-extrabold"
                        />

                        <button
                          onClick={() => inc(i.id)}
                          disabled={estoqueAtual > 0 ? i.qtd >= estoqueAtual : false}
                          className={`px-3 py-1 rounded font-extrabold ${
                            estoqueAtual > 0 && i.qtd >= estoqueAtual
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          +
                        </button>

                        <button onClick={() => remove(i.id)} className="ml-auto text-red-600 font-extrabold">
                          Excluir
                        </button>
                      </div>

                      <div className="mt-2 font-extrabold text-blue-900">Total item: {brl(i.preco * i.qtd)}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* DADOS */}
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
                  className={`px-3 py-2 rounded flex-1 ${tipoEntrega === "ENTREGA" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
                  Entrega
                </button>

                <button
                  onClick={() => setTipoEntrega("RETIRADA")}
                  className={`px-3 py-2 rounded flex-1 ${tipoEntrega === "RETIRADA" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
                  Retirada
                </button>
              </div>

              {tipoEntrega === "ENTREGA" && (
                <div className="mt-3 space-y-2">
                  <input placeholder="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full border p-2 rounded" />
                  <input placeholder="Número" value={numero} onChange={(e) => setNumero(e.target.value)} className="w-full border p-2 rounded" />
                  <input placeholder="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} className="w-full border p-2 rounded" />
                  <div className="text-sm font-bold">Taxa fixa: {brl(taxaEntrega)}</div>
                </div>
              )}
            </div>

            {/* PAGAMENTO */}
            <div className="mt-4">
              <div className="font-bold mb-2">Pagamento</div>

              <div className="flex flex-wrap gap-2">
                {["PIX", "CARTAO", "DINHEIRO", "COMBINAR"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPagamento(p as any)}
                    className={`px-3 py-2 rounded ${pagamento === p ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* TOTAL */}
            <div className="mt-4 border-t pt-3">
              <div>Subtotal: {brl(subtotal)}</div>
              <div>Taxa: {brl(taxaEntrega)}</div>
              <div className="font-extrabold text-lg">Total: {brl(total)}</div>
            </div>

            {/* ✅ FINALIZAR (BAIXA ESTOQUE) */}
            <button
              disabled={!canCheckout || saving || !!pedidoCriado}
              onClick={finalizarPDV}
              className={`w-full mt-4 text-center py-3 rounded-xl font-extrabold ${
                canCheckout ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-200 text-gray-500"
              } ${saving ? "opacity-70 cursor-wait" : ""}`}
              title={canCheckout ? "Finalizar e baixar estoque" : "Preencha nome/Whats e itens (e endereço se entrega)."}
            >
              {saving ? "Finalizando..." : "Finalizar (baixar estoque)"}
            </button>

            {!canCheckout ? (
              <div className="mt-2 text-xs text-gray-500">
                Para liberar o botão: informe <b>Nome</b>, <b>WhatsApp</b>, e adicione itens.
                Se escolher <b>Entrega</b>, preencha <b>Endereço/Número/Bairro</b>.
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
