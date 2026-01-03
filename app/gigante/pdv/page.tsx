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
  vendido_por?: "unidade" | "kg" | string;
};

type ItemCarrinho = {
  id: string; // id local (ui)
  produto_id: string;
  nome: string;
  preco: number; // se kg: preço por kg
  quantidade: number; // se kg: quantidade = kg (decimal)
  vendido_por?: "unidade" | "kg" | string;
};

type VendaPre = {
  id: string;
  data: string;
  total: number;
  metodo_pagamento: string;
  status: string;
  comanda_numero?: number | null;
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pagamentoTextoSeguro(v?: string | null) {
  // ✅ resolve NOT NULL no banco sem “mostrar pagamento” na tela
  return v && String(v).trim() ? String(v).trim() : "PRE_VENDA";
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

  // 🔄 carregar produtos
  useEffect(() => {
    (async () => {
      setLoadingProdutos(true);
      const { data, error } = await supabase
        .from("gigante_produtos")
        .select("id,nome,preco,imagem_url,vendido_por")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) console.error(error);
      setProdutos((data as any) || []);
      setLoadingProdutos(false);
    })();
  }, []);

  // 🔄 carregar lista de pré-vendas (comandas)
  async function carregarPreVendas() {
    setLoadingPre(true);
    const { data, error } = await supabase
      .from("gigante_vendas")
      .select("id,data,total,metodo_pagamento,status,comanda_numero")
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
    const vendidoPor = String(p.vendido_por || "unidade").toLowerCase().trim();
    const isKg = vendidoPor === "kg" || vendidoPor === "kilo" || vendidoPor === "quilo";

    // ✅ por enquanto: kg entra como 1.000kg (depois você pluga o ProdutoModal só no PDV)
    const qtdInicial = isKg ? 1 : 1;

    setCarrinho((prev) => {
      const ex = prev.find((x) => x.produto_id === p.id);
      if (ex) {
        // ✅ unidade soma; kg soma 1kg (por enquanto)
        return prev.map((x) =>
          x.produto_id === p.id ? { ...x, quantidade: Number(x.quantidade) + qtdInicial } : x
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          produto_id: p.id,
          nome: p.nome,
          preco: Number(p.preco),
          quantidade: qtdInicial,
          vendido_por: p.vendido_por,
        },
      ];
    });

    setBusca("");
  }

  function inc(produto_id: string) {
    setCarrinho((prev) =>
      prev.map((x) => (x.produto_id === produto_id ? { ...x, quantidade: Number(x.quantidade) + 1 } : x))
    );
  }

  function dec(produto_id: string) {
    setCarrinho((prev) =>
      prev
        .map((x) =>
          x.produto_id === produto_id ? { ...x, quantidade: Math.max(1, Number(x.quantidade) - 1) } : x
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

  // ✅ abrir pré-venda (carregar itens pro carrinho) — NÃO pode duplicar
  async function abrirPreVenda(id: string) {
    try {
      setSalvando(true);

      const { data: v, error: ev } = await supabase
        .from("gigante_vendas")
        .select("id,total,metodo_pagamento,status,comanda_numero")
        .eq("id", id)
        .single();

      if (ev || !v) throw ev || new Error("Pré-venda não encontrada");

      const { data: its, error: ei } = await supabase
        .from("gigante_venda_itens")
        .select("produto_id,nome,preco,quantidade,criado_em")
        .eq("venda_id", id)
        .order("criado_em", { ascending: true });

      if (ei) throw ei;

      // ✅ agrupa por produto_id para não mostrar duplicado (se tiver lixo no banco)
      const mapa = new Map<
        string,
        { produto_id: string; nome: string; preco: number; quantidade: number }
      >();

      for (const it of its || []) {
        const key = String(it.produto_id);
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

      setPreVendaId(id);
      router.replace(`/gigante/pdv?id=${id}`);
    } catch (e) {
      console.error(e);
      alert("Erro ao abrir comanda.");
    } finally {
      setSalvando(false);
    }
  }

  // ✅ EXCLUIR comanda (e já remove do estado)
  async function excluirPreVenda(id: string) {
    if (!confirm("Deseja excluir esta comanda?")) return;

    try {
      setSalvando(true);

      // 1) apaga itens
      const { error: e1 } = await supabase.from("gigante_venda_itens").delete().eq("venda_id", id);
      if (e1) throw e1;

      // 2) apaga venda
      const { error: e2 } = await supabase.from("gigante_vendas").delete().eq("id", id);
      if (e2) throw e2;

      // ✅ remove do estado local
      setPreVendas((prev) => prev.filter((v) => v.id !== id));

      // se estava aberta, limpa
      if (preVendaId === id) {
        setCarrinho([]);
        setPreVendaId("");
        router.replace("/gigante/pdv");
      }

      alert("Comanda excluída com sucesso ✅");
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir comanda. Veja o console.");
    } finally {
      setSalvando(false);
    }
  }

  // ✅ salvar pré-venda (cria ou atualiza)
  async function salvarPreVenda() {
    if (carrinho.length === 0) {
      alert("Carrinho vazio.");
      return;
    }

    // ✅ pede número da comanda (sempre)
    const comandaStr = prompt("Número da comanda (ex: 100):");
    if (!comandaStr) return;

    const comandaNumero = Number(String(comandaStr).replace(/\D/g, ""));
    if (!comandaNumero || comandaNumero <= 0) {
      alert("Número de comanda inválido.");
      return;
    }

    try {
      setSalvando(true);

      const payloadVenda: any = {
        data: new Date().toISOString(),
        total,
        origem: "PDV",
        status: "pre_venda",
        tipo_entrega: "retirada",
        comanda_numero: comandaNumero,

        // ✅ resolve seu erro do console: coluna NOT NULL
        metodo_pagamento: pagamentoTextoSeguro("PRE_VENDA"),
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
        // atualiza venda
        const { error: eu } = await supabase.from("gigante_vendas").update(payloadVenda).eq("id", id);
        if (eu) throw eu;

        // limpa itens antigos (pra não duplicar)
        const { error: ed } = await supabase.from("gigante_venda_itens").delete().eq("venda_id", id);
        if (ed) throw ed;
      }

      // grava itens
      const itens = carrinho.map((i) => ({
        venda_id: id,
        produto_id: i.produto_id,
        nome: i.nome,
        quantidade: Number(i.quantidade),
        preco: Number(i.preco),
        subtotal: Number(i.preco) * Number(i.quantidade),
      }));

      const { error: ei } = await supabase.from("gigante_venda_itens").insert(itens);
      if (ei) throw ei;

      // ✅ atualiza lista e limpa tela (como você pediu)
      await carregarPreVendas();
      alert(`Comanda ${comandaNumero} salva! ✅`);

      setCarrinho([]);
      setPreVendaId("");
      router.replace("/gigante/pdv");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar comanda. (RLS/colunas) — veja o console.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-red-700 to-orange-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-extrabold">🧾 PDV — Pré-venda</div>
            <div className="text-xs opacity-90">
              {preVendaId ? (
                <>
                  Editando comanda: <b>{preVendaId.slice(0, 6).toUpperCase()}</b>
                </>
              ) : (
                <>Nova comanda</>
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
              title="Salvar comanda (pré-venda)"
            >
              🔗 Salvar Pré-venda
            </button>

            {/* ✅ botão ir pro caixa (como tinha antes) */}
            <button
              onClick={() => router.push("/gigante/caixa")}
              className="px-3 py-2 rounded bg-white/15 hover:bg-white/25 border border-white/30"
              title="Ir para o Caixa"
            >
              💵 Ir pro Caixa
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

        {/* Lateral */}
        <div className="bg-white rounded-2xl shadow p-3 h-fit sticky top-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">🧾 Itens da Comanda</h2>
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

            <button
              onClick={salvarPreVenda}
              disabled={salvando}
              className={`w-full mt-3 py-3 rounded-xl font-bold bg-yellow-400 text-black hover:bg-yellow-300 ${
                salvando ? "opacity-70" : ""
              }`}
            >
              🔗 Salvar Pré-venda
            </button>

            <div className="mt-2 text-xs text-gray-500">
              * Este PDV só salva comanda (pré-venda). Baixa/pagamento fica no <b>Caixa</b>.
            </div>
          </div>

          {/* Comandas */}
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

            {loadingPre && <div className="text-xs text-gray-500 mt-2">Carregando...</div>}

            {!loadingPre && preVendas.length === 0 && (
              <div className="text-xs text-gray-500 mt-2">Nenhuma comanda aberta.</div>
            )}

            <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
              {preVendas.map((v) => (
                <div key={v.id} className="w-full border rounded-xl p-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm">
                      {v.comanda_numero ? `Comanda ${v.comanda_numero}` : `#${v.id.slice(0, 6).toUpperCase()}`}
                    </div>
                    <div className="text-sm font-extrabold text-red-600">R$ {brl(Number(v.total || 0))}</div>
                  </div>

                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(v.data).toLocaleString("pt-BR")}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => abrirPreVenda(v.id)}
                      className="py-2 rounded-lg bg-gray-900 text-white hover:bg-black"
                      title="Abrir comanda"
                      disabled={salvando}
                    >
                      Abrir
                    </button>

                    <button
                      onClick={() => excluirPreVenda(v.id)}
                      className="py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                      title="Excluir comanda"
                      disabled={salvando}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
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
