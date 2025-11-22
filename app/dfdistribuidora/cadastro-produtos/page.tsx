"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CadastroProdutos() {
  const [aba, setAba] = useState("cadastro");

  const [produto, setProduto] = useState({
    codigo: "",
    barras: "",
    descricao: "",
    fabricante: "",
    marca: "",
    grupo: "",
    subgrupo: "",
    unidade: "",
    preco_fabrica: "",
    preco_min: "",
    preco_max: "",
    custo: "",
    custo_real: "",
    custo_medio: "",
    markup: "",
    preco_venda: "",
    estoque_min: "",
    estoque_max: "",
    saldo: "",
    pmc: "",
    pmvg: "",
    ncm: "",
    cest: "",
    cfop: "",
    icms: "",
  });

  // Atalhos teclado
  useEffect(() => {
    function keys(e: KeyboardEvent) {
      if (e.key === "Escape") window.history.back();
      if (e.key === "Enter") salvar();
      if (e.key === "Delete") apagar();
      if (e.key === "Insert") novo();
    }
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  });

  function atualizar(campo: string, valor: string) {
    setProduto({ ...produto, [campo]: valor });
  }

  async function salvar() {
    await supabase.from("df_produtos").insert([produto]);
    alert("Produto salvo com sucesso!");
  }

  function apagar() {
    setProduto({
      codigo: "",
      barras: "",
      descricao: "",
      fabricante: "",
      marca: "",
      grupo: "",
      subgrupo: "",
      unidade: "",
      preco_fabrica: "",
      preco_min: "",
      preco_max: "",
      custo: "",
      custo_real: "",
      custo_medio: "",
      markup: "",
      preco_venda: "",
      estoque_min: "",
      estoque_max: "",
      saldo: "",
      pmc: "",
      pmvg: "",
      ncm: "",
      cest: "",
      cfop: "",
      icms: "",
    });
  }

  function novo() {
    apagar();
  }

  return (
    <div className="p-5">
      {/* CABEÇALHO */}
      <div className="sys-header flex justify-between items-center">
        <span className="text-lg">Cadastro de Produtos — DF Distribuidora</span>
        <img src="/dfdistribuidora/logo.png" className="h-10" />
      </div>

      {/* ABAS */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => setAba("cadastro")}
          className={`px-4 py-2 ${
            aba === "cadastro" ? "bg-blue-700 text-white" : "bg-gray-200"
          }`}
        >
          Cadastro Principal
        </button>

        <button
          onClick={() => setAba("outras")}
          className={`px-4 py-2 ${
            aba === "outras" ? "bg-blue-700 text-white" : "bg-gray-200"
          }`}
        >
          Outras Informações
        </button>

        <button
          onClick={() => setAba("tributos")}
          className={`px-4 py-2 ${
            aba === "tributos" ? "bg-blue-700 text-white" : "bg-gray-200"
          }`}
        >
          Tributação
        </button>

        <button
          onClick={() => setAba("web")}
          className={`px-4 py-2 ${
            aba === "web" ? "bg-blue-700 text-white" : "bg-gray-200"
          }`}
        >
          Informações Web
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="sys-box mt-3">

        {/* ============================
             ABA 1 — CADASTRO PRINCIPAL
        ============================= */}
        {aba === "cadastro" && (
          <div className="grid grid-cols-4 gap-3">
            <div>
              Código Interno
              <input className="sys-input" value={produto.codigo}
                onChange={(e) => atualizar("codigo", e.target.value)} />
            </div>

            <div>
              Código de Barras
              <input className="sys-input" value={produto.barras}
                onChange={(e) => atualizar("barras", e.target.value)} />
            </div>

            <div className="col-span-2">
              Descrição do Produto
              <input className="sys-input" value={produto.descricao}
                onChange={(e) => atualizar("descricao", e.target.value)} />
            </div>

            <div>
              Fabricante
              <input className="sys-input" value={produto.fabricante}
                onChange={(e) => atualizar("fabricante", e.target.value)} />
            </div>

            <div>
              Marca
              <input className="sys-input" value={produto.marca}
                onChange={(e) => atualizar("marca", e.target.value)} />
            </div>

            <div>
              Grupo
              <input className="sys-input" value={produto.grupo}
                onChange={(e) => atualizar("grupo", e.target.value)} />
            </div>

            <div>
              Subgrupo
              <input className="sys-input" value={produto.subgrupo}
                onChange={(e) => atualizar("subgrupo", e.target.value)} />
            </div>

            <div>
              Unidade
              <input className="sys-input" value={produto.unidade}
                onChange={(e) => atualizar("unidade", e.target.value)} />
            </div>

            {/* PREÇOS */}
            <div>
              Preço Fábrica
              <input className="sys-input" value={produto.preco_fabrica}
                onChange={(e) => atualizar("preco_fabrica", e.target.value)} />
            </div>

            <div>
              Preço Mínimo
              <input className="sys-input" value={produto.preco_min}
                onChange={(e) => atualizar("preco_min", e.target.value)} />
            </div>

            <div>
              Preço Máximo
              <input className="sys-input" value={produto.preco_max}
                onChange={(e) => atualizar("preco_max", e.target.value)} />
            </div>

            <div>
              Custo
              <input className="sys-input" value={produto.custo}
                onChange={(e) => atualizar("custo", e.target.value)} />
            </div>

            <div>
              Custo Real
              <input className="sys-input" value={produto.custo_real}
                onChange={(e) => atualizar("custo_real", e.target.value)} />
            </div>

            <div>
              Custo Médio
              <input className="sys-input" value={produto.custo_medio}
                onChange={(e) => atualizar("custo_medio", e.target.value)} />
            </div>

            <div>
              Markup (%)
              <input className="sys-input" value={produto.markup}
                onChange={(e) => atualizar("markup", e.target.value)} />
            </div>

            <div>
              Preço de Venda
              <input className="sys-input" value={produto.preco_venda}
                onChange={(e) => atualizar("preco_venda", e.target.value)} />
            </div>

          </div>
        )}

        {/* ============================
             ABA 2 — OUTRAS INFORMAÇÕES
        ============================= */}
        {aba === "outras" && (
          <div className="grid grid-cols-4 gap-3">
            <div>
              PMC
              <input className="sys-input" value={produto.pmc}
                onChange={(e) => atualizar("pmc", e.target.value)} />
            </div>

            <div>
              PMVG
              <input className="sys-input" value={produto.pmvg}
                onChange={(e) => atualizar("pmvg", e.target.value)} />
            </div>

            <div>
              Estoque Mínimo
              <input className="sys-input" value={produto.estoque_min}
                onChange={(e) => atualizar("estoque_min", e.target.value)} />
            </div>

            <div>
              Estoque Máximo
              <input className="sys-input" value={produto.estoque_max}
                onChange={(e) => atualizar("estoque_max", e.target.value)} />
            </div>

            <div>
              Saldo Atual
              <input className="sys-input" value={produto.saldo}
                readOnly />
            </div>
          </div>
        )}

        {/* ============================
             ABA 3 — TRIBUTAÇÃO
        ============================= */}
        {aba === "tributos" && (
          <div className="grid grid-cols-4 gap-3">
            <div>
              NCM
              <input className="sys-input" value={produto.ncm}
                onChange={(e) => atualizar("ncm", e.target.value)} />
            </div>

            <div>
              CEST
              <input className="sys-input" value={produto.cest}
                onChange={(e) => atualizar("cest", e.target.value)} />
            </div>

            <div>
              CFOP
              <input className="sys-input" value={produto.cfop}
                onChange={(e) => atualizar("cfop", e.target.value)} />
            </div>

            <div>
              ICMS (%)
              <input className="sys-input" value={produto.icms}
                onChange={(e) => atualizar("icms", e.target.value)} />
            </div>
          </div>
        )}

        {/* ============================
             ABA 4 — INFORMAÇÕES WEB
        ============================= */}
        {aba === "web" && (
          <div>
            <textarea
              className="sys-input h-32"
              placeholder="Descrição web, SEO, benefícios, informações adicionais..."
            />
          </div>
        )}
      </div>

      {/* BOTÕES */}
      <div className="flex gap-3 mt-4">
        <button className="sys-btn bg-green-600" onClick={salvar}>💾 Gravar</button>
        <button className="sys-btn bg-red-600" onClick={apagar}>🗑 Apagar</button>
        <button className="sys-btn bg-gray-500" onClick={() => window.history.back()}>❌ Cancelar</button>
      </div>

      {/* RODAPÉ DE ATALHOS */}
      <div className="mt-4 text-center text-gray-600">
        <b>Atalhos:</b> Insert = Novo | Enter = Salvar | Delete = Apagar | Esc = Sair
      </div>
    </div>
  );
}
