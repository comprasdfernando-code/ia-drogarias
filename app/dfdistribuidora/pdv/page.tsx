"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function PDVDF() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [abrirCarrinho, setAbrirCarrinho] = useState(false);

  // 🔵 Simulação dos produtos
  useEffect(() => {
    setProdutos([
      { id: 1, nome: "Dipirona 1g", preco: 3.99 },
      { id: 2, nome: "Ibuprofeno 400mg", preco: 6.50 },
      { id: 3, nome: "Omeprazol 20mg", preco: 5.20 },
      { id: 4, nome: "Amoxicilina 500mg", preco: 12.99 },
    ]);
  }, []);

  const adicionar = (produto: any) => {
    const existe = carrinho.find((p) => p.id === produto.id);

    if (existe) {
      setCarrinho(
        carrinho.map((p) =>
          p.id === produto.id ? { ...p, qtd: p.qtd + 1 } : p
        )
      );
    } else {
      setCarrinho([...carrinho, { ...produto, qtd: 1 }]);
    }
  };

  const diminuir = (produto: any) => {
    const item = carrinho.find((p) => p.id === produto.id);
    if (!item) return;

    if (item.qtd === 1) {
      setCarrinho(carrinho.filter((p) => p.id !== produto.id));
    } else {
      setCarrinho(
        carrinho.map((p) =>
          p.id === produto.id ? { ...p, qtd: p.qtd - 1 } : p
        )
      );
    }
  };

  const totalCarrinho = carrinho
    .reduce((acc, item) => acc + item.preco * item.qtd, 0)
    .toFixed(2);

  const enviarWhatsApp = () => {
    let msg = "Pedido DF Distribuidora:\n\n";
    carrinho.forEach((item) => {
      msg += `• ${item.nome} — ${item.qtd} un — R$ ${(item.preco * item.qtd).toFixed(2)}\n`;
    });

    msg += `\nTotal: R$ ${totalCarrinho}`;

    window.open(
      `https://wa.me/5511952068432?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  return (
    <div className="p-4 pb-24">

      {/* LOGO */}
      <div className="flex justify-center mb-4">
        <Image
          src="/df-distribuidora-logo.png"
          alt="Logo DF Distribuidora"
          width={130}
          height={130}
        />
      </div>

      {/* TÍTULO */}
      <h1 className="text-2xl font-bold text-center mb-4">
        PDV — DF Distribuidora
      </h1>

      {/* CAMPO DE BUSCA */}
      <input
        type="text"
        placeholder="Digite o nome do produto…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full p-3 border rounded mb-6 shadow-sm"
      />

      {/* LISTA DE PRODUTOS */}
      <div className="grid gap-3">
        {produtos
          .filter((p) =>
            p.nome.toLowerCase().includes(busca.toLowerCase())
          )
          .map((produto) => (
            <div
              key={produto.id}
              className="p-3 bg-white shadow-md rounded border flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-lg">{produto.nome}</p>
                <p className="text-blue-600 font-bold">
                  R$ {produto.preco.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => diminuir(produto)}
                  className="px-3 py-1 bg-gray-300 rounded"
                >
                  -
                </button>

                <span className="font-bold">
                  {carrinho.find((p) => p.id === produto.id)?.qtd || 0}
                </span>

                <button
                  onClick={() => adicionar(produto)}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  +
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* BOTÃO FLUTUANTE */}
      <button
        onClick={() => setAbrirCarrinho(true)}
        className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-full shadow-lg text-lg font-semibold hover:bg-green-700 transition"
      >
        🛒 Carrinho ({carrinho.length})
      </button>

      {/* CARRINHO LATERAL */}
      {abrirCarrinho && (
        <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl p-4 border-l z-50">
          <h2 className="text-xl font-bold mb-4">Carrinho</h2>

          {carrinho.length === 0 ? (
            <p className="text-gray-600">Seu carrinho está vazio.</p>
          ) : (
            carrinho.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center mb-3"
              >
                <p className="font-semibold">{item.nome}</p>
                <p>
                  {item.qtd} un · R$ {(item.preco * item.qtd).toFixed(2)}
                </p>
              </div>
            ))
          )}

          <hr className="my-4" />

          <p className="text-lg font-bold mb-4">
            Total: R$ {totalCarrinho}
          </p>

          <button
            onClick={enviarWhatsApp}
            className="w-full bg-green-600 text-white py-3 rounded mb-3"
          >
            Enviar para WhatsApp
          </button>

          <button
            onClick={() => setAbrirCarrinho(false)}
            className="w-full bg-gray-300 py-2 rounded"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
