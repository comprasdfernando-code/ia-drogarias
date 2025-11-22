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

  // Atalhos
  useEffect(() => {
    function handleKeys(e: KeyboardEvent) {
      if (e.key === "Insert") window.location.href = "/dfdistribuidora/cadastro-produtos";
      if (e.key === "Delete") removerUltimo();
      if (e.key === "Enter") adicionarItem();
    }
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  });

  function adicionarItem() {
    if (!produtoAtual.descricao) return;
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
  }

  function removerUltimo() {
    setItens((prev) => prev.slice(0, -1));
  }

  const total = itens.reduce((soma, item) => {
    const preco = Number(item.venda || 0) * Number(item.qtde || 1);
    return soma + preco;
  }, 0);

  return (
    <div className="p-3">
      <div className="sys-header text-xl">Entrada de Mercadorias — DF Distribuidora</div>

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
          <input
            className="sys-input"
            placeholder="Código"
            value={produtoAtual.codigo}
            onChange={(e) => setProdutoAtual({ ...produtoAtual, codigo: e.target.value })}
          />

          <input
            className="sys-input"
            placeholder="Descrição"
            value={produtoAtual.descricao}
            onChange={(e) => setProdutoAtual({ ...produtoAtual, descricao: e.target.value })}
          />

          <input
            className="sys-input"
            placeholder="Qtde"
            value={produtoAtual.qtde}
            onChange={(e) => setProdutoAtual({ ...produtoAtual, qtde: e.target.value })}
          />

          <input
            className="sys-input"
            placeholder="Custo"
            value={produtoAtual.custo}
            onChange={(e) => setProdutoAtual({ ...produtoAtual, custo: e.target.value })}
          />

          <input
            className="sys-input"
            placeholder="% Desc"
            value={produtoAtual.desconto}
            onChange={(e) => setProdutoAtual({ ...produtoAtual, desconto: e.target.value })}
          />

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
      <div className="text-right text-4xl font-bold mt-4 text-blue-700">Total: R$ {total.toFixed(2)}</div>

      {/* Botão flutuante para nova entrada */}
      <Link
        href="/dfdistribuidora/entradas/nova"
        className="fixed bottom-4 right-4 bg-blue-700 text-white px-6 py-3 rounded-full text-lg shadow-xl"
      >
        + Nova Entrada
      </Link>
    </div>
  );
}
