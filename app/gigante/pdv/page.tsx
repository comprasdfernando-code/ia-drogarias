"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PDV() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [drawer, setDrawer] = useState(false);

  const [modo, setModo] = useState<Modo>("venda"); // ✅ NOVO: venda | pre_venda
  const [pagamento, setPagamento] = useState<Pagamento>("pix");
  const [loading, setLoading] = useState(false);

  // 🔄 Carregar produtos
  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from("gigante_produtos")
        .select("id,nome,preco,imagem_url,categoria,estoque")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) console.error(error);
      setProdutos((data as any) || []);
    }
    carregar();
  }, []);

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
      const okCat =
        categoria === "todas" || (p.categoria || "").trim() === categoria;
      return okBusca && okCat;
    });
  }, [produtos, busca, categoria]);

  // ➕ add / ➖ remove
  function add(produto: Produto, qtd = 1) {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.id === produto.id);
      if (existe) {
        return prev.map((i) =>
          i.id === produto.id
            ? { ...i, quantidade: i.quantidade + qtd }
            : i
        );
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
      return prev.map((i) =>
        i.id === id ? { ...i, quantidade: i.quantidade - 1 } : i
      );
    });
  }

  function inc(id: string) {
    setCarrinho((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantidade: i.quantidade + 1 } : i
      )
    );
  }

  function remover(id: string) {
    setCarrinho((prev) => prev.filter((i) => i.id !== id));
  }

  function limpar() {
    setCarrinho([]);
  }

  const qtdItens = useMemo(
    () => carrinho.reduce((s, i) => s + Number(i.quantidade || 0), 0),
    [carrinho]
  );

  const total = useMemo(
    () =>
      carrinho.reduce(
        (s, i) => s + Number(i.preco) * Number(i.quantidade),
        0
      ),
    [carrinho]
  );

  async function finalizar() {
    if (carrinho.length === 0) return;

    try {
      setLoading(true);

      const isPrevenda = modo === "pre_venda";

      // ✅ Cria venda
      const { data: venda, error: erroVenda } = await supabase
        .from("gigante_vendas")
        .insert({
          data: new Date().toISOString(),
          subtotal: total,
          frete: 0,
          total: total,

          // ✅ Se for pré-venda, pagamento fica "A DEFINIR" (ou mantém o escolhido, você decide)
          metodo_pagamento: isPrevenda ? "A DEFINIR" : pagamento.toUpperCase(),
          pagamento_detalhe: isPrevenda ? "pendente" : pagamento,

          // PDV é retirada normalmente
          tipo_entrega: "retirada",

          // ✅ Pré-venda entra como NOVO, venda normal entra como ENTREGUE
          status: isPrevenda ? "novo" : "entregue",

          // ✅ Diferencia no painel
          origem: isPrevenda ? "PDV-PREV" : "PDV",

          observacoes: isPrevenda ? "PRÉ-VENDA (PDV)" : null,
        })
        .select("id")
        .single();

      if (erroVenda) throw erroVenda;

      // ✅ Itens
      const itens = carrinho.map((i) => ({
        venda_id: venda.id,
        produto_id: i.id,
        nome: i.nome,
        quantidade: Number(i.quantidade),
        preco: Number(i.preco),
        subtotal: Number(i.preco) * Number(i.quantidade),
      }));

      const { error: erroItens } = await supabase
        .from("gigante_venda_itens")
        .insert(itens);

      if (erroItens) throw erroItens;

      alert(
        isPrevenda
          ? "Pré-venda salva! ✅ (vai aparecer como NOVO no painel)"
          : "Venda concluída com sucesso! ✅"
      );

      setCarrinho([]);
      setDrawer(false);
      setBusca("");
      setCategoria("todas");
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar. Veja o console (F12).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Topo / Hero */}
      <div className="relative">
        <div className="h-[200px] w-full bg-black">
          <Image
            src="/hero-assados.jpg"
            alt="Gigante dos Assados"
            fill
            priority
            className="object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-white">
          <div className="text-3xl font-extrabold text-center">
            🧾 PDV — Gigante dos Assados
          </div>

          <div className="text-sm opacity-90 mt-1 text-center">
            Toque no produto para adicionar • {qtdItens} itens no carrinho
          </div>

          {/* Busca flutuante */}
          <div className="w-full max-w-2xl mt-4">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto… (ex: frango, kit, costela)"
              className="w-full p-3 rounded-full text-black shadow-xl outline-none"
            />
          </div>
        </div>

        {/* Botão carrinho */}
        <button
          onClick={() => setDrawer(true)}
          className="absolute top-4 right-4 bg-white rounded-full px-4 py-2 shadow font-bold"
        >
          🛒 {qtdItens}
        </button>
      </div>

      {/* Categorias */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`px-4 py-2 rounded-full border whitespace-nowrap ${
                categoria === c
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white"
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
              <div className="font-bold text-sm text-gray-800 line-clamp-2">
                {p.nome}
              </div>
              <div className="mt-1 text-red-600 font-extrabold">
                R$ {money(Number(p.preco || 0))}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  {p.categoria ? p.categoria : "—"}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                  + Add
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Drawer / Carrinho */}
      {drawer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
          <div className="bg-white w-full max-w-sm h-full p-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">🛒 Carrinho</div>
              <button
                onClick={() => setDrawer(false)}
                className="text-gray-500"
              >
                Fechar ✕
              </button>
            </div>

            {/* ✅ NOVO: MODO VENDA / PRÉ-VENDA */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setModo("venda")}
                className={`py-2 rounded font-bold ${
                  modo === "venda" ? "bg-green-600 text-white" : "border"
                }`}
              >
                ✅ Venda
              </button>
              <button
                onClick={() => setModo("pre_venda")}
                className={`py-2 rounded font-bold ${
                  modo === "pre_venda" ? "bg-yellow-500 text-white" : "border"
                }`}
              >
                🕓 Pré-venda
              </button>
            </div>

            {modo === "pre_venda" && (
              <div className="mt-2 text-xs text-gray-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                Pré-venda salva como <b>NOVO</b> no painel para finalizar depois.
              </div>
            )}

            {carrinho.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                Carrinho vazio.
                <div className="mt-2">
                  <button
                    onClick={() => setDrawer(false)}
                    className="px-4 py-2 rounded border"
                  >
                    Continuar
                  </button>
                </div>
              </div>
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
                        <div className="text-red-600 font-extrabold text-sm">
                          R$ {money(Number(i.preco))}
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => dec(i.id)}
                              className="w-8 h-8 rounded-full border"
                              title="Diminuir"
                            >
                              −
                            </button>
                            <span className="font-bold w-6 text-center">
                              {i.quantidade}
                            </span>
                            <button
                              onClick={() => inc(i.id)}
                              className="w-8 h-8 rounded-full border"
                              title="Aumentar"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => remover(i.id)}
                            className="text-red-600 text-sm font-bold"
                            title="Remover"
                          >
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
                    <span className="font-extrabold">
                      R$ {money(total)}
                    </span>
                  </div>

                  {/* Pagamento só faz sentido na VENDA normal */}
                  {modo === "venda" && (
                    <div className="mt-3">
                      <p className="font-bold text-sm mb-2">💳 Pagamento</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["pix", "dinheiro", "debito", "credito"] as Pagamento[]).map(
                          (p) => (
                            <button
                              key={p}
                              onClick={() => setPagamento(p)}
                              className={`py-2 rounded ${
                                pagamento === p
                                  ? "bg-black text-white"
                                  : "border"
                              }`}
                            >
                              {p === "pix"
                                ? "Pix"
                                : p === "dinheiro"
                                ? "Dinheiro"
                                : p === "debito"
                                ? "Débito"
                                : "Crédito"}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={limpar}
                      className="flex-1 py-3 rounded border font-bold"
                      disabled={loading}
                    >
                      Limpar
                    </button>

                    <button
                      onClick={finalizar}
                      className={`flex-1 py-3 rounded font-extrabold text-white ${
                        loading
                          ? "bg-gray-400"
                          : modo === "pre_venda"
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                      disabled={loading}
                    >
                      {loading
                        ? "Salvando..."
                        : modo === "pre_venda"
                        ? "Salvar Pré-venda"
                        : "Finalizar Venda"}
                    </button>
                  </div>

                  <button
                    onClick={() => setDrawer(false)}
                    className="w-full mt-2 py-2 rounded border"
                    disabled={loading}
                  >
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
