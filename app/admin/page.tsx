"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

// 🔌 Conexão com Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  // 🔄 Carrega produtos
  useEffect(() => {
    async function carregarProdutos() {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("nome", { ascending: true });

      if (error) console.error("Erro ao carregar produtos:", error);
      else setProdutos(data || []);
      setCarregando(false);
    }
    carregarProdutos();
  }, []);

  // 💾 Atualiza produto no banco
  async function atualizarProduto(id: string, campo: string, valor: any) {
    const { error } = await supabase.from("produtos").update({ [campo]: valor }).eq("id", id);
    if (error) console.error("Erro ao atualizar produto:", error);
  }

  // 🧠 Upload de imagem
  async function uploadImagem(produto: any, arquivo: File) {
    try {
      const nomeArquivo = '${produto.id}-${arquivo.name}';
      const caminho = '/drogariaredefabiano/${nomeArquivo}';

      // Envia pro bucket "produtos"
      const { error: uploadError } = await supabase.storage
        .from("produtos")
        .upload(caminho, arquivo, { upsert: true });

      if (uploadError) {
        console.error("Erro ao enviar imagem:", uploadError);
        alert("Erro ao enviar imagem!");
        return;
      }

      // 🔗 Gera URL pública
      const { data } = supabase.storage.from("produtos").getPublicUrl(caminho);
      const urlPublica = data?.publicUrl;

      // Atualiza a URL no banco
      await supabase.from("produtos").update({ imagem: urlPublica }).eq("id", produto.id);
      alert("✅ Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Erro inesperado no upload:", error);
      alert("Erro inesperado ao enviar imagem!");
    }
  }

  // 🔍 Filtro
  const produtosFiltrados = produtos.filter((p) =>
    p.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      {/* Cabeçalho */}
      <section className="w-full bg-blue-700 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="font-bold text-xl">📋 Painel Administrativo — IA Drogarias</h1>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-red-500 hover:bg-red-600 px-4 py-1 rounded text-white"
          >
            Sair
          </button>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Barra de busca */}
        <input
          type="text"
          placeholder="Buscar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full mb-4 p-2 border border-gray-300 rounded"
        />

        {/* Tabela */}
        {carregando ? (
          <p className="text-center text-gray-500">Carregando produtos...</p>
        ) : (
          <table className="w-full border-collapse bg-white shadow">
            <thead>
              <tr className="bg-blue-600 text-white text-sm">
                <th className="p-2">Imagem</th>
                <th className="p-2">Nome</th>
                <th className="p-2">Categoria</th>
                <th className="p-2">Preço</th>
                <th className="p-2">Estoque</th>
                <th className="p-2">Disponível</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>

            <tbody>
              {produtosFiltrados.map((p) => (
                <tr key={p.id} className="text-center border-t hover:bg-gray-50">
                  <td className="p-2">
                    {p.imagem ? (
                      <Image
                        src={p.imagem}
                        alt={p.nome || "Produto"}
                        width={50}
                        height={50}
                        className="mx-auto rounded"
                      />
                    ) : (
                      <span>❌</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          uploadImagem(p, e.target.files[0]);
                        }
                      }}
                      className="mt-2 text-xs"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="text"
                      defaultValue={p.nome}
                      onBlur={(e) => atualizarProduto(p.id, "nome", e.target.value)}
                      className="border rounded p-1 text-sm w-full"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="text"
                      defaultValue={p.categoria}
                      onBlur={(e) => atualizarProduto(p.id, "categoria", e.target.value)}
                      className="border rounded p-1 text-sm w-full"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="number"
                      defaultValue={p.preco_venda}
                      onBlur={(e) =>
                        atualizarProduto(p.id, "preco_venda", parseFloat(e.target.value))
                      }
                      className="border rounded p-1 text-sm w-full text-center"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="number"
                      defaultValue={p.estoque}
                      onBlur={(e) =>
                        atualizarProduto(p.id, "estoque", parseInt(e.target.value))
                      }
                      className="border rounded p-1 text-sm w-full text-center"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="checkbox"
                      defaultChecked={p.disponivel}
                      onChange={(e) => atualizarProduto(p.id, "disponivel", e.target.checked)}
                    />
                  </td>

                  <td className="p-2">
                    <button
                      onClick={'() => alert(Produto ${p.nome} atualizado!)'}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      ✔️ Salvar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}