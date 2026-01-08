"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminProdutos() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ativo, setAtivo] = useState<"" | "sim" | "nao">("");

  async function load() {
    let query = supabase.from("fv_produtos").select("*");

    if (busca) query = query.ilike("nome", `%${busca}%`);
    if (categoria) query = query.eq("categoria", categoria);
    if (ativo === "sim") query = query.eq("ativo", true);
    if (ativo === "nao") query = query.eq("ativo", false);

    const { data } = await query.order("nome");
    setProdutos(data || []);
  }

  useEffect(() => {
    load();
  }, [busca, categoria, ativo]);

  async function toggle(id: string, campo: string, valor: boolean) {
    await supabase.from("fv_produtos").update({ [campo]: !valor }).eq("id", id);
    load();
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Produtos</h1>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <input
          placeholder="Buscar produto..."
          className="border rounded px-3 py-2"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <select onChange={(e) => setCategoria(e.target.value)} className="border px-3 py-2 rounded">
          <option value="">Todas categorias</option>
          <option value="Antigripais">Antigripais</option>
          <option value="Vitaminas">Vitaminas</option>
        </select>

        <select onChange={(e) => setAtivo(e.target.value as any)} className="border px-3 py-2 rounded">
          <option value="">Todos</option>
          <option value="sim">Ativos</option>
          <option value="nao">Inativos</option>
        </select>
      </div>

      {/* Tabela */}
      <table className="w-full text-sm bg-white shadow rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Nome</th>
            <th>Categoria</th>
            <th>PMC</th>
            <th>Promo</th>
            <th>Ativo</th>
            <th>Home</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.nome}</td>
              <td>{p.categoria}</td>
              <td>R$ {p.pmc}</td>
              <td>R$ {p.preco_promocional ?? "-"}</td>
              <td>
                <button onClick={() => toggle(p.id, "ativo", p.ativo)}>
                  {p.ativo ? "✅" : "❌"}
                </button>
              </td>
              <td>
                <button onClick={() => toggle(p.id, "destaque_home", p.destaque_home)}>
                  {p.destaque_home ? "⭐" : "—"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
