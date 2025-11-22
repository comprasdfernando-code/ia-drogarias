"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";



type Cliente = {
  id: string;
  nome_fantasia: string;
  cnpj: string;
};

type Produto = {
  id: string;
  codigo: string;
  descricao: string;
  laboratorio: string | null;
  preco_custo: number;
  preco_venda: number;
};

type ItemCarrinho = {
  produto: Produto;
  quantidade: number;
  descontoPercentual: number;
};

export default function PdvDfDistribuidora() {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loginCnpj, setLoginCnpj] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErro, setLoginErro] = useState("");

  const [busca, setBusca] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [salvandoPedido, setSalvandoPedido] = useState(false);

  // ---- LOGIN DO CLIENTE (CNPJ + SENHA SIMPLES) ----
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErro("");
    setLoginLoading(true);

    // aqui você ajusta para sua regra real de autenticação
    const { data, error } = await supabase
      .from("df_clientes")
      .select("*")
      .eq("cnpj", loginCnpj.trim())
      .eq("senha_pdv", loginSenha.trim())
      .maybeSingle();

    setLoginLoading(false);

    if (error || !data) {
      setLoginErro("CNPJ ou senha inválidos.");
      return;
    }

    setCliente(data as Cliente);
  }

  // ---- CARREGAR PRODUTOS POR BUSCA ----
  async function buscarProdutos() {
    if (!busca.trim()) return;

    setLoadingProdutos(true);

    const { data, error } = await supabase
      .from("df_produtos")
      .select("*")
      .or(
        `codigo.ilike.%${busca}%,descricao.ilike.%${busca}%`
      )
      .limit(50);

    if (!error && data) {
      setProdutos(data as Produto[]);
    }

    setLoadingProdutos(false);
  }

  // Enter no campo de busca dispara a pesquisa
  function handleBuscaKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      buscarProdutos();
    }
  }

  // ---- CARRINHO ----
  function adicionarAoCarrinho(produto: Produto) {
    setCarrinho((atual) => {
      const idx = atual.findIndex(
        (item) => item.produto.id === produto.id
      );
      if (idx >= 0) {
        const copia = [...atual];
        copia[idx] = {
          ...copia[idx],
          quantidade: copia[idx].quantidade + 1,
        };
        return copia;
      }
      return [
        ...atual,
        { produto, quantidade: 1, descontoPercentual: 0 },
      ];
    });
  }

  function alterarQuantidade(produtoId: string, qtd: number) {
    setCarrinho((atual) =>
      atual
        .map((item) =>
          item.produto.id === produtoId
            ? { ...item, quantidade: Math.max(1, qtd) }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  }

  function alterarDesconto(produtoId: string, desconto: number) {
    setCarrinho((atual) =>
      atual.map((item) =>
        item.produto.id === produtoId
          ? { ...item, descontoPercentual: Math.min(Math.max(desconto, 0), 100) }
          : item
      )
    );
  }

  function removerItem(produtoId: string) {
    setCarrinho((atual) =>
      atual.filter((item) => item.produto.id !== produtoId)
    );
  }

  const totalPedido = carrinho.reduce((total, item) => {
    const bruto = item.produto.preco_venda * item.quantidade;
    const desconto = (bruto * item.descontoPercentual) / 100;
    return total + bruto - desconto;
  }, 0);

  // ---- GRAVAR PEDIDO ----
  async function finalizarPedido() {
    if (!cliente) return;
    if (carrinho.length === 0) return;

    setSalvandoPedido(true);

    const { data: pedido, error: pedidoError } = await supabase
      .from("df_pedidos")
      .insert({
        cliente_id: cliente.id,
        total: totalPedido,
        status: "PENDENTE",
      })
      .select("id")
      .single();

    if (pedidoError || !pedido) {
      setSalvandoPedido(false);
      alert("Erro ao gravar pedido.");
      return;
    }

    const itens = carrinho.map((item) => ({
      pedido_id: pedido.id,
      produto_id: item.produto.id,
      quantidade: item.quantidade,
      preco_unitario: item.produto.preco_venda,
      desconto_percentual: item.descontoPercentual,
    }));

    const { error: itensError } = await supabase
      .from("df_pedidos_itens")
      .insert(itens);

    setSalvandoPedido(false);

    if (itensError) {
      alert("Erro ao gravar itens do pedido.");
      return;
    }

    setCarrinho([]);
    alert(`Pedido ${pedido.id} gravado com sucesso!`);
  }

  // -----------------------------------------------------

  if (!cliente) {
    // TELA DE LOGIN
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <header className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">IA Drogarias</span>
            <span className="text-sm opacity-80">DF Distribuidora</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-md">
            <h1 className="text-xl font-semibold mb-4 text-center">
              Login — DF Distribuidora
            </h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  CNPJ da Farmácia
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={loginCnpj}
                  onChange={(e) => setLoginCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Senha do PDV
                </label>
                <input
                  type="password"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={loginSenha}
                  onChange={(e) => setLoginSenha(e.target.value)}
                  placeholder="********"
                />
              </div>
              {loginErro && (
                <p className="text-red-500 text-sm">{loginErro}</p>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {loginLoading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // TELA DO PDV DF DISTRIBUIDORA (IGUAL A DA REDE FABIANO, COM ACRÉSCIMOS)
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">IA Drogarias</span>
          <span className="text-sm opacity-80">DF Distribuidora — PDV</span>
        </div>
        <div className="text-xs text-right">
          <div className="font-semibold">
            Cliente: {cliente.nome_fantasia}
          </div>
          <div className="opacity-80">CNPJ: {cliente.cnpj}</div>
        </div>
      </header>

      <main className="flex-1 px-6 py-4">
        <h1 className="text-xl font-semibold mb-2">
          💊 PDV — DF Distribuidora
        </h1>

        <div className="mb-2 text-xs text-slate-600">
          Atalhos Rápidos: F2 - Buscar | F3 - Limpar | F7 - Finalizar
        </div>

        <div className="mb-4">
          <input
            type="text"
            className="w-full bg-white border rounded-lg px-4 py-3 text-sm shadow-sm"
            placeholder="Digite o nome ou código de barras..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={handleBuscaKeyDown}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Descrição</th>
                <th className="px-3 py-2 text-center">Qtde</th>
                <th className="px-3 py-2 text-center">% Desc</th>
                <th className="px-3 py-2 text-right">Pr. Custo</th>
                <th className="px-3 py-2 text-right">Pr. Venda</th>
                <th className="px-3 py-2 text-right">Pr. Desc</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {loadingProdutos && (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-4 text-slate-500"
                  >
                    Carregando produtos...
                  </td>
                </tr>
              )}

              {!loadingProdutos &&
                produtos.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-4 text-slate-400"
                    >
                      Nenhum produto carregado. Digite algo na busca e
                      pressione Enter.
                    </td>
                  </tr>
                )}

              {!loadingProdutos &&
                produtos.map((produto) => {
                  const itemCarrinho = carrinho.find(
                    (i) => i.produto.id === produto.id
                  );
                  const qtde = itemCarrinho?.quantidade ?? 0;
                  const desc = itemCarrinho?.descontoPercentual ?? 0;
                  const bruto = produto.preco_venda * qtde;
                  const descValor = (bruto * desc) / 100;
                  const total = bruto - descValor;

                  return (
                    <tr
                      key={produto.id}
                      className="border-t hover:bg-slate-50"
                    >
                      <td className="px-3 py-2">{produto.codigo}</td>
                      <td className="px-3 py-2">
                        {produto.descricao}
                        {produto.laboratorio && (
                          <span className="text-xs text-slate-500 ml-1">
                            ({produto.laboratorio})
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={1}
                          className="w-16 border rounded px-1 py-0.5 text-center text-xs"
                          value={qtde || ""}
                          onChange={(e) =>
                            alterarQuantidade(
                              produto.id,
                              Number(e.target.value || 0)
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-16 border rounded px-1 py-0.5 text-center text-xs"
                          value={desc || ""}
                          onChange={(e) =>
                            alterarDesconto(
                              produto.id,
                              Number(e.target.value || 0)
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {produto.preco_custo.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {produto.preco_venda.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {qtde > 0 ? (bruto - total + produto.preco_venda * qtde - bruto).toFixed(2) : "0,00"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {qtde > 0 ? total.toFixed(2) : "0,00"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => adicionarAoCarrinho(produto)}
                          className="text-xs bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-700"
                        >
                          + Add
                        </button>
                        {qtde > 0 && (
                          <button
                            onClick={() => removerItem(produto.id)}
                            className="ml-2 text-xs text-red-500"
                          >
                            Rem
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Itens no pedido:{" "}
            <span className="font-semibold">
              {carrinho.length}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold">
              Total: R$ {totalPedido.toFixed(2)}
            </div>
            <button
              onClick={finalizarPedido}
              disabled={carrinho.length === 0 || salvandoPedido}
              className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
            >
              {salvandoPedido ? "Gravando..." : "Finalizar Pedido (F7)"}
            </button>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-300 text-xs text-center py-2 mt-4">
        © {new Date().getFullYear()} IA Drogarias • DF Distribuidora — Todos
        os direitos reservados.
      </footer>
    </div>
  );
}
