"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { jsPDF } from "jspdf";

// 🔌 Conexão com o Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 🧩 Tipagens
type Produto = {
  id: string;
  nome: string;
  preco_venda: number;
  categoria?: string;
  imagem?: string;
  loja?: string;
  estoque?: number;
};

export default function PDVRedeFabiano() {
  const LOJA = "drogariaredefabiano";

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<Produto[]>([]);

  // 🔹 Carregar produtos direto do Supabase
  useEffect(() => {
    async function carregarProdutos() {
      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome, preco_venda, categoria, imagem, loja, estoque")
        .eq("loja", LOJA)
        .eq("disponivel", true)
        .gt("estoque", 0)
        .order("nome", { ascending: true });

      if (error) {
        console.error("Erro ao carregar produtos:", error);
      } else {
        setProdutos(data || []);
      }
    }

    carregarProdutos();
  }, []);

  // 🔹 Adicionar produto ao carrinho
  function adicionar(produto: Produto) {
    setCarrinho((prev) => [...prev, produto]);
  }

  // 🔹 Remover produto
  function remover(id: string) {
    setCarrinho((prev) => prev.filter((p) => p.id !== id));
  }

  // 🔹 Calcular total
  const total = carrinho.reduce((acc, p) => acc + Number(p.preco_venda), 0);

  // 🧾 Gerar e imprimir cupom
  function imprimirCupom() {
    const doc = new jsPDF();
    let y = 20;

    // Cabeçalho
    doc.setFontSize(14);
    doc.text("Drogaria Rede Fabiano", 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text("CNPJ: 62.157.257/0001-09", 20, y);
    y += 6;
    doc.text("Endereço: Rua Exemplo, 123 - São Paulo/SP", 20, y);
    y += 10;

    // Linha divisória
    doc.line(20, y, 190, y);
    y += 10;

    // Itens do carrinho
    doc.setFontSize(12);
    doc.text("Itens:", 20, y);
    y += 8;
    doc.setFontSize(10);
    carrinho.forEach((p) => {
      doc.text(`${p.nome} - R$ ${p.preco_venda.toFixed(2).replace(".", ",")}`, 20, y);
      y += 6;
    });

    // Total
    y += 4;
    doc.line(20, y, 190, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Total: R$ {total.toFixed(2).replace(".", ",")}`, 20, y);
    y += 10;

    // Rodapé
    doc.setFontSize(10);
    doc.text("Obrigado pela preferência!", 20, y);
    y += 5;
    doc.text("IA Drogarias - Saúde com Inteligência 💙", 20, y);

    // Abre o PDF na tela para impressão
    doc.autoPrint();
    doc.output("dataurlnewwindow");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">💙 PDV - Drogaria Rede Fabiano</h1>
        <div className="bg-white text-gray-700 px-3 py-1 rounded-lg">
          Total: <b>R$ {total.toFixed(2).replace(".", ",")}</b>
        </div>
      </header>

      {/* Campo de busca */}
      <div className="p-4 flex justify-center">
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full max-w-md"
        />
      </div>

      {/* Lista de produtos */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-4 pb-20">
        {produtos
          .filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
          .map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-lg shadow p-3 flex flex-col items-center"
            >
              <Image
                src={
                  p.imagem
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public${p.imagem}`
                    : "/produtos/caixa-padrao.png"
                }
                alt={p.nome}
                width={100}
                height={100}
                className="object-contain"
              />
              <h2 className="text-sm font-semibold text-center mt-2">{p.nome}</h2>
              <p className="text-green-600 font-bold mt-1">
                R$ {p.preco_venda.toFixed(2).replace(".", ",")}
              </p>
              <button
                onClick={() => adicionar(p)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded mt-2"
              >
                Adicionar
              </button>
            </div>
          ))}
      </section>

      {/* Carrinho fixo */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 p-3">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-700">
                {carrinho.length} item{carrinho.length > 1 ? "s" : ""} no carrinho
              </p>
              <p className="text-sm text-gray-500">
                Total: R$ {total.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <button
              onClick={imprimirCupom}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-semibold"
            >
              Finalizar Venda e Imprimir Cupom
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
