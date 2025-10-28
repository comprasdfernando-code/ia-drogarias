"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PDVPage() {
  const [busca, setBusca] = useState("");
  const [venda, setVenda] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [showPagamento, setShowPagamento] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🔍 Buscar produto
  async function buscarProduto(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;

    const valorBusca = busca.trim() || inputRef.current?.value.trim() || "";
    if (!valorBusca) return;

    try {
      // 🧠 1️⃣ Busca primeiro no estoque_farmacia (ligando com produtos)
      const { data, error } = await supabase
        .from("estoque_farmacia")
        .select(`
          id,
          quantidade,
          preco_local,
          produtos (
            id,
            nome,
            slug,
            codigo_barras,
            categoria,
            preco_venda,
            preco_custo,
            imagem
          )
        `)
        .eq("farmacia_id", 1) // ID da Drogaria Rede Fabiano
        .or(`produtos.nome.ilike.%${valorBusca}%,produtos.codigo_barras.ilike.%${valorBusca}%`)
        .limit(10);

      // ⚠️ Fallback — caso a tabela estoque_farmacia não retorne nada
      if (error || !data?.length) {
        console.warn("⚠️ Falha ou sem resultados no estoque_farmacia. Tentando tabela produtos:", error);
        const fallback = await supabase
          .from("produtos")
          .select("*")
          .or(`nome.ilike.%${valorBusca}%,codigo_barras.ilike.%${valorBusca}%`)
          .limit(10);

        if (fallback.error) {
          alert("Erro ao buscar produto!");
          console.error(fallback.error);
          return;
        }

        if (fallback.data && fallback.data.length > 0) {
          setResultados(fallback.data);
        } else {
          alert("Produto não encontrado!");
        }
        return;
      }

      // 🔄 Monta os produtos encontrados a partir do estoque_farmacia
      const formatados = data.map((item: any) => ({
        ...item.produtos,
        preco_venda: item.preco_local ?? item.produtos?.preco_venda ?? 0,
        preco_custo: item.produtos?.preco_custo ?? 0,
        estoque: item.quantidade ?? 0,
      }));

      setResultados(formatados);
    } catch (err) {
      console.error("❌ Erro inesperado ao buscar produto:", err);
      alert("Erro inesperado ao buscar produto!");
    }
  }

  // ➕ Adicionar produto
  function adicionarProduto(produto: any) {
    const existente = venda.find((p) => p.id === produto.id);
    let novaVenda;

    if (existente) {
      novaVenda = venda.map((p) =>
        p.id === produto.id ? { ...p, qtd: p.qtd + 1 } : p
      );
    } else {
      novaVenda = [
        ...venda,
        {
          ...produto,
          qtd: 1,
          desconto: 0,
          preco_desc: produto.preco_venda || 0,
        },
      ];
    }

    setVenda(novaVenda);
    calcularTotal(novaVenda);
    setResultados([]);
    setBusca("");
    inputRef.current?.focus();
  }

  // 🧮 Calcular total
  function calcularTotal(lista: any[]) {
    const soma = lista.reduce(
      (acc, p) =>
        acc +
        p.qtd * (p.preco_venda - p.preco_venda * (p.desconto / 100)),
      0
    );
    setTotal(soma);
  }

  // 🧾 Alterar quantidade
  function alterarQtd(id: any, delta: number) {
    const novaVenda = venda
      .map((p) =>
        p.id === id ? { ...p, qtd: Math.max(1, p.qtd + delta) } : p
      )
      .filter((p) => p.qtd > 0);
    setVenda(novaVenda);
    calcularTotal(novaVenda);
  }

  // 💸 Alterar desconto
  function alterarDesconto(id: any, valor: number) {
    const novaVenda = venda.map((p) =>
      p.id === id
        ? {
            ...p,
            desconto: valor,
            preco_desc: p.preco_venda - p.preco_venda * (valor / 100),
          }
        : p
    );
    setVenda(novaVenda);
    calcularTotal(novaVenda);
  }

  function limparVenda() {
    setVenda([]);
    setTotal(0);
  }

  // 💰 Pagamento
  const [pagamento, setPagamento] = useState<any>({
    dinheiro: "",
    troco: "",
    forma: "",
    tipo: "Balcão",
  });

  function calcularTroco(valor: string) {
    const recebido = parseFloat(valor || "0");
    const troco = recebido - total;
    setPagamento((prev: any) => ({
      ...prev,
      dinheiro: valor,
      troco: troco > 0 ? troco.toFixed(2) : "0.00",
    }));
  }
