"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// ✅ evita prerender quebrar no Vercel (App Router)
export const dynamic = "force-dynamic";

type Produto = {
  id: string;
  nome: string;
  preco: number;
  imagem_url?: string | null;
};

type ItemCarrinho = {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  produto_id: string;
};

type VendaPre = {
  id: string;
  data: string;
  total: number;
  metodo_pagamento: string;
  status: string;
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PDVInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preIdFromUrl = searchParams.get("id") || "";

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [loadingProdutos, setLoadingProdutos] = useState(true);

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [pagamento, setPagamento] = useState<"pix" | "dinheiro" | "debito" | "credito">("pix");

  const [preVendas, setPreVendas] = useState<VendaPre[]>([]);
  const [loadingPre, setLoadingPre] = useState(true);

  const [preVendaId, setPreVendaId] = useState<string>(preIdFromUrl);
  const [salvando, setSalvando] = useState(false);

  // 🔄 carregar produtos
  useEffect(() => {
    (async () => {
      setLoadingProdutos(true);
      const { data, error } = await supabase
        .from("gigante_produtos")
        .select("id,nome,preco,imagem_url")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) console.error(error);
      setProdutos((data as any) || []);
      setLoadingProdutos(false);
    })();
  }, []);

  // 🔄 carregar lista de pré-vendas
  async function carregarPreVendas() {
    setLoadingPre(true);
    const { data, error } = await supabase
      .from("gigante_vendas")
      .select("id,data,total,metodo_pagamento,status")
      .eq("origem", "PDV")
      .eq("status", "pre_venda")
      .order("data", { ascending: false })
      .limit(80);

    if (error) console.error(error);
    setPreVendas((data as any) || []);
    setLoadingPre(false);
  }

  useEffect(() => {
    carregarPreVendas();
  }, []);

  // 🔄 se vier ?id=... na URL, abre a pré-venda automaticamente
  useEffect(() => {
    if (preIdFromUrl) {
      setPreVendaId(preIdFromUrl);
      abrirPreVenda(preIdFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preIdFromUrl]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return produtos;
    return produtos.filter((p) => p.nome.toLowerCase().includes(q));
  }, [busca, produtos]);

  const total = useMemo(() => {
    return carrinho.reduce((acc, i) => acc + Number(i.preco) * Number(i.quantidade), 0);
  }, [carrinho]);

  function addProduto(p: Produto) {
    setCarrinho((prev) => {
      const ex = prev.find((x) => x.produto_id === p.id);
      if (ex) {
        return prev.map((x) =>
          x.produto_id === p.id ? { ...x, quantidade: x.quantidade + 1 } : x
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
        },
      ];
    });
    setBusca("");
  }

  function inc(produto_id: string) {
    setCarrinho((prev) =>
      prev.map((x) => (x.produto_id === produto_id ? { ...x, quantidade: x.quantidade + 1 } : x))
    );
  }

  function dec(produto_id: string) {
    setCarrinho((prev) =>
      prev
        .map((x) =>
          x.produto_id === produto_id ? { ...x, quantidade: Math.max(1, x.quantidade - 1) } : x
        )
        .filter((x) => x.quantidade > 0)
    );
  }

  function remover(produto_id: string) {
    setCarrinho((prev) => prev.filter((x) => x.produto_id !== produto_id));
  }

  function limpar() {
    setCarrinho([]);
    setPreVendaId("");
    router.replace("/gigante/pdv");
  }

  // ✅ abrir pré-venda (carregar itens pro carrinho)
  async function abrirPreVenda(id: string) {
    try {
      setSalvando(true);

      const { data: v, error: ev } = await supabase
        .from("gigante_vendas")
        .select("id,metodo_pagamento,status,total")
        .eq("id", id)
        .single();

      if (ev || !v) throw ev || new Error("Pré-venda não encontrada");

      const { data: its, error: ei } = await supabase
        .from("gigante_venda_itens")
        .select("produto_id,nome,preco,quantidade,criado_em")
        .eq("venda_id", id)
        .order("criado_em", { ascending: true });

      if (ei) throw ei;

      // ✅ agrupa por produto_id pra não “duplicar” visualmente se tiver duplicado no banco
      const mapa = new Map<string, { produto_id: string; nome: string; preco: number; quantidade: number }>();
      for (const it of its || []) {
        const key = it.produto_id;
        const atual = mapa.get(key);
        if (!atual) {
          mapa.set(key, {
            produto_id: it.produto_id,
            nome: it.nome,
            preco: Number(it.preco),
            quantidade: Number(it.quantidade),
          });
        } else {
          mapa.set(key, {
            ...atual,
            quantidade: Number(atual.quantidade) + Number(it.quantidade),
          });
        }
      }

      setCarrinho(
        Array.from(mapa.values()).map((it) => ({
          id: crypto.randomUUID(),
          produto_id: it.produto_id,
          nome: it.nome,
          preco: Number(it.preco),
          quantidade: Number(it.quantidade),
        }))
      );

      // inferir pagamento salvo
      const mp = String(v.metodo_pagamento || "").toLowerCase();
      if (mp.includes("pix")) setPagamento("pix");
      else if (mp.includes("dinheiro")) setPagamento("dinheiro");
      else if (mp.includes("deb")) setPagamento("debito");
      else if (mp.includes("cred")) setPagamento("credito");

      setPreVendaId(id);
      router.replace(`/gigante/pdv?id=${id}`);
    } catch (e) {
      console.error(e);
      alert("Erro ao abrir pré-venda.");
    } finally {
      setSalvando(false);
    }
  }

  function pagamentoTexto(p: typeof pagamento) {
    if (p === "pix") return "PIX";
    if (p === "dinheiro") return "DINHEIRO";
    if (p === "debito") return "DÉBITO";
    return "CRÉDITO";
  }

  // ✅ salvar pré-venda (cria ou atualiza) — SEM finalizar aqui
  async function salvarPreVenda() {
    if (carrinho.length === 0) {
      alert("Carrinho vazio.");
      return;
    }

    try {
      setSalvando(true);

      const payloadVenda: any = {
        data: new Date().toISOString(),
        total,
        metodo_pagamento: pagamentoTexto(pagamento),
        origem: "PDV",
        status: "pre_venda",
        tipo_entrega: "retirada",
      };

      let id = preVendaId;

      if (!id) {
        // cria
        const { data: venda, error: ev } = await supabase
          .from("gigante_vendas")
          .insert(payloadVenda)
          .select("id")
          .single();

        if (ev) throw ev;
        id = venda.id;
      } else {
        // atualiza
        const { error: eu } = await supabase
          .from("gigante_vendas")
          .update(payloadVenda)
          .eq("id", id);

        if (eu) throw eu;

        // limpa itens antigos (pra não duplicar)
        const { error: ed } = await supabase
          .from("gigante_venda_itens")
          .delete()
          .eq("venda_id", id);

        if (ed) throw ed;
      }

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

      setPreVendaId(id);
      router.replace(`/gigante/pdv?id=${id}`);
      await carregarPreVendas();

      alert(`Pré-venda salva! (#${String(id).slice(0, 6).toUpperCase()}) ✅`);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar pré-venda. (RLS/colunas) — veja o console.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar / “hero” do PDV */}
      <div className="bg-gradient-to-r from-red-700 to-orange-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-extrabold">🧾 PDV — Gigante dos Assados</div>
            <div className="text-xs opacity-90">
              {preVendaId ? (
                <>
                  Pré-venda aberta: <b>{preVendaId.slice(0, 6).toUpperCase()}</b>
                </>
              ) : (
                <>Nova pré-venda</>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={salvarPreVenda}
              disabled={salvando}
              className={`px-3 py-2 rounded bg-yellow-400 text-black font-bold hover:bg-yellow-300 ${
                salvando ? "opacity-70" : ""
              }`}
              title="Salvar como pré-venda (para editar depois)"
            >
              🧷 Salvar Pré-venda
            </button>

            <button
              onClick={() => router.push("/gigante/caixa")}
              className="px-3 py-2 rounded bg-white/15 hover:bg-white/25 border border-white/30"
              title="Ir para o Caixa para dar baixa"
            >
              💵 Ir para Caixa
            </button>

            <button
              onClick={limpar}
              className="px-3 py-2 rounded bg-white/15 hover:bg-white/25 border border-white/30"
              title="Limpar tela"
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
            {loadingProdutos && <span className="text-sm text-gray-500">Carregando...</span>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtrados.map((p) => (
              <button
                key={p.id}
                onClick={() => addProduto(p)}
                className="bg-white rounded-2xl shadow hover:scale-[1.01] transition overflow-hidden text-left"
                title="Adicionar"
              >
                <div className="h-20 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  {p.imagem_url ? (
                    <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                  ) : (
                    <span>SEM FOTO</span>
                  )}
                </div>

                <div className="p-2">
                  <div className="font-bold text-sm line-clamp-2">{p.nome}</div>
                  <div className="text-red-600 font-extrabold">R$ {brl(Number(p.preco))}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Carrinho */}
        <div className="bg-white rounded-2xl shadow p-3 h-fit sticky top-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">🛒 Pré-venda</h2>
            <span className="text-xs text-gray-500">{carrinho.length} itens</span>
          </div>

          <div className="mt-2 space-y-2">
            {carrinho.length === 0 && (
              <div className="text-sm text-gray-500 bg-gray-50 border rounded p-3">
                Adicione produtos para começar.
              </div>
            )}

            {carrinho.map((i) => (
              <div key={i.id} className="border rounded-xl p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{i.nome}</div>
                    <div className="text-xs text-gray-600">
                      R$ {brl(Number(i.preco))} • Sub: R$ {brl(Number(i.preco) * Number(i.quantidade))}
                    </div>
                  </div>

                  <button
                    onClick={() => remover(i.produto_id)}
                    className="text-red-600 text-sm font-bold px-2"
                    title="Remover"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => dec(i.produto_id)}
                    className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    −
                  </button>
                  <div className="font-bold w-10 text-center">{i.quantidade}</div>
                  <button
                    onClick={() => inc(i.produto_id)}
                    className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 border-t pt-3">
            <div className="text-3xl font-extrabold">R$ {brl(total)}</div>

            <label className="block text-sm font-bold mt-3 mb-2">💳 Forma sugerida</label>
            <select
              value={pagamento}
              onChange={(e) => setPagamento(e.target.value as any)}
              className="w-full border p-3 rounded-xl"
            >
              <option value="pix">PIX</option>
              <option value="dinheiro">DINHEIRO</option>
              <option value="debito">DÉBITO</option>
              <option value="credito">CRÉDITO</option>
            </select>

            <button
              onClick={salvarPreVenda}
              disabled={salvando}
              className={`w-full mt-3 py-3 rounded-xl font-bold bg-yellow-400 text-black hover:bg-yellow-300 ${
                salvando ? "opacity-70" : ""
              }`}
            >
              🧷 Salvar Pré-venda
            </button>

            <div className="mt-2 text-xs text-gray-500">
              * Baixa (pago) e impressão final serão feitas na página <b>Caixa</b>.
            </div>
          </div>

          {/* Pré-vendas */}
          <div className="mt-4 border-t pt-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm">📌 Pré-vendas abertas</div>
              <button
                onClick={carregarPreVendas}
                className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50"
              >
                Atualizar
              </button>
            </div>

            {loadingPre && <div className="text-xs text-gray-500 mt-2">Carregando...</div>}

            {!loadingPre && preVendas.length === 0 && (
              <div className="text-xs text-gray-500 mt-2">Nenhuma pré-venda aberta.</div>
            )}

            <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
              {preVendas.map((v) => (
                <button
                  key={v.id}
                  onClick={() => abrirPreVenda(v.id)}
                  className="w-full text-left border rounded-xl p-2 hover:bg-gray-50"
                  title="Abrir pré-venda"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm">#{v.id.slice(0, 6).toUpperCase()}</div>
                    <div className="text-sm font-extrabold text-red-600">R$ {brl(Number(v.total || 0))}</div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(v.data).toLocaleString("pt-BR")} • {String(v.metodo_pagamento || "").toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 text-[11px] text-gray-500">
            Dica: abrir direto por URL: <b>/gigante/pdv?id=XXXX</b>
          </div>
        </div>
      </div>
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
