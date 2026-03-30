"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type FormulaPadrao = {
  id: string;
  nome: string;
  formula: string;
  apresentacao: string;
  valor_sugerido: number | null;
  descricao: string | null;
  ativo: boolean | null;
  created_at: string | null;
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function FormulasPage() {
  const [formulas, setFormulas] = useState<FormulaPadrao[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  async function carregarFormulas() {
    setLoading(true);

    const { data, error } = await supabase
      .from("formulas_padrao")
      .select("*")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (error) {
      console.error(error);
      alert("Erro ao carregar fórmulas.");
      setFormulas([]);
    } else {
      setFormulas(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    carregarFormulas();
  }, []);

  const formulasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return formulas;

    return formulas.filter((item) => {
      return (
        (item.nome || "").toLowerCase().includes(termo) ||
        (item.formula || "").toLowerCase().includes(termo) ||
        (item.apresentacao || "").toLowerCase().includes(termo) ||
        (item.descricao || "").toLowerCase().includes(termo)
      );
    });
  }, [formulas, busca]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Busca de fórmulas</h1>
          <p className="text-sm text-gray-500">
            Pesquise uma fórmula pronta e já crie um novo pedido preenchido.
          </p>
        </div>

        <Link
          href="/manipulados/drogaleste30/admin/manipulados"
          className="inline-flex items-center justify-center rounded-xl border px-4 py-2"
        >
          Voltar para manipulados
        </Link>
      </div>

      <div className="mb-6">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, fórmula, apresentação..."
          className="w-full rounded-2xl border p-4"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-6">Carregando...</div>
      ) : formulasFiltradas.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6 text-center text-gray-500">
          Nenhuma fórmula encontrada.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {formulasFiltradas.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              <div className="mb-3">
                <h2 className="text-lg font-bold">{item.nome}</h2>
                <p className="mt-1 text-sm text-gray-700">{item.formula}</p>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  <strong>Apresentação:</strong> {item.apresentacao}
                </p>

                <p>
                  <strong>Valor sugerido:</strong>{" "}
                  {item.valor_sugerido !== null &&
                  item.valor_sugerido !== undefined
                    ? brl(Number(item.valor_sugerido))
                    : "-"}
                </p>

                <p>
                  <strong>Descrição:</strong> {item.descricao || "-"}
                </p>
              </div>

              <div className="mt-5 flex gap-3">
                <Link
                  href={`/manipulados/drogaleste30/admin/manipulados/novo?formula_id=${item.id}`}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-white"
                >
                  Criar pedido
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}