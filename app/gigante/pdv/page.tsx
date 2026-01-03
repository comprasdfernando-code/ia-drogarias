"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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
  status: string;
  comanda?: string | null;
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
  const [comandaAtual, setComandaAtual] = useState<string>("");

  const [salvando, setSalvando] = useState(false);

  // ✅ evita abrir 2x e dobrar itens
  const lastOpenedRef = useRef<string>("");

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
      .select("id,data,total,status,comanda")
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

  // 🔄 se vier ?id=... na URL, abre a pré-venda automaticamente (1 vez)
  useEffect(() => {
    if (!preIdFromUrl) return;
    if (lastOpenedRef.current === preIdFromUrl) return;

    lastOpenedRef.current = preIdFromUrl;
    setPreVendaId(preIdFromUrl);
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
      prev.map((x) =>
        x.produto_id === produto_id
          ? { ...x, quantidade: x.quantidade + 1 }
          : x
      )
    );
  }

  function dec(produto_id: string) {
    setCarrinho((prev) =>
      prev
        .map((x) =>
          x.produto_id === produto_id
            ? { ...x, quantidade: Math.max(1, x.quantidade - 1) }
            : x
        )
        .filter((x) => x.quantidade > 0)
    );
  }

  function remover(produto_id: string) {
    setCarrinho((prev) => prev.filter((x) => x.produto_id !== produto_id));
  }

  function limparTudo() {
    setCarrinho([]);
    setPreVendaId("");
    setComandaAtual("");
    setBusca("");
    lastOpenedRef.current = "";
    router.replace("/gigante/pdv");
  }

  // ✅ abrir pré-venda (carregar itens pro carrinho SEM duplicar)
  async function abrirPreVenda(id: string) {
    try {
      setSalvando(true);

      const { data: v, error: ev } = await supabase
        .from("gigante_vendas")
        .select("id,status,total,comanda")
        .eq("id", id)
        .single();

      if (ev || !v) throw ev || new Error("Pré-venda não encontrada");

      setComandaAtual(String(v.comanda || ""));
      setPreVendaId(id);

      const { data: its, error: ei } = await supabase
        .from("gigante_venda_itens")
        .select("produto_id,nome,preco,quantidade,criado_em")
        .eq("venda_id", id)
        .order("criado_em", { ascending: true });

      if (ei) throw ei;

      // ✅ agrupa por produto_id (caso tenha repetição no banco)
      const mapa = new Map<
        string,
        { produto_id: string; nome: string; preco: number; quantidade: number }
      >();

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

      router.replace(`/gigante/pdv?id=${id}`);
    } catch (e) {
      console.error(e);
      alert("Erro ao abrir pré-venda.");
    } finally {
      setSalvando(false);
    }
  }

  // ✅ salvar pré-venda (cria ou atualiza) e ZERA itens ao salvar
  async function salvarPreVenda() {
    if (salvando) return;

    if (carrinho.length === 0) {
      alert("Carrinho vazio.");
      return;
    }

    // ✅ comanda só pede quando for NOVA
    let comanda = comandaAtual?.trim();
    if (!preVendaId) {
      comanda = prompt("Número da comanda (ex: 12):")?.trim() || "";
      if (!comanda) {
        alert("Informe o número da comanda.");
        return;
      }
      setComandaAtual(comanda);
    } else {
      // reabrindo: mantém comanda. se estiver vazio por algum motivo, pede.
      if (!comanda) {
        comanda = prompt("Número da comanda:")?.trim() || "";
        if (!comanda) {
          alert("Informe o número da comanda.");
          return;
        }
        setComandaAtual(comanda);
      }
    }

    try {
      setSalvando(true);

      const payloadVenda: any = {
        data: new Date().toISOString(),
        total,
        origem: "PDV",
        status: "pre_venda",
        tipo_entrega: "retirada",
        comanda,
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
        const { error: eu } = await supabase
          .from("gigante_vendas")
          .update(payloadVenda)
          .eq("id", id);

        if (eu) throw eu;

        // apaga itens antigos pra não duplicar
        const { error: ed } = await supabase
          .from("gigante_venda_itens")
          .delete()
          .eq("venda_id", id);

        if (ed) throw ed;
      }

      // salva itens
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

      alert(`Pré-venda salva! Comanda ${comanda} ✅`);

      // ✅ zera itens ao salvar
      limparTudo();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar pré-venda. (RLS/colunas) — veja o console.");
    } finally {
      setSalvando(false);
    }
  }

  // ✅ excluir pré-venda
  async function excluirPreVenda(v: VendaPre) {
    if (salvando) return;

    const ok = confirm(
      `Excluir a pré-venda da comanda ${v.comanda || "-"} (#${v.id
        .slice(0, 6)
        .toUpperCase()})?`
    );
    if (!ok) return;

    try {
      setSalvando(true);

      // se seu FK estiver ON DELETE CASCADE, só isso já apaga os itens
      const { error } = await supabase.from("gigante_vendas").delete().eq("id", v.id);
      if (error) throw error;

      // se você NÃO tiver cascade, descomenta isso:
      // await supabase.from("gigante_venda_itens").delete().eq("venda_id", v.id);

      await carregarPreVendas();

      // se estava aberta na tela, limpa
      if (preVendaId === v.id) limparTudo();

      alert("Pré-venda excluída ✅");
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir pré-venda.");
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
                  Comanda: <b>{comandaAtual || "-"}</b> • #{preVendaId.slice(0, 6).toUpperCase()}
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
              title="Salvar pré-venda e limpar a tela"
            >
              🧷 Salvar Pré-venda
            </button>

            <button
              onClick={limparTudo}
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

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
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
                onClick={() => addProduto(p)}
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
                    R$ {brl(Number(p.preco))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Carrinho + Lista de Comandas */}
        <div className="space-y-4">
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

              {carrinho.map((i) => (
                <div key={i.id} className="border rounded-xl p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{i.nome}</div>
                      <div className="text-xs text-gray-600">
                        R$ {brl(Number(i.preco))} • Sub: R${" "}
                        {brl(Number(i.preco) * Number(i.quantidade))}
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
                🧷 Salvar Pré-venda
              </button>

              <div className="mt-2 text-xs text-gray-500">
                * Este PDV só salva comanda (pré-venda). Baixa/pagamento fica no Caixa.
              </div>
            </div>
          </div>

          {/* Lista de Pré-vendas */}
          <div className="bg-white rounded-2xl shadow p-3">
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
              {preVendas.map((v) => (
                <div key={v.id} className="border rounded-xl p-2">
                  <button
                    onClick={() => abrirPreVenda(v.id)}
                    className="w-full text-left hover:bg-gray-50 rounded-lg p-1"
                    title="Abrir comanda"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-base">
                        Comanda {String(v.comanda || "-")}
                      </div>
                      <div className="text-sm font-extrabold text-red-600">
                        R$ {brl(Number(v.total || 0))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      #{v.id.slice(0, 6).toUpperCase()} •{" "}
                      {new Date(v.data).toLocaleString("pt-BR")}
                    </div>
                  </button>

                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => abrirPreVenda(v.id)}
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black"
                    >
                      Abrir
                    </button>
                    <button
                      onClick={() => excluirPreVenda(v)}
                      className="px-3 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                      title="Excluir pré-venda"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-[11px] text-gray-500">
              Dica: abrir direto por URL: <b>/gigante/pdv?id=XXXX</b>
            </div>
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
