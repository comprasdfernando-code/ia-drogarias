"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Image from "next/image";

type SorveteProduto = {
  id?: string;
  nome: string;
  linha: string;
  categoria: string;
  sabor?: string | null;
  preco: number;
  imagem_url?: string | null;
  codigo_barras?: string | null;
  ativo: boolean;
};

export default function AdminSorveteriaPage() {
  const [produtos, setProdutos] = useState<SorveteProduto[]>([]);
  const [form, setForm] = useState<Partial<SorveteProduto>>({});
  const [file, setFile] = useState<File | null>(null);
  const [busca, setBusca] = useState("");
  const [uploading, setUploading] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos"); // novo filtro

  async function buscarProdutos() {
    let query = supabase.from("sorveteria_produtos").select("*");

    // 🔍 filtro de texto
    if (busca.trim()) {
      query = query.or(`nome.ilike.%${busca}%,codigo_barras.ilike.%${busca}%`);
    }

    // ✅ filtro de status
    if (filtroStatus === "ativos") query = query.eq("ativo", true);
    if (filtroStatus === "inativos") query = query.eq("ativo", false);

    query = query.order("nome");

    const { data, error } = await query;
    if (error) {
      console.error(error);
      alert("Erro ao buscar produtos");
    } else {
      setProdutos(data || []);
    }
  }

  async function salvarProduto() {
    try {
      setUploading(true);
      let imagem_url = form.imagem_url || null;

      if (file) {
  // 🔤 Gera nome de arquivo a partir do nome do produto (sem acento/espaço)
  const baseName = (form.nome || "produto")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9]/g, "_")   // troca espaços e símbolos por _
    .toLowerCase();

  // 🧱 caminho no bucket
  const fileName = `produtos/${baseName}_${Date.now()}.jpg`;

  // 🚀 upload pro Supabase
  const { error: uploadError } = await supabase.storage
    .from("sorveteria")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true, // substitui se já existir
    });

  if (uploadError) throw uploadError;

  // 🔗 pega URL pública
  const { data: publicUrl } = supabase.storage
    .from("sorveteria")
    .getPublicUrl(fileName);

  imagem_url = publicUrl.publicUrl;
}

      if (form.id) {
        const { error } = await supabase
          .from("sorveteria_produtos")
          .update({
            nome: form.nome,
            linha: form.linha,
            categoria: form.categoria,
            sabor: form.sabor,
            preco: form.preco,
            codigo_barras: form.codigo_barras,
            imagem_url,
            ativo: form.ativo ?? true,
          })
          .eq("id", form.id);

        if (error) throw error;
        alert("✅ Produto atualizado!");
      } else {
        const { error } = await supabase.from("sorveteria_produtos").insert([
          {
            nome: form.nome,
            linha: form.linha,
            categoria: form.categoria,
            sabor: form.sabor,
            preco: form.preco,
            codigo_barras: form.codigo_barras,
            imagem_url,
            ativo: true,
          },
        ]);
        if (error) throw error;
        alert("✅ Produto cadastrado!");
      }

      setForm({});
      setFile(null);
      setProdutos([]);
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  function editarProduto(p: SorveteProduto) {
    setForm(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deletarProduto(id: string) {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase
      .from("sorveteria_produtos")
      .delete()
      .eq("id", id);
    if (error) alert("Erro: " + error.message);
    else {
      alert("🗑️ Produto excluído!");
      setProdutos(produtos.filter((x) => x.id !== id));
    }
  }

  async function alternarAtivo(p: SorveteProduto) {
    const novoStatus = !p.ativo;
    const { error } = await supabase
      .from("sorveteria_produtos")
      .update({ ativo: novoStatus })
      .eq("id", p.id);
    if (error) alert("Erro ao atualizar status: " + error.message);
    else {
      alert(novoStatus ? "✅ Produto ativado!" : "🚫 Produto desativado!");
      setProdutos((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, ativo: novoStatus } : x))
      );
    }
  }

  function limparForm() {
    setForm({});
    setFile(null);
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
            placeholder="Código de Barras"
            value={form.codigo_barras || ""}
            onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border p-2 rounded"
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={salvarProduto}
            disabled={uploading}
            className="px-6 py-2 bg-fuchsia-600 text-white rounded hover:bg-fuchsia-700 disabled:opacity-50"
          >
            {uploading
              ? "Enviando..."
              : form.id
              ? "Atualizar Produto"
              : "Salvar Produto"}
          </button>
          <button
            onClick={limparForm}
            className="px-4 py-2 bg-neutral-300 text-black rounded hover:bg-neutral-400"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Busca + Filtro */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou código..."
          className="border p-2 rounded w-64"
        />
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="todos">Todos</option>
          <option value="ativos">Somente Ativos</option>
          <option value="inativos">Somente Inativos</option>
        </select>
        <button
          onClick={buscarProdutos}
          className="px-4 py-2 bg-fuchsia-500 text-white rounded hover:bg-fuchsia-600"
        >
          Buscar
        </button>
      </div>

      {/* Lista */}
      {produtos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {produtos.map((p) => (
            <div
              key={p.id}
              className={`border rounded-lg p-2 text-center shadow-sm ${
                p.ativo ? "bg-white" : "bg-neutral-100 opacity-70"
              }`}
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
              {p.codigo_barras && (
                <div className="text-[10px] text-neutral-400 mt-1">
                  {p.codigo_barras}
                </div>
              )}
              <div className="flex justify-center gap-2 mt-2 flex-wrap">
                <button
                  onClick={() => editarProduto(p)}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() => alternarAtivo(p)}
                  className={`text-xs px-2 py-1 rounded ${
                    p.ativo
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white`}
                >
                  {p.ativo ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => deletarProduto(p.id!)}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}