"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function EntradasDF() {
  const [nota, setNota] = useState("");
  const [serie, setSerie] = useState("01");
  const [fornecedor, setFornecedor] = useState("");
  const [dataNF, setDataNF] = useState("");
  const [frete, setFrete] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [itens, setItens] = useState<any[]>([]);

  const [produtoAtual, setProdutoAtual] = useState({
    codigo: "",
    descricao: "",
    qtde: "",
    custo: "",
    desconto: "",
    prdesc: "",
    markup: "",
    venda: "",
  });

  // -----------------------------
  // 🔍 BUSCAR PRODUTO NO BANCO
  // -----------------------------
  async function buscarProduto(codigo: string) {
    if (!codigo) return;

    const { data } = await supabase
      .from("df_produtos")
      .select("*")
      .eq("codigo", codigo)
      .single();

    if (!data) {
      setMensagem("❌ Produto não encontrado — pressione INSERT para cadastrar.");
      return null;
    }

    setMensagem("");

    setProdutoAtual({
      ...produtoAtual,
      codigo: data.codigo,
      descricao: data.descricao,
      custo: data.custo ?? "",
      venda: data.preco_venda ?? "",
      qtde: "",
      desconto: "",
    });

    return data;
  }

  // -----------------------------
  // ⌨ ATALHOS DO TECLADO
  // -----------------------------
  useEffect(() => {
    function handleKeys(e: KeyboardEvent) {
      if (e.key === "Insert") {
        window.location.href = "/dfdistribuidora/cadastro-produtos";
      }

      if (e.key === "Delete") removerUltimo();

      if (e.key === "Enter") adicionarItem();
    }

    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  });

  // Quando digitar código e apertar ENTER → buscar produto
  async function handleCodigoEnter(e: any) {
    if (e.key === "Enter") {
      const ok = await buscarProduto(produtoAtual.codigo);
      if (!ok) return; // se não existir bloqueia
      document.getElementById("campoQtde")?.focus();
    }
  }

  // -----------------------------
  // ➕ ADICIONAR ITEM
  // -----------------------------
  function adicionarItem() {
    if (!produtoAtual.descricao) {
      setMensagem("❌ Não é possível adicionar sem produto cadastrado.");
      return;
    }

    if (!produtoAtual.qtde || Number(produtoAtual.qtde) <= 0) {
      setMensagem("⚠ Informe a quantidade.");
      return;
    }

    setMensagem("");

    setItens([...itens, produtoAtual]);

    setProdutoAtual({
      codigo: "",
      descricao: "",
      qtde: "",
      custo: "",
      desconto: "",
      prdesc: "",
      markup: "",
      venda: "",
    });

    document.getElementById("campoCodigo")?.focus();
  }

  // -----------------------------
  // ❌ REMOVER ÚLTIMO
  // -----------------------------
  function removerUltimo() {
    setItens((prev) => prev.slice(0, -1));
  }

  // -----------------------------
  // 💰 TOTAL
  // -----------------------------
  const total = itens.reduce((soma, item) => {
    const preco = Number(item.venda || 0) * Number(item.qtde || 1);
    return soma + preco;
  }, 0);

  // -----------------------------
  // 🎨 INTERFACE
  // -----------------------------
  return (
    <div className="p-3">
      <div className="sys-header text-xl">Entrada de Mercadorias — DF Distribuidora</div>

      {mensagem && (
        <div className="bg-red-200 text-red-800 p-2 rounded mb-2 text-center font-bold">
          {mensagem}
        </div>
      )}

      {/* Cabeçalho */}
      <div className="grid grid-cols-4 gap-3 sys-box">
        <div>
          Nº Nota
          <input className="sys-input" value={nota} onChange={(e) => setNota(e.target.value)} />
        </div>

        <div>
          Série
          <input className="sys-input" value={serie} onChange={(e) => setSerie(e.target.value)} />
        </div>

        <div>
          Fornecedor
          <input className="sys-input" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} />
        </div>

        <div>
          Data NF
          <input type="date" className="sys-input" value={dataNF} onChange={(e) => setDataNF(e.target.value)} />
        </div>

        <div>
          Frete
          <input className="sys-input" value={frete} onChange={(e) => setFrete(e.target.value)} />
        </div>
      </div>

      {/* Linha rápida */}
      <div className="sys-box">
        <div className="grid grid-cols-7 gap-2">

          {/* CÓDIGO */}
          <input
            id="campoCodigo"
            className="sys-input"
            placeholder="Código"
            value={produtoAtual.codigo}
            onKeyDown={handleCodigoEnter}
            onChange={(e) => setProdutoAtual({ ...produtoAtual, codigo: e.target.value })}
          />

          {/* DESCRIÇÃO */}
          <input
            className="sys-input"
            placeholder="Descrição"
            disabled
            value={produtoAtual.descricao}
          />

          {/* QTDE */}
          <input
            id="campoQtde"
            className="sys-input"
            placeholder="Qtde"
            value={produtoAtual.qtde}
            onChange={(e) => setProdutoAtual({ ...produtoAtual, qtde: e.target.value })}
          />

          {/* CUSTO */}
          <input
            className="sys-input"
            placeholder="Custo"
            value={produtoAtual.custo}
            onChange={(e) => setProdutoAtual({ ...produtoAtual, custo: e.target.value })}
          />

          {/* DESCONTO */}
          <input
            className="sys-input"
            placeholder="% Desc"
            value={produtoAtual.desconto}
            onChange={(e) => setProdutoAtual({ ...produtoAtual, desconto: e.target.value })}
          />

          {/* VENDA */}
          <input
            className="sys-input"
            placeholder="Venda"
            value={produtoAtual.venda}
            onChange={(e) => setProdutoAtual({ ...produtoAtual, venda: e.target.value })}
          />

          <button className="sys-btn" onClick={adicionarItem}>Adicionar</button>
        </div>
      </div>

      {/* Tabela */}
      <table className="sys-grid">
        <thead>
          <tr>
            <th>Código</th>
            <th>Descrição</th>
            <th>Qtde</th>
            <th>Custo</th>
            <th>% Desc</th>
            <th>Venda</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {itens.map((item, i) => (
            <tr key={i}>
              <td>{item.codigo}</td>
              <td>{item.descricao}</td>
              <td>{item.qtde}</td>
              <td>{item.custo}</td>
              <td>{item.desconto}</td>
              <td>{item.venda}</td>
              <td>{(Number(item.venda) * Number(item.qtde)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTAL */}
      <div className="text-right text-4xl font-bold mt-4 text-blue-700">
        Total: R$ {total.toFixed(2)}
      </div>

      {/* Botão flutuante */}
      <Link
        href="/dfdistribuidora/entradas/nova"
        className="fixed bottom-4 right-4 bg-blue-700 text-white px-6 py-3 rounded-full text-lg shadow-xl"
      >
        + Nova Entrada
      </Link>
    </div>
  );
}
