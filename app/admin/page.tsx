"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔌 Conexão Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [novoProduto, setNovoProduto] = useState({
    nome: "",
    categoria: "",
    preco_venda: 0,
    estoque: 0,
    imagem: "",
  });

  // 🌀 Carrega produtos ao abrir
  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
  let pagina = 0;
  const limite = 100;
  let todos: any[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .order("nome", { ascending: true })
      .range(pagina * limite, (pagina + 1) * limite - 1);

    if (error) {
      console.error("❌ Erro ao carregar produtos (Admin):", error);
      break;
    }

    if (!data || data.length === 0) break;

    todos = [...todos, ...data];
    if (data.length < limite) break;
    pagina++;
  }

  console.log("✅ Total de produtos carregados (Admin):", todos.length);
  setProdutos(todos);
}


  // 🧠 Atualizar campo diretamente
  async function atualizarCampo(id: string, campo: string, valor: any) {
    const { error } = await supabase
      .from("produtos")
      .update({ [campo]: valor })
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar:", error);
      alert("❌ Erro ao salvar!");
    } else {
      setProdutos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
      );
    }
  }

  // ➕ Adicionar novo produto
  async function adicionarProduto() {
    if (!novoProduto.nome) return alert("Informe o nome do produto!");

    const { error } = await supabase.from("produtos").insert([
      {
        nome: novoProduto.nome,
        categoria: novoProduto.categoria || "Outros",
        preco_venda: novoProduto.preco_venda || 0,
        estoque: novoProduto.estoque || 0,
        imagem: novoProduto.imagem || "",
        loja: "drogariaredefabiano",
        disponivel: true,
      },
    ]);

    if (error) {
      console.error("Erro ao adicionar produto:", error);
      alert("❌ Falha ao adicionar produto!");
    } else {
      alert("✅ Produto adicionado com sucesso!");
      setNovoProduto({
        nome: "",
        categoria: "",
        preco_venda: 0,
        estoque: 0,
        imagem: "",
      });
      carregarProdutos();
    }
  }

  // 🔍 Filtro de busca
  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-100 pb-10">
      {/* Cabeçalho */}
      <section className="bg-blue-700 text-white shadow-md py-3 px-6 flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold">
          🧠 Painel Administrativo — IA Drogarias
        </h1>
        <button
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded"
          onClick={() => alert("Logout em breve 😎")}
        >
          Sair
        </button>
      </section>

      {/* Filtros */}
      <div className="max-w-6xl mx-auto mt-6 px-4">
        <input
          type="text"
          placeholder="Buscar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border rounded w-full px-3 py-2 mb-6 shadow-sm"
        />

        {/* Novo produto */}
        <div className="bg-white p-4 rounded shadow mb-8 flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Nome"
            value={novoProduto.nome}
            onChange={(e) =>
              setNovoProduto({ ...novoProduto, nome: e.target.value })
            }
            className="border rounded px-2 py-1 flex-1 min-w-[150px]"
          />
          <input
            type="text"
            placeholder="Categoria"
            value={novoProduto.categoria}
            onChange={(e) =>
              setNovoProduto({ ...novoProduto, categoria: e.target.value })
            }
            className="border rounded px-2 py-1 flex-1 min-w-[120px]"
          />
          <input
            type="number"
            placeholder="Preço"
            value={novoProduto.preco_venda}
            onChange={(e) =>
              setNovoProduto({
                ...novoProduto,
                preco_venda: parseFloat(e.target.value),
              })
            }
            className="border rounded px-2 py-1 w-24 text-center"
          />
          <input
            type="number"
            placeholder="Estoque"
            value={novoProduto.estoque}
            onChange={(e) =>
              setNovoProduto({
                ...novoProduto,
                estoque: parseInt(e.target.value),
              })
            }
            className="border rounded px-2 py-1 w-20 text-center"
          />
          <input
            type="text"
            placeholder="URL da imagem"
            value={novoProduto.imagem}
            onChange={(e) =>
              setNovoProduto({ ...novoProduto, imagem: e.target.value })
            }
            className="border rounded px-2 py-1 flex-1 min-w-[250px]"
          />
          <button
            onClick={adicionarProduto}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            + Adicionar Produto
          </button>
        </div>

        {/* Tabela de produtos */}
        <table className="w-full border-collapse bg-white rounded shadow">
          <thead className="bg-blue-700 text-white text-sm">
            <tr>
              <th className="p-2">Imagem</th>
              <th className="p-2">Nome</th>
              <th className="p-2">Categoria</th>
              <th className="p-2">Preço</th>
              <th className="p-2">Estoque</th>
              <th className="p-2">Disponível</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map((p) => (
              <tr key={p.id} className="border-b text-sm">
                <td className="p-2">
                  {p.imagem ? (
                    <img
                      src={p.imagem}
                      alt={p.nome}
                      className="w-12 h-12 object-cover mx-auto rounded"
                    />
                  ) : (
                    "—"
                  )}
                  <input
                    type="text"
                    value={p.imagem || ""}
                    onChange={(e) =>
                      atualizarCampo(p.id, "imagem", e.target.value)
                    }
                    placeholder="Cole o link da imagem"
                    className="border rounded w-full px-2 py-1 mt-1 text-xs"
                  />
                </td>

                <td className="p-2">
                  <input
                    type="text"
                    value={p.nome || ""}
                    onChange={(e) =>
                      atualizarCampo(p.id, "nome", e.target.value)
                    }
                    className="border rounded w-full px-2 py-1 text-sm"
                  />
                </td>

                <td className="p-2">
                  <input
                    type="text"
                    value={p.categoria || ""}
                    onChange={(e) =>
                      atualizarCampo(p.id, "categoria", e.target.value)
                    }
                    className="border rounded w-full px-2 py-1 text-sm"
                  />
                </td>

                <td className="p-2 text-center">
                  <input
                    type="number"
                    value={p.preco_venda || 0}
                    onChange={(e) =>
                      atualizarCampo(
                        p.id,
                        "preco_venda",
                        parseFloat(e.target.value)
                      )
                    }
                    className="border rounded w-20 px-2 py-1 text-center"
                  />
                </td>

                <td className="p-2 text-center">
                  <input
                    type="number"
                    value={p.estoque || 0}
                    onChange={(e) =>
                      atualizarCampo(p.id, "estoque", parseInt(e.target.value))
                    }
                    className="border rounded w-16 px-2 py-1 text-center"
                  />
                </td>

                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={p.disponivel}
                    onChange={(e) =>
                      atualizarCampo(p.id, "disponivel", e.target.checked)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}