// 🔄 Atualizar estoque no Supabase
  async function atualizarEstoque(vendaAtual: any[]) {
    for (const item of vendaAtual) {
      try {
        // Busca o registro do estoque_farmacia correspondente
        const { data: estoque, error: buscaError } = await supabase
          .from("estoque_farmacia")
          .select("id, quantidade")
          .eq("farmacia_id", 1)
          .eq("produto_id", item.id)
          .maybeSingle();

        if (buscaError) {
          console.warn("⚠️ Erro ao buscar estoque:", buscaError);
          continue;
        }

        if (!estoque) {
          console.warn("⚠️ Produto não encontrado no estoque_farmacia:", item.nome);
          continue;
        }

        const novaQtd = Math.max(0, (estoque.quantidade || 0) - (item.qtd || 0));

        const { error: updateError } = await supabase
          .from("estoque_farmacia")
          .update({ quantidade: novaQtd })
          .eq("id", estoque.id);

        if (updateError) {
          console.error("❌ Erro ao atualizar estoque:", updateError);
        } else {
          console.log(`✅ Estoque atualizado: ${item.nome} = ${novaQtd}`);
        }
      } catch (err) {
        console.error("❌ Erro inesperado ao atualizar estoque:", err);
      } //
    }//
  }
  async function finalizarVenda() {
    alert("💰 Venda finalizada com sucesso!");
    await atualizarEstoque(venda);
    limparVenda();
    setShowPagamento(false);
  }

  // 🖨️ Imprimir cupom
  function imprimirCupom() {
    const novaJanela = window.open("", "_blank");
    if (!novaJanela) return;

    const data = new Date();
    const hora = data.toLocaleTimeString("pt-BR");
    const dia = data.toLocaleDateString("pt-BR");

    novaJanela.document.write(`
      <html>
        <head><title>Cupom de Venda</title></head>
        <body>
          <h2>Drogaria Rede Fabiano</h2>
          <p>Data: ${dia} - ${hora}</p>
          <hr>
          ${venda
            .map(
              (p) =>
                `${p.nome} (${p.qtd}x R$${p.preco_venda.toFixed(2)})` 
            )
            .join("<br>")}
          <hr>
          <h3>Total: R$ ${total.toFixed(2)}</h3>
        </body>
      </html>
    `);
    novaJanela.document.close();
    novaJanela.print();
  }

  // ⌨️ Atalhos
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "F2":
          e.preventDefault();
          inputRef.current?.focus();
          break;
        case "F3":
          e.preventDefault();
          limparVenda();
          break;
        case "F7":
          e.preventDefault();
          if (venda.length > 0) setShowPagamento(true);
          break;
        case "Delete":
          e.preventDefault();
          if (venda.length > 0) {
            const ultimo = venda[venda.length - 1];
            setVenda((prev) => prev.filter((p) => p.id !== ultimo.id));
          }
          break;
        case "p":
          if (e.ctrlKey) {
            e.preventDefault();
            imprimirCupom();
          }
          break;
        case "Escape":
          e.preventDefault();
          setShowPagamento(false);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [venda]);

  // === INTERFACE ===
  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">
          💻 PDV — Drogaria Rede Fabiano
        </h1>

        {/* Informativo dos atalhos */}
        <div className="hidden sm:block bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-gray-700">
          <p className="font-semibold text-blue-700 mb-1">⌨️ Atalhos Rápidos:</p>
          <p>F2 - Buscar | F3 - Limpar | F7 - Finalizar | Ctrl+P - Imprimir | Del - Remover | Esc - Fechar</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder="Digite o nome ou código de barras..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        onKeyDown={buscarProduto}
        className="w-full border p-3 rounded-md mb-4 text-lg focus:outline-blue-600"
      />

      {/* Produtos encontrados */}
      {resultados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {resultados.map((p) => (
            <div
              key={p.id}
              className="border rounded-xl bg-white shadow-md hover:shadow-lg transition-all p-4 flex flex-col"
            >
              <img
                src={p.imagem || "/no-image.png"}
                alt={p.nome}
                className="w-full h-32 object-contain mb-3 rounded-md bg-gray-50"
              />
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{p.nome}</h3>
              <span className="text-green-700 text-xs mb-2">Estoque: {p.estoque || 0}</span>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 bg-blue-50 rounded-md p-2 mb-3">
                <div>
                  <span className="block text-gray-500 text-xs">Custo</span>
                  <span className="font-semibold text-gray-800">
                    R$ {Number(p.preco_custo || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs">Venda</span>
                  <span className="font-semibold text-blue-700">
                    R$ {Number(p.preco_venda || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => adicionarProduto(p)}
                className="mt-auto bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition"
              >
                ➕ Adicionar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 🧾 Tabela da venda */}
      <div className="overflow-x-auto mt-6">
        <table className="w-full border-collapse border text-sm shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gradient-to-r from-blue-600 to-blue-400 text-white">
            <tr>
              <th className="p-2">Código</th>
              <th className="p-2 text-left">Descrição</th>
              <th className="p-2">Qtde</th>
              <th className="p-2">% Desc</th>
              <th className="p-2">Pr. Custo</th>
              <th className="p-2">Pr. Venda</th>
              <th className="p-2">Pr. Desc</th>
              <th className="p-2">Total</th>
              <th className="p-2">🗑️</th>
            </tr>
          </thead>
          <tbody>
            {venda.map((p, idx) => (
              <tr
                key={p.id}
                className={`text-center ${
                  idx % 2 === 0 ? "bg-white" : "bg-blue-50"
                } hover:bg-blue-100 transition`}
              >
                <td className="p-2">{p.id.slice(0, 6)}...</td>
                <td className="p-2 text-left">{p.nome}</td>
                <td className="p-2">
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() => alterarQtd(p.id, -1)}
                      className="bg-gray-200 hover:bg-gray-300 px-2 rounded text-sm"
                    >
                      ➖
                    </button>
                    <span className="w-6 text-center">{p.qtd}</span>
                    <button
                      onClick={() => alterarQtd(p.id, 1)}
                      className="bg-gray-200 hover:bg-gray-300 px-2 rounded text-sm"
                    >
                      ➕
                    </button>
                  </div>
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={p.desconto}
                    onChange={(e) =>
                      alterarDesconto(p.id, Number(e.target.value))
                    }
                    className="w-16 border rounded text-center focus:outline-blue-500"
                  />
                </td>
                <td className="p-2 text-gray-600">
                  R$ {Number(p.preco_custo || 0).toFixed(2)}
                </td>
                <td className="p-2 text-blue-800 font-semibold">
                  R$ {Number(p.preco_venda || 0).toFixed(2)}
                </td>
                <td className="p-2 text-green-700 font-semibold">
                  R${" "}
                  {(
                    p.preco_venda - p.preco_venda * (p.desconto / 100)
                  ).toFixed(2)}
                </td>
                <td className="p-2 font-bold text-green-700">
                  R${" "}
                  {(
                    p.qtd *
                    (p.preco_venda - p.preco_venda * (p.desconto / 100))
                  ).toFixed(2)}
                </td>
                <td className="p-2">
                  <button
                    onClick={() =>
                      setVenda((prev) =>
                        prev.filter((item) => item.id !== p.id)
                      )
                    }
                    className="text-red-500 hover:text-red-700 text-lg"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 💰 Total */}
      {venda.length > 0 && (
        <div className="flex justify-between items-center mt-4 border-t pt-4">
          <div className="text-gray-600 text-sm">
            Total de itens: {venda.reduce((acc, p) => acc + p.qtd, 0)}
          </div>
          <div className="text-2xl font-bold text-blue-700">
            Total: R$ {total.toFixed(2)}
          </div>
        </div>
      )}

      {/* 📱 Botões fixos no mobile */}
      {venda.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around p-2 sm:hidden z-50">
          <button
            onClick={() => inputRef.current?.focus()}
            className="bg-blue-600 text-white px-3 py-2 rounded text-sm"
          >
            🔍 Buscar
          </button>
          <button
            onClick={limparVenda}
            className="bg-red-600 text-white px-3 py-2 rounded text-sm"
          >
            ❌ Limpar
          </button>
          <button
            onClick={imprimirCupom}
            className="bg-gray-600 text-white px-3 py-2 rounded text-sm"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={() => setShowPagamento(true)}
            className="bg-green-600 text-white px-3 py-2 rounded text-sm"
          >
            💰 Finalizar
          </button>
        </div>
      )}

      {/* === MODAL DE FINALIZAÇÃO === */}
{showPagamento && (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
    role="dialog"
    aria-modal="true"
    onKeyDown={(e) => e.key === "Escape" && setShowPagamento(false)}
  >
    <div className="bg-white w-[95%] sm:w-[420px] max-w-full rounded-xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto animate-fadeIn relative">
      <h2 className="text-2xl font-bold text-blue-700 text-center mb-5">
        🧾 Finalizar Venda
      </h2>

      {/* Tipo de Venda */}
      <div className="mb-4">
        <label className="block font-semibold mb-2 text-gray-700">
          Tipo de Venda:
        </label>
        <div className="flex justify-between gap-2">
          {["Balcão", "Entrega", "Externo"].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setPagamento((prev: any) => ({ ...prev, tipo }))}
              className={`flex-1 py-2 rounded-md border ${
                pagamento.tipo === tipo
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>
      </div>

      {/* Dados do cliente se for entrega */}
      {pagamento.tipo === "Entrega" && (
        <div className="space-y-3 mb-4">
          <input
            type="text"
            placeholder="Nome do Cliente"
            value={pagamento.nome || ""}
            onChange={(e) =>
              setPagamento((prev: any) => ({ ...prev, nome: e.target.value }))
            }
            className="w-full border rounded p-2 focus:outline-blue-500"
          />
          <input
            type="text"
            placeholder="Telefone"
            value={pagamento.telefone || ""}
            onChange={(e) =>
              setPagamento((prev: any) => ({ ...prev, telefone: e.target.value }))
            }
            className="w-full border rounded p-2 focus:outline-blue-500"
          />
          <input
            type="text"
            placeholder="Endereço de Entrega"
            value={pagamento.endereco || ""}
            onChange={(e) =>
              setPagamento((prev: any) => ({ ...prev, endereco: e.target.value }))
            }
            className="w-full border rounded p-2 focus:outline-blue-500"
          />
        </div>
      )}

      {/* Forma de Pagamento */}
      <div className="mb-4">
        <label className="block font-semibold mb-2 text-gray-700">
          Forma de Pagamento:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {["Pix", "Cartão", "Dinheiro", "Misto"].map((tipo) => (
            <button
              key={tipo}
              onClick={() =>
                setPagamento((prev: any) => ({ ...prev, forma: tipo }))
              }
              className={`py-2 rounded-md border ${
                pagamento.forma === tipo
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>
      </div>

      {/* PIX */}
      {pagamento.forma === "Pix" && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-center">
          <p className="text-blue-700 font-semibold mb-1">💳 Pagamento via Pix</p>
          <p className="text-gray-700 text-sm">CNPJ: 62.157.257/0001-09</p>
        </div>
      )}

      {/* Dinheiro */}
      {pagamento.forma === "Dinheiro" && (
        <div className="mb-4">
          <label className="block text-sm mb-1 text-gray-600">
            Valor Recebido (R$)
          </label>
          <input
            type="number"
            value={pagamento.dinheiro}
            onChange={(e) => calcularTroco(e.target.value)}
            className="w-full border rounded p-2 text-right focus:outline-blue-500"
          />
          <p className="text-sm mt-2 text-gray-700">
            Troco: <span className="font-bold text-green-600">R$ {pagamento.troco}</span>
          </p>
        </div>
      )}

      {/* Total */}
      <div className="border-t mt-4 pt-3 text-center">
        <p className="text-gray-600">Total da Venda</p>
        <p className="text-3xl font-bold text-blue-700">R$ {total.toFixed(2)}</p>
      </div>

      {/* Botões finais */}
      <div className="flex flex-col gap-2 mt-6">
        <button
          onClick={() => {
            const mensagem = encodeURIComponent(`
💊 Novo Pedido — Drogaria Rede Fabiano

🧾 Tipo: ${pagamento.tipo || "Balcão"}
👤 Cliente: ${pagamento.nome || "Não informado"}
📞 Telefone: ${pagamento.telefone || "Não informado"}
🏠 Endereço: ${pagamento.endereco || "Não informado"}

📦 Produtos:
${venda
  .map(
    (p) =>
      `• ${p.nome} — ${p.qtd}x R$ ${p.preco_venda?.toFixed(
        2
      )} (${p.desconto}% desc)`
  )
  .join("\n")}

💰 Total: R$ ${total.toFixed(2)}
💳 Pagamento: ${pagamento.forma || "Não informado"}
${pagamento.forma === "Pix" ? "🔢 CNPJ: 62.157.257/0001-09" : ""}
            `);
            const numero = "5511948343725";
            window.open(`https://wa.me/${numero}?text=${mensagem}, "_blank"`);
          }}
          className="bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition"
        >
          📲 Enviar WhatsApp da Loja
        </button>

        <button
          onClick={() => {
            imprimirCupom();
          }}
          className="bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition"
        >
          🖨️ Imprimir Cupom
        </button>

        <button
          onClick={finalizarVenda}
          className="bg-blue-800 text-white py-2 rounded-md font-semibold hover:bg-blue-900 transition"
        >
          ✅ Confirmar Venda
        </button>

        <button
          onClick={() => setShowPagamento(false)}
          className="bg-gray-400 text-white py-2 rounded-md hover:bg-gray-500"
        >
          ↩️ Voltar
        </button>
      </div>

      {/* X Fechar no canto */}
      <button
        onClick={() => setShowPagamento(false)}
        className="absolute top-2 right-3 text-xl text-gray-400 hover:text-gray-600"
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  </div>
)}
    </main>
  );
}