"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔌 Conexão Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_PASSWORD = "adm@ia2025";

// ============================
// COMPONENTE PRINCIPAL
// ============================
export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("ia_admin_auth");
    if (token === ADMIN_PASSWORD) setAutenticado(true);
  }, []);

  if (!autenticado) {
    return <LoginForm onLogin={() => setAutenticado(true)} />;
  }

  return <PainelAdmin onLogout={() => setAutenticado(false)} />;
}

// ============================
// COMPONENTE: LOGIN
// ============================
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [senha, setSenha] = useState("");

  function autenticar() {
    if (senha === ADMIN_PASSWORD) {
      localStorage.setItem("ia_admin_auth", senha);
      onLogin();
    } else {
      alert("Senha incorreta!");
    }
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-80 text-center border">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">
          🔐 Acesso Restrito
        </h1>
        <input
          type="password"
          placeholder="Digite a senha..."
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="border p-2 w-full rounded mb-4"
        />
        <button
          onClick={autenticar}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        >
          Entrar
        </button>
        <p className="text-xs text-gray-400 mt-4">
          IA Drogarias — Painel Administrativo
        </p>
      </div>
    </main>
  );
}

// ============================
// COMPONENTE: PAINEL ADMIN
// ============================
function PainelAdmin({ onLogout }: { onLogout: () => void }) {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [novoProduto, setNovoProduto] = useState({
    nome: "",
    categoria: "",
    preco_venda: "",
    estoque: 0,
    disponivel: true,
  });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    setCarregando(true);
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .order("nome", { ascending: true });
    if (error) console.error(error);
    else setProdutos(data || []);
    setCarregando(false);
  }

  async function salvarProduto(id: string, campo: string, valor: any) {
    const { error } = await supabase
      .from("produtos")
      .update({ [campo]: valor, atualizado_em: new Date() })
      .eq("id", id);
    if (error) alert("Erro ao atualizar produto!");
    else {
      setProdutos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
      );
      setEditando(null);
    }
  }

  async function adicionarProduto() {
    if (!novoProduto.nome) return alert("Informe o nome do produto!");
    const { error } = await supabase
      .from("produtos")
      .insert([{ ...novoProduto, atualizado_em: new Date() }]);
    if (error) alert("Erro ao adicionar produto!");
    else {
      alert("✅ Produto adicionado com sucesso!");
      setNovoProduto({
        nome: "",
        categoria: "",
        preco_venda: "",
        estoque: 0,
        disponivel: true,
      });
      carregarProdutos();
    }
  }

  const produtosFiltrados = produtos.filter((p) =>
    p.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700">
          🧠 Painel Administrativo — IA Drogarias
        </h1>
        <button
          onClick={() => {
            localStorage.removeItem("ia_admin_auth");
            onLogout();
          }}
          className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
        >
          Sair
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6 justify-between items-center">
        <input
          type="text"
          placeholder="Buscar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border border-gray-300 rounded-md p-2 w-64"
        />
      </div>

      {/* Adicionar produto */}
      <div className="mb-8 bg-gray-50 border border-gray-200 rounded-md p-4">
        <h2 className="font-semibold mb-2">Adicionar novo produto</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input
            placeholder="Nome"
            value={novoProduto.nome}
            onChange={(e) =>
              setNovoProduto({ ...novoProduto, nome: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            placeholder="Categoria"
            value={novoProduto.categoria}
            onChange={(e) =>
              setNovoProduto({ ...novoProduto, categoria: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Preço"
            value={novoProduto.preco_venda}
            onChange={(e) =>
              setNovoProduto({ ...novoProduto, preco_venda: e.target.value })
            }
            className="border p-2 rounded"
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
            className="border p-2 rounded"
          />
        </div>
        <button
          onClick={adicionarProduto}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          ➕ Adicionar Produto
        </button>
      </div>

      {/* Tabela */}
      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-md shadow">
          <table className="w-full text-sm border border-gray-200">
            <thead className="bg-blue-700 text-white">
              <tr>
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
                <tr key={p.id} className="border-t hover:bg-gray-50 text-center">
                  <td className="p-2">{p.nome}</td>
                  <td className="p-2">{p.categoria}</td>
                  <td className="p-2">
                    R$ {Number(p.preco_venda || 0).toFixed(2)}
                  </td>
                  <td className="p-2">{p.estoque}</td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={p.disponivel}
                      onChange={(e) =>
                        salvarProduto(p.id, "disponivel", e.target.checked)
                      }
                    />
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => setEditando(p.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}