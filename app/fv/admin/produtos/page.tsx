"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ProdutoAdmin = {
  id: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  categoria: string | null;
  pmc: number | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  ativo: boolean | null;
  destaque_home: boolean | null;
};

function brl(v?: number | null) {
  if (!v) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminProdutos() {
  const [rows, setRows] = useState<ProdutoAdmin[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("fv_produtos")
        .select("id,ean,nome,laboratorio,categoria,pmc,em_promocao,preco_promocional,percentual_off,ativo,destaque_home")
        .order("nome");

      if (!error && data) setRows(data as ProdutoAdmin[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtrados = rows.filter((p) => {
    const t = busca.toLowerCase();
    return (
      p.nome?.toLowerCase().includes(t) ||
      p.ean?.includes(t)
    );
  });

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-blue-800 mb-4">
        Admin • Produtos FV
      </h1>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome ou EAN..."
        className="w-full mb-4 px-4 py-2 border rounded-full"
      />

      {loading ? (
        <p>Carregando…</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Produto</th>
                <th className="p-2">PMC</th>
                <th className="p-2">Promo</th>
                <th className="p-2">% OFF</th>
                <th className="p-2">Ativo</th>
                <th className="p-2">Home</th>
                <th className="p-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">
                    <div className="font-semibold">{p.nome}</div>
                    <div className="text-xs text-gray-500">
                      {p.laboratorio} • EAN {p.ean}
                    </div>
                  </td>
                  <td className="p-2 text-center">{brl(p.pmc)}</td>
                  <td className="p-2 text-center">
                    {p.em_promocao ? brl(p.preco_promocional) : "—"}
                  </td>
                  <td className="p-2 text-center">
                    {p.percentual_off ? `${p.percentual_off}%` : "—"}
                  </td>
                  <td className="p-2 text-center">{p.ativo ? "✔" : "—"}</td>
                  <td className="p-2 text-center">{p.destaque_home ? "✔" : "—"}</td>
                  <td className="p-2 text-center">
                    <Link
                      href={`/fv/admin/produtos/${p.id}`}
                      className="text-blue-700 underline"
                    >
                      Editar
                    </Link>
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
