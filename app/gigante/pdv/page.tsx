"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Produto = {
  id: string;
  nome: string;
  preco: number;
  imagem_url?: string | null;
  categoria?: string | null;
  estoque?: number | null;
};

type ItemCarrinho = {
  id: string;
  nome: string;
  preco: number;
  imagem_url?: string | null;
  quantidade: number;
};

type Pagamento = "pix" | "dinheiro" | "debito" | "credito";
type Modo = "venda" | "pre_venda";

function money(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PDV() {
  const searchParams = useSearchParams();
  const vendaParam = searchParams.get("venda"); // ✅ ID da pré-venda se veio pela URL

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [drawer, setDrawer] = useState(false);

  const [modo, setModo] = useState<Modo>("venda");
  const [pagamento, setPagamento] = useState<Pagamento>("pix");
  const [loading, setLoading] = useState(false);

  // ✅ controle de edição de pré-venda
  const [vendaId, setVendaId] = useState<string | null>(null);
  const [editandoPrevenda, setEditandoPrevenda] = useState(false);

  // 🔄 Carregar produtos
  useEffect(() => {
    async function carregarProdutos() {
      const { data, error } = await supabase
        .from("gigante_produtos")
        .select("id,nome,preco,imagem_url,categoria,estoque")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) console.error(error);
      setProdutos((data as any) || []);
    }
    carregarProdutos();
  }, []);

  // ✅ Se vier ?venda=ID, carrega a pré-venda e abre carrinho
  useEffect(() => {
    if (!vendaParam) return;

    async function carregarPrevenda(id: string) {
      try {
        setLoading(true);

        const { data: venda, error: ev } = await supabase
          .from("gigante_vendas")
          .select("id,origem,status,metodo_pagamento,pagamento_detalhe,total")
          .eq("id", id)
          .single();

        if (ev) throw ev;

        const { data: its, error: ei } = await supabase
          .from("gigante_venda_itens")
          .select("produto_id,nome,preco,quantidade")
          .eq("venda_id", id)
          .order("nome", { ascending: true });

        if (ei) throw ei;

        setVendaId(id);
        setEditandoPrevenda(true);
        setModo("pre_venda");

        // se tiver pagamento salvo, tenta setar
        const det = (venda as any)?.pagamento_detalhe as string | null;
        if (det === "pix" || det === "dinheiro" || det === "debito" || det === "credito") {
          setPagamento(det);
        }

        const itensCarrinho: ItemCarrinho[] = (its || []).map((i: any) => ({
          id: i.produto_id || i.id, // produto_id
          nome: i.nome,
          preco: Number(i.preco || 0),
          imagem_url: null, // (opcional) dá pra mapear com produtos depois
          quantidade: Number(i.quantidade || 1),
        }));

        // tenta completar imagens pelo catálogo já carregado depois
        setCarrinho(itensCarrinho);
        setDrawer(true);
      } catch (e) {
        console.error(e);
        alert("Não consegui carregar a pré-venda. (RLS/ID inválido)");
      } finally {
        setLoading(false);
      }
    }

    carregarPrevenda(vendaParam);
  }, [vendaParam]);

  // 🧩 Categorias
  const categorias = useMemo(() => {
    const set = new Set<string>();
    produtos.forEach((p) => {
      if (p.categoria && p.categoria.trim()) set.add(p.categoria.trim());
    });
    return ["todas", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [produtos]);

  // 🔍 Filtro
  const filtrados = useMemo(() => {
    const b = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      const okBusca = !b || p.nome.toLowerCase().includes(b);
      const okCat = categoria === "todas" || (p.categoria || "").trim() === categoria;
      return okBusca && okCat;
    });
  }, [produtos, busca, categoria]);

  // ➕ add / ➖ remove
  function add(produto: Produto, qtd = 1) {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.id === produto.id);
      if (existe) {
        return prev.map((i) => (i.id === produto.id ? { ...i, quantidade: i.quantidade + qtd } : i));
      }
      return [
        ...prev,
        {
          id: produto.id,
          nome: produto.nome,
          preco: Number(produto.preco) || 0,
          imagem_url: produto.imagem_url ?? null,
          quantidade: qtd,
        },
      ];
    });
    setDrawer(true);
  }

  function dec(id: string) {
    setCarrinho((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      if (item.quantidade <= 1) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, quantidade: i.quantidade - 1 } : i));
    });
  }

  function inc(id: string) {
    setCarrinho((prev) => prev.map((i) => (i.id === id ? { ...i, quantidade: i.quantidade + 1 } : i)));
  }

  function remover(id: string) {
    setCarrinho((prev) => prev.filter((i) => i.id !== id));
  }

  function limpar() {
    setCarrinho([]);
  }

  const qtdItens = useMemo(() => carrinho.reduce((s, i) => s + Number(i.quantidade || 0), 0), [carrinho]);

  const total = useMemo(
    () => carrinho.reduce((s, i) => s + Number(i.preco) * Number(i.quantidade), 0),
    [carrinho]
  );

  // ✅ cria ou atualiza (pré-venda)
  async function salvarPrevenda() {
    if (carrinho.length === 0) return;

    try {
      setLoading(true);

      // 1) cria venda se não existe
      if (!vendaId) {
        const { data: venda, error: ev } = await supabase
          .from("gigante_vendas")
          .insert({
            data: new Date().toISOString(),
            subtotal: total,
            frete: 0,
            total: total,
            metodo_pagamento: "A DEFINIR",
            pagamento_detalhe: "pendente",
            tipo_entrega: "retirada",
            status: "novo",
            origem: "PDV-PREV",
            observacoes: "PRÉ-VENDA (PDV)",
          })
          .select("id")
          .single();

        if (ev) throw ev;

        // cria itens
        const itens = carrinho.map((i) => ({
          venda_id: venda.id,
          produto_id: i.id,
          nome: i.nome,
          quantidade: Number(i.quantidade),
          preco: Number(i.preco),
          subtotal: Number(i.preco) * Number(i.quantidade),
        }));

        const { error: ei } = await supabase.from("gigante_venda_itens").insert(itens);
        if (ei) throw ei;

        setVendaId(venda.id);
        setEditandoPrevenda(true);
        alert("Pré-venda salva! ✅");
        return;
      }

      // 2) se já existe: atualiza venda e troca itens
      const { error: eu } = await supabase
        .from("gigante_vendas")
        .update({
          subtotal: total,
          total: total,
          status: "novo",
          origem: "PDV-PREV",
        })
        .eq("id", vendaId);

      if (eu) throw eu;

      // apaga itens antigos
      const { error: ed } = await supabase.from("gigante_venda_itens").delete().eq("venda_id", vendaId);
      if (ed) throw ed;

      // insere itens novos
      const itensNovos = carrinho.map((i) => ({
        venda_id: vendaId,
        produto_id: i.id,
        nome: i.nome,
        quantidade: Number(i.quantidade),
        preco: Number(i.preco),
        subtotal: Number(i.preco) * Number(i.quantidade),
      }));

      const { error: ei2 } = await supabase.from("gigante_venda_itens").insert(itensNovos);
      if (ei2) throw ei2;

      alert("Pré-venda atualizada! ✅");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar/atualizar pré-venda. Veja o console (F12).");
    } finally {
      setLoading(false);
    }
  }

  // ✅ finalizar (transforma em venda)
  async function finalizarVenda() {
    if (carrinho.length === 0) return;

    try {
      setLoading(true);

      // se não tem vendaId, cria como venda direto
      if (!vendaId) {
        const { data: venda, error: ev } = await supabase
          .from("gigante_vendas")
          .insert({
            data: new Date().toISOString(),
            subtotal: total,
            frete: 0,
            total: total,
            metodo_pagamento: pagamento.toUpperCase(),
            pagamento_detalhe: pagamento,
            tipo_entrega: "retirada",
            status: "entregue",
            origem: "PDV",
          })
          .select("id")
          .single();

        if (ev) throw ev;

        const itens = carrinho.map((i) => ({
          venda_id: venda.id,
          produto_id: i.id,
          nome: i.nome,
          quantidade: Number(i.quantidade),
          preco: Number(i.preco),
          subtotal: Number(i.preco) * Number(i.quantidade),
        }));

        const { error: ei } = await supabase.from("gigante_venda_itens").insert(itens);
        if (ei) throw ei;

        alert("Venda concluída! ✅");
        setCarrinho([]);
        setDrawer(false);
        setVendaId(null);
        setEditandoPrevenda(false);
        setModo("venda");
        return;
      }

      // se é edição de pré-venda: atualiza e finaliza
      const { error: eu } = await supabase
        .from("gigante_vendas")
        .update({
          subtotal: total,
          total: total,
          metodo_pagamento: pagamento.toUpperCase(),
          pagamento_detalhe: pagamento,
          status: "entregue",
          origem: "PDV", // ✅ vira venda de PDV
        })
        .eq("id", vendaId);

      if (eu) throw eu;

      // troca itens pra garantir
      const { error: ed } = await supabase.from("gigante_venda_itens").delete().eq("venda_id", vendaId);
      if (ed) throw ed;

      const itensNovos = carrinho.map((i) => ({
        venda_id: vendaId,
        produto_id: i.id,
        nome: i.nome,
        quantidade: Number(i.quantidade),
        preco: Number(i.preco),
        subtotal: Number(i.preco) * Number(i.quantidade),
      }));

      const { error: ei2 } = await supabase.from("gigante_venda_itens").insert(itensNovos);
      if (ei2) throw ei2;

      alert("Pré-venda finalizada como VENDA! ✅");
      setCarrinho([]);
      setDrawer(false);
      setVendaId(null);
      setEditandoPrevenda(false);
      setModo("venda");
    } catch (e) {
      console.error(e);
      alert("Erro ao finalizar venda. Veja o console (F12).");
    } finally {
      setLoading(false);
    }
  }

  function sairDaEdicao() {
    setVendaId(null);
    setEditandoPrevenda(false);
    setModo("venda");
    setCarrinho([]);
    setDrawer(false);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero */}
      <div className="relative">
        <div className="h-[200px] w-full bg-black">
          <Image src="/hero-assados.jpg" alt="Gigante dos Assados" fill priority className="object-cover opacity-90" />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-white">
          <div className="text-3xl font-extrabold text-center">
            🧾 PDV — Gigante dos Assados
          </div>

          <div className="text-sm opacity-90 mt-1 text-center">
            {editandoPrevenda ? (
              <>🕓 Editando Pré-venda: <b>{String(vendaId).slice(0, 6).toUpperCase()}</b></>
            ) : (
              <>Toque no produto para adicionar • {qtdItens} itens</>
            )}
          </div>

          <div className="w-full max-w-2xl mt-4">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto…"
              className="w-full p-3 rounded-full text-black shadow-xl outline-none"
            />
          </div>
        </div>

        <button onClick={() => setDrawer(true)} className="absolute top-4 right-4 bg-white rounded-full px-4 py-2 shadow font-bold">
          🛒 {qtdItens}
        </button>
      </div>

      {/* Categorias */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categorias
            .map((c) => (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                className={`px-4 py-2 rounded-full border whitespace-nowrap ${
                  categoria === c ? "bg-red-600 text-white border-red-600" : "bg-white"
                }`}
              >
                {c === "todas" ? "Todas" : c}
              </button>
            ))}
        </div>
      </div>

      {/* Produtos */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtrados.map((p) => (
          <button
            key={p.id}
            onClick={() => add(p, 1)}
            className="bg-white rounded-2xl shadow hover:scale-[1.02] transition overflow-hidden text-left"
          >
            <div className="relative w-full h-36">
              <Image
                src={p.imagem_url || "/produtos/placeholder.png"}
                alt={p.nome}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>

            <div className="p-3">
              <div className="font-bold text-sm text-gray-800 line-clamp-2">{p.nome}</div>
              <div className="mt-1 text-red-600 font-extrabold">R$ {money(Number(p.preco || 0))}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-600">{p.categoria ? p.categoria : "—"}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100">+ Add</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Drawer */}
      {drawer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
          <div className="bg-white w-full max-w-sm h-full p-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">🛒 Carrinho</div>
              <button onClick={() => setDrawer(false)} className="text-gray-500">
                Fechar ✕
              </button>
            </div>

            {/* Modo */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setModo("venda")}
                className={`py-2 rounded font-bold ${modo === "venda" ? "bg-green-600 text-white" : "border"}`}
                disabled={editandoPrevenda} // ✅ evita trocar modo quando está editando pré-venda
                title={editandoPrevenda ? "Você está editando uma pré-venda" : "Venda direta"}
              >
                ✅ Venda
              </button>
              <button
                onClick={() => setModo("pre_venda")}
                className={`py-2 rounded font-bold ${modo === "pre_venda" ? "bg-yellow-500 text-white" : "border"}`}
              >
                🕓 Pré-venda
              </button>
            </div>

            {modo === "pre_venda" && (
              <div className="mt-2 text-xs text-gray-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                Pré-venda salva como <b>NOVO</b> e você pode abrir depois para editar/finalizar.
              </div>
            )}

            {editandoPrevenda && (
              <div className="mt-2 text-xs text-gray-700 bg-blue-50 border border-blue-200 rounded p-2">
                ✏️ Editando pré-venda <b>{String(vendaId).slice(0, 6).toUpperCase()}</b>
              </div>
            )}

            {carrinho.length === 0 ? (
              <div className="text-center text-gray-500 py-10">Carrinho vazio.</div>
            ) : (
              <>
                <div className="mt-4 space-y-3">
                  {carrinho.map((i) => (
                    <div key={i.id} className="flex gap-3 border rounded-xl p-2">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={i.imagem_url || "/produtos/placeholder.png"}
                          alt={i.nome}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{i.nome}</div>
                        <div className="text-red-600 font-extrabold text-sm">R$ {money(Number(i.preco))}</div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button onClick={() => dec(i.id)} className="w-8 h-8 rounded-full border" title="Diminuir">
                              −
                            </button>
                            <span className="font-bold w-6 text-center">{i.quantidade}</span>
                            <button onClick={() => inc(i.id)} className="w-8 h-8 rounded-full border" title="Aumentar">
                              +
                            </button>
                          </div>

                          <button onClick={() => remover(i.id)} className="text-red-600 text-sm font-bold" title="Remover">
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Itens</span>
                    <b>{qtdItens}</b>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="font-bold">Total</span>
                    <span className="font-extrabold">R$ {money(total)}</span>
                  </div>

                  {/* Pagamento */}
                  {modo === "venda" && (
                    <div className="mt-3">
                      <p className="font-bold text-sm mb-2">💳 Pagamento</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["pix", "dinheiro", "debito", "credito"] as Pagamento[]).map((p) => (
                          <button
                            key={p}
                            onClick={() => setPagamento(p)}
                            className={`py-2 rounded ${pagamento === p ? "bg-black text-white" : "border"}`}
                          >
                            {p === "pix" ? "Pix" : p === "dinheiro" ? "Dinheiro" : p === "debito" ? "Débito" : "Crédito"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2 mt-4">
                    <button onClick={limpar} className="flex-1 py-3 rounded border font-bold" disabled={loading}>
                      Limpar
                    </button>

                    {modo === "pre_venda" ? (
                      <button
                        onClick={salvarPrevenda}
                        className={`flex-1 py-3 rounded font-extrabold text-white ${
                          loading ? "bg-gray-400" : "bg-yellow-500 hover:bg-yellow-600"
                        }`}
                        disabled={loading}
                      >
                        {loading ? "Salvando..." : editandoPrevenda ? "Atualizar Pré-venda" : "Salvar Pré-venda"}
                      </button>
                    ) : (
                      <button
                        onClick={finalizarVenda}
                        className={`flex-1 py-3 rounded font-extrabold text-white ${
                          loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
                        }`}
                        disabled={loading}
                      >
                        {loading ? "Finalizando..." : editandoPrevenda ? "Finalizar Pré-venda" : "Finalizar Venda"}
                      </button>
                    )}
                  </div>

                  {editandoPrevenda && (
                    <button onClick={sairDaEdicao} className="w-full mt-2 py-2 rounded border" disabled={loading}>
                      Sair da edição (novo pedido)
                    </button>
                  )}

                  <button onClick={() => setDrawer(false)} className="w-full mt-2 py-2 rounded border" disabled={loading}>
                    🛍️ Continuar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
