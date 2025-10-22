"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔌 Conexão com o Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    preco_venda: "",
    categoria: "",
    codigo_barras: "",
    imagem: "",
    estoque: "",
  });

  // 🔄 Carrega produtos existentes
  async function carregarProdutos() {
    setCarregando(true);
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .order("nome", { ascending: true });
    if (!error && data) setProdutos(data);
    setCarregando(false);
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  // 💾 Cadastrar novo produto
  async function salvarProduto(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.preco_venda) {
      alert("Preencha pelo menos o nome e o preço do produto!");
      return;
    }

    const { error } = await supabase.from("produtos").insert([
      {
        nome: form.nome.trim(),
        preco_venda: parseFloat(form.preco_venda),
        categoria: form.categoria.trim(),
        codigo_barras: form.codigo_barras.trim(),
        imagem: form.imagem.trim(),
        estoque: parseInt(form.estoque) || 0,
        loja: "drogariaredefabiano",
        disponivel: true,
      },
    ]);

    if (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto!");
    } else {
      alert("Produto salvo com sucesso!");
      setForm({
        nome: "",
        preco_venda: "",
        categoria: "",
        codigo_barras: "",
        imagem: "",
        estoque: "",
      });
      carregarProdutos();
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">
          🧾 Administração de Produtos — Drogaria Rede Fabiano
        </h1>

        {/* 🧩 Formulário de Cadastro */}
        <form
          onSubmit={salvarProduto}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-6 mb-6"
        >
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome do Produto
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="Ex: Dipirona Sódica 500mg"
            />
          </div>

          {/* Preço */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Preço de Venda
            </label>
            <input
              type="number"
              value={form.preco_venda}
              onChange={(e) => setForm({ ...form, preco_venda: e.target.value })}
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="Ex: 12.90"
              step="0.01"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Categoria
            </label>
            <input
              type="text"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="Ex: Genéricos"
            />
          </div>

          {/* Código de Barras */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Código de Barras (EAN)
            </label>
            <input
              type="text"
              value={form.codigo_barras}
              onChange={(e) =>
                setForm({
                  ...form,
                  codigo_barras: e.target.value.replace(/\D/g, "").slice(0, 14),
                })
              }
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="Ex: 7891234567890"
            />
            <p className="text-xs text-gray-500 mt-1">
              Digite ou use o leitor de código de barras.
            </p>
          </div>

          {/* Estoque */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estoque
            </label>
            <input
              type="number"
              value={form.estoque}
              onChange={(e) => setForm({ ...form, estoque: e.target.value })}
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="Ex: 50"
            />
          </div>

          {/* Imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              URL da Imagem
            </label>
            <input
              type="text"
              value={form.imagem}
              onChange={(e) => setForm({ ...form, imagem: e.target.value })}
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          {/* Botão de salvar */}
          <div className="col-span-full flex justify-end mt-3">
            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-md font-semibold shadow-sm"
            >
              Salvar Produto
            </button>
          </div>
        </form>

        {/* 📦 Lista de Produtos */}
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          Produtos Cadastrados
        </h2>

        {carregando ? (
          <p className="text-center text-gray-500">Carregando...</p>
        ) : produtos.length === 0 ? (
          <p className="text-center text-gray-400">Nenhum produto cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="border p-2">Nome</th>
                  <th className="border p-2">Preço</th>
                  <th className="border p-2">Categoria</th>
                  <th className="border p-2">Código</th>
                  <th className="border p-2">Estoque</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="border p-2">{p.nome}</td>
                    <td className="border p-2">R$ {p.preco_venda?.toFixed(2)}</td>
                    <td className="border p-2">{p.categoria}</td>
                    <td className="border p-2 text-center text-gray-600">
                      {p.codigo_barras || "—"}
                    </td>
                    <td className="border p-2 text-center">{p.estoque}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}