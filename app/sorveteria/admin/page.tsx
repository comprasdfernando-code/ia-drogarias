"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Image from "next/image";

type SorveteProduto = {
  id: string;
  nome: string;
  linha: string;
  categoria: string;
  sabor?: string | null;
  preco: number;
  imagem_url?: string | null;
  ativo: boolean;
  ordem?: number | null;
  created_at?: string;
};

export default function AdminSorveteriaPage() {
  const [produtos, setProdutos] = useState<SorveteProduto[]>([]);
  const [form, setForm] = useState<Partial<SorveteProduto>>({});
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Carregar produtos existentes
  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from("sorveteria_produtos")
      .select("*")
      .order("ordem", { ascending: true });

    if (error) console.error(error);
    else setProdutos(data || []);
  }

  async function salvarProduto() {
    try {
      setUploading(true);
      let imagem_url = form.imagem_url || null;

      // Upload da imagem, se tiver arquivo novo
      if (file) {
        const fileName = ${Date.now()}_${file.name};
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("sorveteria")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("sorveteria")
          .getPublicUrl(fileName);

        imagem_url = publicUrl.publicUrl;
      }

      // Inserir no banco
      const { error } = await supabase.from("sorveteria_produtos").insert([
        {
          nome: form.nome,
          linha: form.linha,
          categoria: form.categoria,
          sabor: form.sabor,
          preco: form.preco,
          imagem_url,
          ativo: true,
        },
      ]);

      if (error) throw error;
      alert("✅ Produto salvo com sucesso!");
      setForm({});
      setFile(null);
      carregarProdutos();
    } catch (err: any) {
      alert("Erro ao salvar produto: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-fuchsia-50 to-white p-6">
      <h1 className="text-3xl font-extrabold text-fuchsia-800 mb-6">
        Painel Admin — Sorveteria Oggi 🍦
      </h1>

      {/* Formulário */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            placeholder="Nome"
            value={form.nome || ""}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Linha"
            value={form.linha || ""}
            onChange={(e) => setForm({ ...form, linha: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Categoria"
            value={form.categoria || ""}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Sabor"
            value={form.sabor || ""}
            onChange={(e) => setForm({ ...form, sabor: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Preço (R$)"
            value={form.preco || ""}
            onChange={(e) =>
              setForm({ ...form, preco: parseFloat(e.target.value) })
            }
            className="border p-2 rounded"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border p-2 rounded"
          />
        </div>

        <button
          onClick={salvarProduto}
          disabled={uploading}
          className="mt-4 px-6 py-2 bg-fuchsia-600 text-white rounded hover:bg-fuchsia-700 disabled:opacity-50"
        >
          {uploading ? "Enviando..." : "Salvar Produto"}
        </button>
      </div>

      {/* Lista */}
      <h2 className="text-2xl font-bold mb-4">Produtos Cadastrados</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {produtos.map((p) => (
          <div
            key={p.id}
            className="border rounded-lg p-2 text-center bg-white shadow-sm"
          >
            {p.imagem_url ? (
              <Image
                src={p.imagem_url}
                alt={p.nome}
                width={150}
                height={150}
                className="mx-auto rounded"
              />
            ) : (
              <div className="h-[150px] flex items-center justify-center text-sm text-neutral-400">
                sem imagem
              </div>
            )}
            <div className="mt-2 text-sm font-semibold">{p.nome}</div>
            <div className="text-xs text-neutral-500">{p.linha}</div>
            <div className="text-xs font-bold text-fuchsia-700">
              R$ {p.preco.toFixed(2).replace(".", ",")}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}