"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ProdutoPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [produto, setProduto] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [pedido, setPedido] = useState({
    tipo: "Entrega",
    nome: "",
    telefone: "",
    endereco: "",
    forma: "",
  });

  // 🔍 Buscar produto pelo slug
  useEffect(() => {
    async function fetchProduto() {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) console.error("Erro ao buscar produto:", error);
      else setProduto(data);
    }
    fetchProduto();
  }, [slug]);

  if (!produto)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Carregando produto...
      </div>
    );

  // 📲 Enviar pedido pelo WhatsApp
  function enviarWhatsApp() {
    const mensagem = encodeURIComponent(`
💊 Novo Pedido — Drogaria Rede Fabiano

🧾 Produto: ${produto.nome}
💰 Preço: R$ ${produto.preco_venda?.toFixed(2)}

🚚 Tipo: ${pedido.tipo}
👤 Cliente: ${pedido.nome || "Não informado"}
📞 Telefone: ${pedido.telefone || "Não informado"}
🏠 Endereço: ${pedido.tipo === "Entrega" ? pedido.endereco || "Não informado" : "Retirada na loja"}
💳 Pagamento: ${pedido.forma || "Não informado"}

🔹 Acesse: iafarma.vercel.app/drogarias/drogariaredefabiano
`);

    const numero = "5511948343725";
    window.open(`https://wa.me/${numero}?text=${mensagem}, "_blank"`);
    setShowModal(false);
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      {/* 🏷️ Produto */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <img
          src={produto.imagem || "/img/produto-generico.png"}
          alt={produto.nome}
          className="w-full h-60 object-contain mb-4"
        />
        <h1 className="text-2xl font-bold text-blue-700 mb-2">{produto.nome}</h1>
        <p className="text-gray-600 mb-4">{produto.descricao || "Sem descrição disponível."}</p>
        <p className="text-3xl font-bold text-green-600 mb-6">
          R$ {produto.preco_venda?.toFixed(2)}
        </p>

        {/* Botões principais */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 bg-green-600 text-white py-3 rounded-md font-semibold hover:bg-green-700 transition"
          >
            💚 Comprar Agora
          </button>
          <button
            onClick={() => router.push("/drogarias/drogariaredefabiano")}
            className="flex-1 bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition"
          >
            🛍️ Continuar Comprando
          </button>
        </div>
      </div>

      {/* === MODAL DE COMPRA === */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[400px] p-6">
            <h2 className="text-xl font-bold text-blue-700 mb-4 text-center">
              🧾 Finalizar Pedido
            </h2>

            {/* Tipo de venda */}
            <div className="mb-3">
              <label className="block font-semibold mb-2 text-gray-700">
                Tipo de Pedido:
              </label>
              <div className="flex justify-between gap-2">
                {["Entrega", "Retirada"].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setPedido((prev) => ({ ...prev, tipo }))}
                    className={`flex-1 py-2 rounded-md border ${
                      pedido.tipo === tipo
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* Dados do cliente */}
            <div className="space-y-2 mb-3">
              <input
                type="text"
                placeholder="Nome do Cliente"
                value={pedido.nome}
                onChange={(e) => setPedido({ ...pedido, nome: e.target.value })}
                className="w-full border rounded p-2 focus:outline-blue-500"
              />
              <input
                type="text"
                placeholder="Telefone"
                value={pedido.telefone}
                onChange={(e) => setPedido({ ...pedido, telefone: e.target.value })}
                className="w-full border rounded p-2 focus:outline-blue-500"
              />
              {pedido.tipo === "Entrega" && (
                <input
                  type="text"
                  placeholder="Endereço de Entrega"
                  value={pedido.endereco}
                  onChange={(e) => setPedido({ ...pedido, endereco: e.target.value })}
                  className="w-full border rounded p-2 focus:outline-blue-500"
                />
              )}
            </div>

            {/* Forma de pagamento */}
            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">
                Forma de Pagamento:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["Pix", "Cartão", "Dinheiro"].map((forma) => (
                  <button
                    key={forma}
                    onClick={() => setPedido((prev) => ({ ...prev, forma }))}
                    className={`py-2 rounded-md border ${
                      pedido.forma === forma
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {forma}
                  </button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="text-center border-t pt-3 mb-4">
              <p className="text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-700">
                R$ {produto.preco_venda?.toFixed(2)}
              </p>
            </div>

            {/* Botões finais */}
            <div className="flex flex-col gap-2">
              <button
                onClick={enviarWhatsApp}
                className="bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition"
              >
                📲 Enviar Pedido via WhatsApp
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-400 text-white py-2 rounded-md hover:bg-gray-500 transition"
              >
                ↩️ Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}