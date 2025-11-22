"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminGigante() {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function criarProduto() {
    if (!nome || !categoria || !preco) {
      alert("Preencha nome, categoria e preço!");
      return;
    }

    setLoading(true);

    let imagem_url = null;

    // ----------------------
    // 1) UPLOAD DA IMAGEM
    // ----------------------
    if (arquivo) {
      const nomeArquivo = `gigante/${Date.now()}-${arquivo.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("gigante")
        .upload(nomeArquivo, arquivo);

      if (uploadError) {
        console.log(uploadError);
        alert("Erro ao enviar imagem");
        setLoading(false);
        return;
      }

      imagem_url = supabase.storage.from("gigante").getPublicUrl(nomeArquivo).data.publicUrl;
    }

    // ----------------------
    // 2) SALVAR NO BANCO
    // ----------------------
    const { error } = await supabase.from("gigante_produtos").insert({
      nome,
      categoria,
      preco: Number(preco),
      imagem_url,
      estoque: 0,
      ativo: true,
    });

    setLoading(false);

    if (error) {
      console.log(error);
      alert("Erro ao salvar produto!");
    } else {
      alert("Produto criado com sucesso!");
      setNome("");
      setCategoria("");
      setPreco("");
      setArquivo(null);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🛠 Administração — Produtos</h1>

      {/* Nome */}
      <input
        className="border p-3 w-full mb-3 rounded"
        placeholder="Nome do Produto"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      {/* Categoria */}
      <input
        className="border p-3 w-full mb-3 rounded"
        placeholder="Categoria"
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
      />

      {/* Preço */}
      <input
        className="border p-3 w-full mb-3 rounded"
        placeholder="Preço"
        type="number"
        step="0.01"
        value={preco}
        onChange={(e) => setPreco(e.target.value)}
      />

      {/* Upload de Imagem */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => setArquivo(e.target.files?.[0] || null)}
        className="border p-3 w-full mb-4 rounded"
      />

      {/* Botão */}
      <button
        onClick={criarProduto}
        disabled={loading}
        className="bg-green-600 text-white w-full p-3 rounded text-lg font-bold"
      >
        {loading ? "Salvando..." : "Criar Produto"}
      </button>
    </div>
  );
}
