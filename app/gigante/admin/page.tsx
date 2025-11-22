"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Produto = {
  id: string;
  nome: string;
  preco: number;
  estoque?: number;
  ativo: boolean;
  imagem_url?: string;
};

export default function AdminProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    const { data } = await supabase.from("gigante_produtos").select("*");
    setProdutos(data || []);
    setLoading(false);
  }

  async function salvar(id: string, campo: string, valor: any) {
    await supabase.from("gigante_produtos").update({ [campo]: valor }).eq("id", id);
  }

  async function uploadImagem(produto: Produto, arquivo: File) {
    const nomeArquivo = `${produto.id}-${Date.now()}.jpg`;

    // ⬆️ Upload no Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("gigante-fotos")
      .upload(nomeArquivo, arquivo);

    if (uploadError) {
      alert("Erro ao enviar imagem.");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("gigante-fotos")
      .getPublicUrl(nomeArquivo);

    const url = urlData.publicUrl;

    // Salva no banco
    await salvar(produto.id, "imagem_url", url);

    setProdutos((prev) =>
      prev.map((x) => (x.id === produto.id ? { ...x, imagem_url: url } : x))
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🛠️ Administração — Produtos</h1>

      {loading && <p>Carregando...</p>}

      <div className="space-y-6">
        {produtos.map((p) => (
          <div
            key={p.id}
            className="bg-white p-4 shadow rounded-lg border flex flex-col gap-4"
          >
            {/* Nome e preço */}
            <div className="flex gap-4 items-center">
              <input
                className="border p-2 rounded w-full"
                value={p.nome}
                onChange={(e) => {
                  const v = e.target.value;
                  setProdutos((prev) =>
                    prev.map((x) => (x.id === p.id ? { ...x, nome: v } : x))
                  );
                  salvar(p.id, "nome", v);
                }}
              />

              <input
                type="number"
                className="border p-2 rounded w-32"
                value={p.preco}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setProdutos((prev) =>
                    prev.map((x) => (x.id === p.id ? { ...x, preco: v } : x))
                  );
                  salvar(p.id, "preco", v);
                }}
              />
            </div>

            {/* Estoque e ativo */}
            <div className="flex gap-4 items-center">
              <input
                type="number"
                value={p.estoque || 0}
                className="border p-2 rounded w-32"
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setProdutos((prev) =>
                    prev.map((x) =>
                      x.id === p.id ? { ...x, estoque: v } : x
                    )
                  );
                  salvar(p.id, "estoque", v);
                }}
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={p.ativo}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setProdutos((prev) =>
                      prev.map((x) =>
                        x.id === p.id ? { ...x, ativo: v } : x
                      )
                    );
                    salvar(p.id, "ativo", v);
                  }}
                />
                {p.ativo ? "Ativo" : "Inativo"}
              </label>
            </div>

            {/* 📸 Imagem */}
            <div className="flex gap-4 items-center">
              {p.imagem_url ? (
                <img
                  src={p.imagem_url}
                  alt="Foto"
                  className="w-24 h-24 rounded object-cover border"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                  Sem foto
                </div>
              )}

              <div className="flex flex-col gap-2">
                {/* CAMERA */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      uploadImagem(p, e.target.files[0]);
                    }
                  }}
                  className="border p-2 rounded"
                />

                {/* GALERIA */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      uploadImagem(p, e.target.files[0]);
                    }
                  }}
                  className="border p-2 rounded"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
