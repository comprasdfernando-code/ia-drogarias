"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// ✅ evita prerender quebrar no Vercel (App Router)
export const dynamic = "force-dynamic";

type Produto = {
  id: string;
  nome: string;
  preco: number; // se vendido_por=kg => preço por kg
  imagem_url?: string | null;
  vendido_por?: "unidade" | "kg" | string;
  descricao?: string | null;
};

type ItemCarrinho = {
  id: string;
  nome: string;
  preco: number; // preço unit OU preço/kg
  quantidade: number; // unid OU kg (decimal)
  produto_id: string;
};

type VendaPre = {
  id: string;
  data: string;
  total: number;
  status: string;
  comanda_numero?: string | null;
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function normalizaVendidoPor(v: any): "unidade" | "kg" {
  const s = String(v || "unidade").toLowerCase().trim();
  return s === "kg" || s === "quilo" || s === "kilo" ? "kg" : "unidade";
}

function onlyNumberLike(v: string) {
  return v.replace(/[^\d.,]/g, "");
}

/** ✅ Modal interno EXCLUSIVO do PDV (não mexe no site) */
function ProdutoPesoModal({
  produto,
  onClose,
  onAddKg,
}: {
  produto: Produto;
  onClose: () => void;
  onAddKg: (produto: Produto, kg: number, labelPeso: string) => void;
}) {
  const [modoPeso, setModoPeso] = useState<"g" | "kg">("g");
  const [pesoTexto, setPesoTexto] = useState<string>("");

  function parsePesoKg(): number {
    const raw = onlyNumberLike((pesoTexto || "").trim());
    if (!raw) return 0;

    const n = Number(raw.replace(",", "."));
    if (Number.isNaN(n) || n <= 0) return 0;

    if (modoPeso === "g") return n / 1000;

    // proteção: se o cara digitou 850 no modo kg, quase sempre era gramas
    if (n >= 10) return n / 1000;

    return n;
  }

  const kg = useMemo(() => parsePesoKg(), [pesoTexto, modoPeso]);
  const subtotal = useMemo(() => (kg > 0 ? Number(produto.preco) * kg : 0), [kg, produto.preco]);

  function confirmar() {
    if (!kg || kg <= 0) {
      alert("Informe o peso da balança.");
      return;
    }

    const kgFix = Number(kg.toFixed(3));
    const label =
      modoPeso === "g"
        ? `${String(pesoTexto || "").trim()}g`
        : `${kgFix.toFixed(3).replace(".", ",")}kg`;

    onAddKg(produto, kgFix, label);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-3">
      <div className="bg-white w-full max-w-md rounded-2xl p-4 shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-extrabold text-lg">{produto.nome}</div>
            <div className="mt-2 font-bold text-red-600">
              R$ {Number(produto.preco).toFixed(2)} / kg
            </div>
          </div>

          <button onClick={onClose} className="text-gray-500 hover:text-black font-bold">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Peso da balança</span>

            <div className="flex gap-1">
              <button
                onClick={() => setModoPeso("g")}
                className={`px-3 py-2 rounded border ${modoPeso === "g" ? "bg-black text-white" : "bg-white"}`}
              >
                g
              </button>
              <button
                onClick={() => setModoPeso("kg")}
                className={`px-3 py-2 rounded border ${modoPeso === "kg" ? "bg-black text-white" : "bg-white"}`}
              >
                kg
              </button>
            </div>
          </div>

          <input
            value={pesoTexto}
            onChange={(e) => setPesoTexto(onlyNumberLike(e.target.value))}
            inputMode="decimal"
            placeholder={modoPeso === "g" ? "Ex: 850" : "Ex: 0,850"}
            className="w-full border p-3 rounded-xl"
          />

          <div className="text-xs text-gray-700 bg-gray-50 border rounded p-2">
            ✅ Reconhecido: <b>{kg > 0 ? `${kg.toFixed(3).replace(".", ",")} kg` : "-"}</b> •{" "}
            <span className="text-gray-600">Valor/kg: R$ {Number(produto.preco).toFixed(2)}</span>
          </div>

          <div className="text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2">
            Dica: se você digitar <b>850</b> no modo <b>kg</b>, eu entendo como <b>850g</b> (0,850kg).
          </div>
        </div>

        <div className="mt-4 border-t pt-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Subtotal</div>
            <div className="text-xl font-extrabold">R$ {subtotal.toFixed(2)}</div>
          </div>

          <button
            onClick={confirmar}
            className="px-4 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
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
  const [comandaNumero, setComandaNumero] = useState<string>("");
  const [salvando, setSalvando] = useState(false);

  // modal kg
  const [modalProduto, setModalProduto] = useState<Produto | null>(null);

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

  async function carregarPreVendas() {
    setLoadingPre(true);
    const { data, error } = await supabase
      .from("gigante_vendas")
      .select("id,data,total,status,comanda_numero")
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

  function addProdutoClick(p: Produto) {
    const vendidoPor = normalizaVendidoPor(p.vendido_por);

    // ✅ se for kg abre modal
    if (vendidoPor === "kg") {
      setModalProduto(p);
      return;
    }

    // ✅ unidade adiciona direto
    setCarrinho((prev) => {
      const ex = prev.find((x) => x.produto_id === p.id && !x.nome.includes("("));
      if (ex) {
        return prev.map((x) => (x.produto_id === p.id && !x.nome.includes("(") ? { ...x, quantidade: x.quantidade + 1 } : x));
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

  function addKgItem(produto: Produto, kg: number, labelPeso: string) {
    setCarrinho((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        produto_id: produto.id,
        nome: `${produto.nome} (${labelPeso})`,
        preco: Number(produto.preco), // preço por kg
        quantidade: kg, // kg decimal
      },
    ]);
    setBusca("");
  }

  function inc(itemId: string) {
    setCarrinho((prev) => prev.map((x) => (x.id === itemId ? { ...x, quantidade: x.quantidade + 1 } : x)));
  }

  function dec(itemId: string) {
    setCarrinho((prev) =>
      prev
        .map((x) => (x.id === itemId ? { ...x, quantidade: Math.max(1, x.quantidade - 1) } : x))
        .filter((x) => x.quantidade > 0)
    );
  }

  function remover(itemId: string) {
    setCarrinho((prev) => prev.filter((x) => x.id !== itemId));
  }

  function limpar() {
    setCarrinho([]);
    setPreVendaId("");
    setComandaNumero("");
    router.replace("/gigante/pdv");
  }

  // ✅ abrir pré-venda (carregar itens)
  async function abrirPreVenda(id: string) {
    try {
      setSalvando(true);

      const { data: v, error: ev } = await supabase
        .from("gigante_vendas")
        .select("id,total,status,comanda_numero")
        .eq("id", id)
        .single();

      if (ev || !v) throw ev || new Error("Pré-venda não encontrada");

      setComandaNumero(String(v.comanda_numero || ""));

      const { data: its, error: ei } = await supabase
        .from("gigante_venda_itens")
        .select("produto_id,nome,preco,quantidade,criado_em")
        .eq("venda_id", id)
        .order("criado_em", { ascending: true });

      if (ei) throw ei;

      // ✅ não duplicar visualmente (agrupa por produto_id + nome + preco)
      const mapa = new Map<string, { produto_id: string; nome: string; preco: number; quantidade: number }>();
      for (const it of its || []) {
        const key = `${it.produto_id}|${it.nome}|${it.preco}`;
        const atual = mapa.get(key);
        if (!atual) {
          mapa.set(key, {
            produto_id: it.produto_id,
            nome: it.nome,
            preco: Number(it.preco),
            quantidade: Number(it.quantidade),
          });
        } else {
          mapa.set(key, { ...atual, quantidade: Number(atual.quantidade) + Number(it.quantidade) });
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
      alert("Erro ao abrir pré-venda.");
    } finally {
      setSalvando(false);
    }
  }

  // ✅ excluir pré-venda (itens + venda)
  async function excluirPreVenda(id: string) {
    if (!confirm("Excluir esta comanda? Isso apaga itens também.")) return;

    try {
      setSalvando(true);

      const { error: ed } = await supabase.from("gigante_venda_itens").delete().eq("venda_id", id);
      if (ed) throw ed;

      const { error: ev } = await supabase.from("gigante_vendas").delete().eq("id", id);
      if (ev) throw ev;

      await carregarPreVendas();
      if (preVendaId === id) limpar();

      alert("Comanda excluída ✅");
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir comanda (RLS/colunas). Veja o console.");
    } finally {
      setSalvando(false);
    }
  }

  // ✅ salvar pré-venda (com número da comanda)
  async function salvarPreVenda() {
    if (carrinho.length === 0) {
      alert("Carrinho vazio.");
      return;
    }

    try {
      setSalvando(true);

      // ✅ se for NOVA comanda e não tem número ainda, pede
      let numero = (comandaNumero || "").trim();
      if (!preVendaId && !numero) {
        const n = prompt("Número da comanda (ex: 100):");
        if (!n) return;
        numero = String(n).trim();
        setComandaNumero(numero);
      }

      const payloadVenda: any = {
        data: new Date().toISOString(),
        total,
        metodo_pagamento: "PRE_VENDA", // ✅ evita NOT NULL
        origem: "PDV",
        status: "pre_venda",
        tipo_entrega: "retirada",
        comanda_numero: numero || null,
      };

      let id = preVendaId;

      if (!id) {
        const { data: venda, error: ev } = await supabase
          .from("gigante_vendas")
          .insert(payloadVenda)
          .select("id")
          .single();

        if (ev) throw ev;
        id = venda.id;
      } else {
        const { error: eu } = await supabase.from("gigante_vendas").update(payloadVenda).eq("id", id);
        if (eu) throw eu;

        // limpa itens antigos (pra não duplicar)
        const { error: ed } = await supabase.from("gigante_venda_itens").delete().eq("venda_id", id);
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

      const { error: ei } = await supabase.from("gigante_venda_itens").insert(itens);
      if (ei) throw ei;

      setPreVendaId(id);
      router.replace(`/gigante/pdv?id=${id}`);
      await carregarPreVendas();

      alert(`Comanda salva! ✅ (${numero ? `Comanda ${numero}` : `#${String(id).slice(0, 6).toUpperCase()}`})`);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar comanda (RLS/colunas) — veja o console.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Modal KG */}
      {modalProduto && (
        <ProdutoPesoModal
          produto={modalProduto}
          onClose={() => setModalProduto(null)}
          onAddKg={(p, kg, labelPeso) => addKgItem(p, kg, labelPeso)}
        />
      )}

      {/* Top bar */}
      <div className="bg-gradient-to-r from-red-700 to-orange-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-extrabold">🧾 PDV — Pré-venda</div>
            <div className="text-xs opacity-90">
              {comandaNumero ? (
                <>Comanda <b>{comandaNumero}</b></>
              ) : preVendaId ? (
                <>
                  Comanda aberta: <b>#{preVendaId.slice(0, 6).toUpperCase()}</b>
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
            >
              🔗 Salvar Pré-venda
            </button>

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

        <div className="max-w-6xl mx-auto mt-3">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full p-3 rounded-full text-black shadow outline-none"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        {/* Produtos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">🍖 Produtos</h2>
            {loadingProdutos && <span className="text-sm text-gray-500">Carregando...</span>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtrados.map((p) => {
              const isKg = normalizaVendidoPor(p.vendido_por) === "kg";
              return (
                <button
                  key={p.id}
                  onClick={() => addProdutoClick(p)}
                  className="bg-white rounded-2xl shadow hover:scale-[1.01] transition overflow-hidden text-left"
                  title={isKg ? "Informar peso e adicionar" : "Adicionar"}
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
                    <div className="text-red-600 font-extrabold">
                      {isKg ? `R$ ${Number(p.preco).toFixed(2)} / kg` : `R$ ${Number(p.preco).toFixed(2)}`}
                    </div>
                    {isKg && <div className="text-[11px] text-gray-500 mt-1">⚖️ clique para informar peso</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Carrinho */}
        <div className="bg-white rounded-2xl shadow p-3 h-fit sticky top-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">🧺 Itens da Comanda</h2>
            <span className="text-xs text-gray-500">{carrinho.length} itens</span>
          </div>

          <div className="mt-2 space-y-2">
            {carrinho.length === 0 ? (
              <div className="text-sm text-gray-500 bg-gray-50 border rounded p-3">
                Adicione produtos para começar.
              </div>
            ) : (
              carrinho.map((i) => {
                const sub = Number(i.preco) * Number(i.quantidade);
                const isPeso = i.nome.includes("g)") || i.nome.includes("kg)");
                return (
                  <div key={i.id} className="border rounded-xl p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{i.nome}</div>
                        <div className="text-xs text-gray-600">
                          {isPeso ? `Preço/kg R$ ${brl(Number(i.preco))}` : `R$ ${brl(Number(i.preco))}`} • Sub: R${" "}
                          {brl(sub)}
                        </div>
                      </div>

                      <button
                        onClick={() => remover(i.id)}
                        className="text-red-600 text-sm font-bold px-2"
                        title="Remover"
                      >
                        ✕
                      </button>
                    </div>

                    {/* +/− só para unidade */}
                    {!isPeso && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => dec(i.id)}
                          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                        >
                          −
                        </button>
                        <div className="font-bold w-10 text-center">{i.quantidade}</div>
                        <button
                          onClick={() => inc(i.id)}
                          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
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
              * Pagamento e baixa ficam no <b>Caixa</b>.
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

            {loadingPre && <div className="text-xs text-gray-500 mt-2">Carregando...</div>}

            {!loadingPre && preVendas.length === 0 && (
              <div className="text-xs text-gray-500 mt-2">Nenhuma comanda aberta.</div>
            )}

            <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
              {preVendas.map((v) => (
                <div key={v.id} className="border rounded-xl p-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm">
                      {v.comanda_numero ? `Comanda ${v.comanda_numero}` : `#${v.id.slice(0, 6).toUpperCase()}`}
                    </div>
                    <div className="text-sm font-extrabold text-red-600">R$ {brl(Number(v.total || 0))}</div>
                  </div>

                  <div className="text-xs text-gray-600 mt-1">{new Date(v.data).toLocaleString("pt-BR")}</div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => abrirPreVenda(v.id)}
                      className="py-2 rounded bg-gray-900 text-white hover:bg-black font-bold"
                    >
                      Abrir
                    </button>

                    <button
                      onClick={() => excluirPreVenda(v.id)}
                      disabled={salvando}
                      className="py-2 rounded border border-red-500 text-red-600 hover:bg-red-50 font-bold"
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
