"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import ModalFinalizar from "../../../components/ModalFinalizar";

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Constantes da loja
const LOJA = "Drogaria Rede Fabiano";
const WHATSAPP = "5511948343725";
const PIX_CHAVE = "CNPJ 62157257000109";

export default function DrogariaRedeFabianoPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [total, setTotal] = useState(0);

  // Carrega produtos
  useEffect(() => {
    async function carregarProdutos() {
      const { data, error } = await supabase.from("produtos").select("*");
      if (error) console.error("Erro ao carregar produtos:", error);
      else setProdutos(data || []);
    }
    carregarProdutos();
  }, []);

  // Atualiza total do carrinho
  useEffect(() => {
    const novoTotal = carrinho.reduce(
      (acc, item) => acc + item.preco_venda * item.quantidade,
      0
    );
    setTotal(novoTotal);
  }, [carrinho]);

  // Adiciona item no carrinho
  function adicionarItem(produto: any) {
    setCarrinho((prev) => {
      const existente = prev.find((p) => p.id === produto.id);
      if (existente) {
        return prev.map((p) =>
          p.id === produto.id
            ? { ...p, quantidade: p.quantidade + 1 }
            : p
        );
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
  }

  // Função de finalizar pedido
  const finalizarPedido = async (cliente: any, pagamento: any) => {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }

    if (!cliente?.nome || !cliente?.telefone || !cliente?.endereco) {
      alert("Preencha os dados de entrega.");
      return;
    }

    const payload = {
      itens: carrinho,
      total,
      cliente,
      pagamento,
      status: "pendente",
    };

    const { data, error } = await supabase
      .from("pedidos")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar o pedido.");
      return;
    }

    // Envia pro WhatsApp
    const texto = `
🧾 Novo Pedido - ${LOJA}
👤 Cliente: ${cliente.nome}
📞 Telefone: ${cliente.telefone}
🏠 Endereço: ${cliente.endereco}
💰 Total: R$ ${total.toFixed(2)}
💳 Pagamento: ${pagamento.metodo || pagamento}
`.trim();

    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");

    setCarrinho([]);
    setModalAberto(false);
    alert("Pedido enviado com sucesso!");
  };

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      {/* Faixa superior */}
      <section className="w-full bg-blue-700 text-white text-center py-3 text-3xl font-bold">
        {LOJA}
      </section>

      {/* Banner principal */}
      <section className="relative w-full">
        <img
          src="/banners/banner-rede-fabiano-faixa.jpg"
          alt="Drogaria Rede Fabiano"
          className="w-full h-36 md:h-56 object-cover"
        />
      </section>

      {/* Campo de busca */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Listagem de produtos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto px-4">
        {produtos
          .filter((p) =>
            p.nome.toLowerCase().includes(busca.toLowerCase())
          )
          .map((p) => (
            <div key={p.id} className="bg-white p-3 border rounded shadow-sm">
              <h3 className="font-semibold text-sm mb-1">{p.nome}</h3>
              <p className="text-green-700 font-bold">
                R$ {p.preco_venda.toFixed(2)}
              </p>
              <button
                onClick={() => adicionarItem(p)}
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded py-1"
              >
                Adicionar
              </button>
            </div>
          ))}
      </div>

      {/* Botão finalizar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-3 flex justify-between items-center">
        <span className="font-semibold">Total: R$ {total.toFixed(2)}</span>
        <button
          onClick={() => setModalAberto(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Finalizar Pedido
        </button>
      </div>

      {/* Modal Finalizar Pedido */}
      {modalAberto && (
        <ModalFinalizar
          loja={LOJA}
          whatsapp={WHATSAPP}
          pixChave={PIX_CHAVE}
          total={total}
          carrinho={carrinho}
          onConfirm={(cliente, pagamento) => {
            finalizarPedido(cliente, pagamento);
          }}
          onClose={() => setModalAberto(false)}
        />
      )}
    </main>
  );
}