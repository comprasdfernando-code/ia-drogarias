"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

// 🔐 senha simples temporária
const SENHA_ADMIN = "admin123";

// loja associada
const LOJA_SLUG = "drogarias-fernando";

type Produto = {
  id: string;
  nome: string;
  descricao?: string | null;
  preco_venda?: number | null;
  imagem?: string | null;
  estoque?: number | null;
  visivel?: boolean | null;
  categoria?: string | null;
};

export default function AdminDrogariasFernando() {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");
  const [itens, setItens] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // LOGIN simples
  function autenticar() {
    if (senha === SENHA_ADMIN) {
      setAutenticado(true);
      setSenha("");
    } else {
      alert("Senha incorreta!");
    }
  }

  // 🔍 carregar produtos
  async function carregarProdutos() {
    try {
      setCarregando(true);
      let query = supabase
        .from("medicamentos_base")
        .select("*")
        .eq("farmacia_slug", LOJA_SLUG)
        .order("nome", { ascending: true })
        .limit(1000);

      if (busca) {
        query = query.or(nome.ilike.%${busca}%,descricao.ilike.%${busca}%);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItens(data || []);
    } catch (e: any) {
      console.error(e.message);
      setMsg("Erro ao carregar produtos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (autenticado) carregarProdutos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, busca]);

  // 💾 salvar alterações
  async function salvarAlteracoes(p: Produto) {
    try {
      setSalvando(true);
      const { error } = await supabase
        .from("medicamentos_base")
        .update({
          nome: p.nome,
          descricao: p.descricao,
          preco_venda: p.preco_venda,
          estoque: p.estoque,
          imagem: p.imagem,
          visivel: p.visivel,
        })
        .eq("id", p.id);

      if (error) throw error;
      setMsg(Produto "${p.nome}" atualizado com sucesso!);
    } catch (e: any) {
      console.error(e.message);
      setMsg("Erro ao salvar alterações.");
    } finally {
      setSalvando(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  if (!autenticado) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded shadow-md w-80 text-center">
          <h2 className="text-xl font-bold mb-4 text-blue-700">
            Painel Admin — Drogarias Fernando
          </h2>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite a senha"
            className="border w-full rounded px-3 py-2 mb-3 text-center"
          />
          <button
            onClick={autenticar}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
          >
            Entrar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">
          Administração — Drogarias Fernando
        </h1>

        {msg && (
          <div className="mb-4 bg-emerald-100 border border-emerald-300 text-emerald-800 px-4 py-2 rounded">
            {msg}
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="flex-1 border rounded px-4 py-2"
          />
          <button
            onClick={carregarProdutos}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Atualizar
          </button>
        </div>

        {carregando ? (
          <p>Carregando produtos...</p>
        ) : (
          <div className="overflow-x-auto border rounded bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="p-2 text-left">Imagem</th>
                  <th className="p-2 text-left">Nome</th>
                  <th className="p-2 text-left">Preço</th>
                  <th className="p-2 text-left">Estoque</th>
                  <th className="p-2 text-left">Visível</th>
                  <th className="p-2 text-left">Salvar</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">
                      {p.imagem ? (
                        <Image
                          src={p.imagem}
                          alt={p.nome}
                          width={50}
                          height={50}
                          className="rounded"
                        />
                      ) : (
                        <span className="text-gray-400">Sem</span>
                      )}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={p.nome || ""}
                        onChange={(e) =>
                          setItens((prev) =>
                            prev.map((x) =>
                              x.id === p.id ? { ...x, nome: e.target.value } : x
                            )
                          )
                        }
                        className="border rounded px-2 py-1 w-56"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={p.preco_venda ?? ""}
                        onChange={(e) =>
                          setItens((prev) =>
                            prev.map((x) =>
                              x.id === p.id
                                ? { ...x, preco_venda: Number(e.target.value) }
                                : x
                            )
                          )
                        }
                        className="border rounded px-2 py-1 w-24 text-right"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={p.estoque ?? 0}
                        onChange={(e) =>
                          setItens((prev) =>
                            prev.map((x) =>
                              x.id === p.id
                                ? { ...x, estoque: Number(e.target.value) }
                                : x
                            )
                          )
                        }
                        className="border rounded px-2 py-1 w-20 text-right"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={p.visivel ?? true}
                        onChange={(e) =>
                          setItens((prev) =>
                            prev.map((x) =>
                              x.id === p.id
                                ? { ...x, visivel: e.target.checked }
                                : x
                            )
                          )
                        }
                      />
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => salvarAlteracoes(p)}
                        disabled={salvando}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs"
                      >
                        {salvando ? "Salvando..." : "Salvar"}
                      </button>
                    </td>
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