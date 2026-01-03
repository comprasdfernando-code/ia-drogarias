"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ProdutoModalPDV from "@/components/ProdutoModalPDV";



// ✅ evita prerender quebrar no Vercel (App Router)
export const dynamic = "force-dynamic";

type Produto = {
  id: string;
  nome: string;
  preco: number; // se vendido_por="kg", é PREÇO POR KG
  imagem_url?: string | null;
  vendido_por?: "unidade" | "kg" | string;
  descricao?: string | null;
};

type ItemCarrinho = {
  id: string;
  produto_id: string;
  nome: string;
  preco: number; // preço unitário ou preço/kg
  quantidade: number; // unidade (int) ou kg (decimal)
  vendido_por: "unidade" | "kg";
};

type VendaPre = {
  id: string;
  data: string;
  total: number;
  status: string;
  observacoes?: string | null;
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function isKg(p: Produto) {
  return String(p.vendido_por || "unidade").toLowerCase() === "kg";
}

function parseComandaFromObs(obs?: string | null) {
  if (!obs) return null;
  // aceita "COMANDA: 100" ou "COMANDA 100"
  const m = obs.match(/COMANDA\s*:?\s*([A-Za-z0-9_-]+)/i);
  return m?.[1] || null;
}

function upsertComandaObs(obs: string | null | undefined, comanda: string) {
  const base = (obs || "").trim();
  // remove comanda antiga se existir
  const sem = base.replace(/COMANDA\s*:?\s*[A-Za-z0-9_-]+/gi, "").trim();
  const nova = `COMANDA: ${comanda}`;
  return sem ? `${nova} | ${sem}` : nova;
}

function PDVInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preIdFromUrl = searchParams.get("id") || "";

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [loadingProdutos, setLoadingProdutos] = useState(true);

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  const [preVendas, setPreVendas] = useState<VendaPre[]>([]);
  const [loadingPre, setLoadingPre] = useState(true);

  const [preVendaId, setPreVendaId] = useState<string>(preIdFromUrl);
  const [salvando, setSalvando] = useState(false);

  // ✅ modal para produto por KG
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);

  // ✅ evita abrir a mesma comanda 2x (isso causava “dobrar” em alguns fluxos)
  const abrindoRef = useRef<string | null>(null);

  // 🔄 carregar produtos
  useEffect(() => {
    (async () => {
      setLoadingProdutos(true);
      const { data, error } = await supabase
        .from("gigante_produtos")
        .select("id,nome,preco,imagem_url,vendido_por,descricao")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) console.error(error);
      setProdutos((data as any) || []);
      setLoadingProdutos(false);
    })();
  }, []);

  // 🔄 carregar lista de pré-vendas (comandas abertas)
  async function carregarPreVendas() {
    setLoadingPre(true);
    const { data, error } = await supabase
      .from("gigante_vendas")
      .select("id,data,total,status,observacoes")
      .eq("origem", "PDV")
      .eq("status", "pre_venda")
      .order("data", { ascending: false })
      .limit(120);

    if (error) console.error(error);
    setPreVendas((data as any) || []);
    setLoadingPre(false);
  }

  useEffect(() => {
    carregarPreVendas();
  }, []);

  // 🔄 se vier ?id=... na URL, abre a pré-venda automaticamente
  useEffect(() => {
    if (!preIdFromUrl) return;
    if (preIdFromUrl === preVendaId) return;
    abrirPreVenda(preIdFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preIdFromUrl]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return produtos;
    return produtos.filter((p) => p.nome.toLowerCase().includes(q));
  }, [busca, produtos]);

  const total = useMemo(() => {
    return carrinho.reduce(
      (acc, i) => acc + Number(i.preco) * Number(i.quantidade),
      0
    );
  }, [carrinho]);

  // ✅ clique no card: se for KG abre modal, se for unidade adiciona direto
  function onClickProduto(p: Produto) {
    if (isKg(p)) {
      setProdutoSelecionado(p);
      return;
    }
    addProdutoUnidade(p);
  }

  function addProdutoUnidade(p: Produto) {
    setCarrinho((prev) => {
      const ex = prev.find(
        (x) => x.produto_id === p.id && x.vendido_por === "unidade"
      );
      if (ex) {
        return prev.map((x) =>
          x.produto_id === p.id && x.vendido_por === "unidade"
            ? { ...x, quantidade: x.quantidade + 1 }
            : x
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          produto_id: p.id,
          nome: p.nome,
          preco: Number(p.preco),
          quantidade: 1,
          vendido_por: "unidade",
        },
      ];
    });
    setBusca("");
  }

  // ✅ adiciona item por KG (quantidade = kg decimal)
  function addProdutoKg(p: Produto, kg: number) {
    setCarrinho((prev) => {
      const ex = prev.find(
        (x) => x.produto_id === p.id && x.vendido_por === "kg"
      );
      if (ex) {
        // soma peso (você pode trocar por "substituir" se preferir)
        return prev.map((x) =>
          x.produto_id === p.id && x.vendido_por === "kg"
            ? { ...x, quantidade: Number((x.quantidade + kg).toFixed(3)) }
            : x
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          produto_id: p.id,
          nome: p.nome,
          preco: Number(p.preco), // preço por KG
          quantidade: Number(kg.toFixed(3)),
          vendido_por: "kg",
        },
      ];
    });
    setBusca("");
  }

  function incUn(produto_id: string) {
    setCarrinho((prev) =>
      prev.map((x) =>
        x.produto_id === produto_id && x.vendido_por === "unidade"
          ? { ...x, quantidade: x.quantidade + 1 }
          : x
      )
    );
  }

  function decUn(produto_id: string) {
    setCarrinho((prev) =>
      prev
        .map((x) =>
          x.produto_id === produto_id && x.vendido_por === "unidade"
            ? { ...x, quantidade: Math.max(1, x.quantidade - 1) }
            : x
        )
        .filter((x) => x.quantidade > 0)
    );
  }

  function setKg(produto_id: string, kg: number) {
    setCarrinho((prev) =>
      prev.map((x) =>
        x.produto_id === produto_id && x.vendido_por === "kg"
          ? { ...x, quantidade: Number(Math.max(0.001, kg).toFixed(3)) }
          : x
      )
    );
  }

  function removerItem(idItem: string) {
    setCarrinho((prev) => prev.filter((x) => x.id !== idItem));
  }

  function limpar() {
    setCarrinho([]);
    setPreVendaId("");
    router.replace("/gigante/pdv");
  }

  // ✅ abrir pré-venda (carregar itens no carrinho)
  async function abrirPreVenda(id: string) {
    if (!id) return;

    // evita dupla abertura
    if (abrindoRef.current === id) return;
    abrindoRef.current = id;

    try {
      setSalvando(true);

      const { data: v, error: ev } = await supabase
        .from("gigante_vendas")
        .select("id,status,observacoes")
        .eq("id", id)
        .single();

      if (ev || !v) throw ev || new Error("Pré-venda não encontrada");

      const { data: its, error: ei } = await supabase
        .from("gigante_venda_itens")
        .select("produto_id,nome,preco,quantidade,subtotal,criado_em")
        .eq("venda_id", id) // ✅ garante que vem SÓ dessa comanda
        .order("criado_em", { ascending: true });

      if (ei) throw ei;

      // ✅ substitui o carrinho inteiro (não concatena)
      // ✅ agrupa por produto_id + preço (pra evitar duplicado no banco)
      const mapa = new Map<string, ItemCarrinho>();

      for (const it of its || []) {
        const quantidade = Number(it.quantidade || 0);
        const preco = Number(it.preco || 0);

        // heurística: se quantidade tiver decimal -> é KG
        const vendido_por: "kg" | "unidade" =
          String(quantidade).includes(".") ? "kg" : "unidade";

        const key = `${it.produto_id}::${vendido_por}::${preco}`;
        const atual = mapa.get(key);

        if (!atual) {
          mapa.set(key, {
            id: crypto.randomUUID(),
            produto_id: it.produto_id,
            nome: it.nome,
            preco,
            quantidade,
            vendido_por,
          });
        } else {
          mapa.set(key, {
            ...atual,
            quantidade:
              vendido_por === "kg"
                ? Number((atual.quantidade + quantidade).toFixed(3))
                : atual.quantidade + quantidade,
          });
        }
      }

      setCarrinho(Array.from(mapa.values()));
      setPreVendaId(id);
      router.replace(`/gigante/pdv?id=${id}`);
    } catch (e) {
      console.error(e);
      alert("Erro ao abrir comanda.");
    } finally {
      abrindoRef.current = null;
      setSalvando(false);
    }
  }

  // ✅ salvar pré-venda (cria ou atualiza)
  // ✅ se for NOVA, pede número da comanda e depois limpa (zera itens)
  async function salvarPreVenda() {
    if (carrinho.length === 0) {
      alert("Carrinho vazio.");
      return;
    }

    try {
      setSalvando(true);

      let id = preVendaId;

      // pega observacoes atual se for update
      let obsAtual: string | null = null;
      if (id) {
        const { data: vv } = await supabase
          .from("gigante_vendas")
          .select("observacoes")
          .eq("id", id)
          .single();
        obsAtual = (vv as any)?.observacoes ?? null;
      }

      // ✅ se for nova comanda, pede número e salva em observacoes
      let comandaNumero = parseComandaFromObs(obsAtual);
      if (!id) {
        const resp = prompt("Número da comanda (ex: 100):");
        if (!resp) {
          setSalvando(false);
          return;
        }
        comandaNumero = resp.trim();
        if (!comandaNumero) {
          setSalvando(false);
          return;
        }
      }

      const payloadVenda: any = {
        data: new Date().toISOString(),
        subtotal: total,
        frete: 0,
        total: total,
        origem: "PDV",
        status: "pre_venda",
        tipo_entrega: "retirada",
        metodo_pagamento: null,
        pagamento_detalhe: null,
        // guarda comanda nas observações
        observacoes: comandaNumero ? upsertComandaObs(obsAtual, comandaNumero) : obsAtual,
      };

      if (!id) {
        const { data: venda, error: ev } = await supabase
          .from("gigante_vendas")
          .insert(payloadVenda)
          .select("id")
          .single();

        if (ev) throw ev;
        id = venda.id;
      } else {
        const { error: eu } = await supabase
          .from("gigante_vendas")
          .update(payloadVenda)
          .eq("id", id);

        if (eu) throw eu;

        // limpa itens antigos (pra não duplicar no banco)
        const { error: ed } = await supabase
          .from("gigante_venda_itens")
          .delete()
          .eq("venda_id", id);

        if (ed) throw ed;
      }

      // insere itens
      const itens = carrinho.map((i) => ({
        venda_id: id,
        produto_id: i.produto_id,
        nome: i.nome,
        quantidade: Number(i.quantidade),
        preco: Number(i.preco),
        subtotal: Number(i.preco) * Number(i.quantidade),
      }));

      const { error: ei } = await supabase
        .from("gigante_venda_itens")
        .insert(itens);

      if (ei) throw ei;

      await carregarPreVendas();

      // ✅ se era nova: limpa tudo e volta pra nova comanda
      if (!preVendaId) {
        alert(`Comanda ${String(comandaNumero)} salva ✅`);
        limpar();
        return;
      }

      alert(`Comanda atualizada ✅`);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar comanda. Veja o console.");
    } finally {
      setSalvando(false);
    }
  }

  // ✅ excluir pré-venda
  async function excluirPreVenda(vendaId: string) {
    if (!confirm("Excluir esta comanda?")) return;

    try {
      setSalvando(true);

      const { error: ed } = await supabase
        .from("gigante_venda_itens")
        .delete()
        .eq("venda_id", vendaId);
      if (ed) throw ed;

      const { error: ev } = await supabase
        .from("gigante_vendas")
        .delete()
        .eq("id", vendaId);
      if (ev) throw ev;

      await carregarPreVendas();

      if (preVendaId === vendaId) {
        limpar();
      }

      alert("Comanda excluída ✅");
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir comanda.");
    } finally {
      setSalvando(false);
    }
  }

  // header label comanda
  const comandaAtualLabel = useMemo(() => {
    if (!preVendaId) return "Nova comanda";
    const venda = preVendas.find((x) => x.id === preVendaId);
    const c = parseComandaFromObs(venda?.observacoes);
    return c ? `Comanda ${c}` : `Comanda #${preVendaId.slice(0, 6).toUpperCase()}`;
  }, [preVendaId, preVendas]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-red-700 to-orange-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-extrabold">🧾 PDV — Pré-venda</div>
            <div className="text-xs opacity-90">{comandaAtualLabel}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={salvarPreVenda}
              disabled={salvando}
              className={`px-4 py-2 rounded bg-yellow-400 text-black font-extrabold hover:bg-yellow-300 ${
                salvando ? "opacity-70" : ""
              }`}
              title="Salvar comanda"
            >
              🔗 Salvar Pré-venda
            </button>

            <button
              onClick={limpar}
              className="px-4 py-2 rounded bg-white/15 hover:bg-white/25 border border-white/30"
              title="Nova comanda"
            >
              🧹 Limpar
            </button>
          </div>
        </div>

        {/* Busca */}
        <div className="max-w-6xl mx-auto mt-3">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full p-3 rounded-full text-black shadow outline-none"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* Produtos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">🍖 Produtos</h2>
            {loadingProdutos && (
              <span className="text-sm text-gray-500">Carregando...</span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtrados.map((p) => (
              <button
                key={p.id}
                onClick={() => onClickProduto(p)}
                className="bg-white rounded-2xl shadow hover:scale-[1.01] transition overflow-hidden text-left"
                title="Adicionar"
              >
                <div className="h-20 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  {p.imagem_url ? (
                    <img
                      src={p.imagem_url}
                      alt={p.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>SEM FOTO</span>
                  )}
                </div>

                <div className="p-2">
                  <div className="font-bold text-sm line-clamp-2">{p.nome}</div>
                  <div className="text-red-600 font-extrabold">
                    {isKg(p) ? `R$ ${brl(Number(p.preco))} / kg` : `R$ ${brl(Number(p.preco))}`}
                  </div>
                  {isKg(p) && (
                    <div className="text-[11px] text-gray-500 mt-1">
                      ⚖️ por peso (abre balança)
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Carrinho */}
        <div className="bg-white rounded-2xl shadow p-3 h-fit sticky top-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">🛒 Itens da Comanda</h2>
            <span className="text-xs text-gray-500">{carrinho.length} itens</span>
          </div>

          <div className="mt-2 space-y-2">
            {carrinho.length === 0 && (
              <div className="text-sm text-gray-500 bg-gray-50 border rounded p-3">
                Adicione produtos para começar.
              </div>
            )}

            {carrinho.map((i) => {
              const sub = Number(i.preco) * Number(i.quantidade);

              return (
                <div key={i.id} className="border rounded-xl p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{i.nome}</div>
                      <div className="text-xs text-gray-600">
                        {i.vendido_por === "kg" ? (
                          <>
                            R$ {brl(Number(i.preco))} / kg •{" "}
                            <b>{Number(i.quantidade).toFixed(3)} kg</b>
                          </>
                        ) : (
                          <>
                            R$ {brl(Number(i.preco))} • <b>{i.quantidade} un</b>
                          </>
                        )}
                        {" "}• Sub: <b>R$ {brl(sub)}</b>
                      </div>
                    </div>

                    <button
                      onClick={() => removerItem(i.id)}
                      className="text-red-600 text-sm font-bold px-2"
                      title="Remover"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Controles */}
                  {i.vendido_por === "unidade" ? (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => decUn(i.produto_id)}
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        −
                      </button>
                      <div className="font-bold w-10 text-center">{i.quantidade}</div>
                      <button
                        onClick={() => incUn(i.produto_id)}
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div className="text-xs text-gray-600 mb-1">
                        Peso (kg) — edite e confirme:
                      </div>
                      <input
                        value={String(i.quantidade).replace(".", ",")}
                        onChange={(e) => {
                          const v = e.target.value.replace(",", ".");
                          const n = Number(v);
                          if (!Number.isNaN(n)) setKg(i.produto_id, n);
                        }}
                        className="w-full border p-2 rounded"
                        placeholder="Ex: 0,850"
                      />
                      <div className="text-[11px] text-gray-500 mt-1">
                        Dica: 850g = 0,850kg
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 border-t pt-3">
            <div className="text-3xl font-extrabold">R$ {brl(total)}</div>

            <button
              onClick={salvarPreVenda}
              disabled={salvando || carrinho.length === 0}
              className={`w-full mt-3 py-3 rounded-xl font-extrabold bg-yellow-400 text-black hover:bg-yellow-300 ${
                salvando || carrinho.length === 0 ? "opacity-70" : ""
              }`}
            >
              🔗 Salvar Pré-venda
            </button>

            <div className="mt-2 text-xs text-gray-500">
              * Este PDV só salva comanda (pré-venda). Baixa/pagamento fica no Caixa.
            </div>
          </div>

          {/* Comandas abertas */}
          <div className="mt-4 border-t pt-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm">📌 Comandas abertas</div>
              <button
                onClick={carregarPreVendas}
                className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50"
              >
                Atualizar
              </button>
            </div>

            {loadingPre && (
              <div className="text-xs text-gray-500 mt-2">Carregando...</div>
            )}

            {!loadingPre && preVendas.length === 0 && (
              <div className="text-xs text-gray-500 mt-2">
                Nenhuma comanda aberta.
              </div>
            )}

            <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
              {preVendas.map((v) => {
                const com = parseComandaFromObs(v.observacoes);
                const label = com ? `Comanda ${com}` : `#${v.id.slice(0, 6).toUpperCase()}`;

                return (
                  <div
                    key={v.id}
                    className={`w-full border rounded-xl p-2 bg-white ${
                      preVendaId === v.id ? "ring-2 ring-orange-400" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-extrabold text-sm">{label}</div>
                      <div className="text-sm font-extrabold text-red-600">
                        R$ {brl(Number(v.total || 0))}
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(v.data).toLocaleString("pt-BR")}
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => abrirPreVenda(v.id)}
                        className="py-2 rounded-lg bg-gray-900 text-white font-bold hover:bg-black"
                        title="Abrir comanda"
                      >
                        Abrir
                      </button>

                      <button
                        onClick={() => excluirPreVenda(v.id)}
                        disabled={salvando}
                        className="py-2 rounded-lg border border-red-300 text-red-600 font-bold hover:bg-red-50"
                        title="Excluir comanda"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 text-[11px] text-gray-500">
              Dica: abrir direto por URL: <b>/gigante/pdv?id=XXXX</b>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Modal de peso para itens por KG */}
      {produtoSelecionado && (
        <ProdutoModalPDV
          produto={produtoSelecionado as any}
          onClose={() => setProdutoSelecionado(null)}
          onAdd={(produto, quantidade) => {
            // quantidade = kg (decimal) vindo do modal
            addProdutoKg(produto as any, Number(quantidade));
            setProdutoSelecionado(null);
          }}
        />
      )}
    </div>
  );
}

export default function PDVPage() {
  return (
    <Suspense fallback={<div className="p-6">Carregando PDV...</div>}>
      <PDVInner />
    </Suspense>
  );
}
