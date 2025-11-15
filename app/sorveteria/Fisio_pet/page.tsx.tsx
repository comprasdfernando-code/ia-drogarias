"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Lancamento = {
  id: string;
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
};

export default function FisioPetFinanceiro() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [form, setForm] = useState({
    tipo: "entrada",
    descricao: "",
    valor: "",
    categoria: "",
    data: "",
  });

  // 🔄 Carrega dados
  async function carregarLancamentos() {
    const { data, error } = await supabase
      .from("financeiro_fisiopet")
      .select("*")
      .order("data", { ascending: false });

    if (!error && data) setLancamentos(data);
  }

  useEffect(() => {
    carregarLancamentos();
  }, []);

  // 💾 Salvar novo registro
  async function salvarLancamento() {
    if (!form.valor || !form.descricao || !form.data)
      return alert("Preencha todos os campos!");

    const { error } = await supabase.from("financeiro_fisiopet").insert([
      {
        tipo: form.tipo,
        descricao: form.descricao,
        valor: Number(form.valor),
        categoria: form.categoria,
        data: form.data,
      },
    ]);

    if (error) {
      console.error(error);
      return alert("Erro ao salvar.");
    }

    setForm({ tipo: "entrada", descricao: "", valor: "", categoria: "", data: "" });
    carregarLancamentos();
  }

  // ▶️ Cálculos
  const totalEntradas = lancamentos
    .filter((l) => l.tipo === "entrada")
    .reduce((acc, cur) => acc + cur.valor, 0);

  const totalSaidas = lancamentos
    .filter((l) => l.tipo === "saida")
    .reduce((acc, cur) => acc + cur.valor, 0);

  const saldo = totalEntradas - totalSaidas;

  // UI
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        💛🐾 Controle Financeiro – FisioPet
      </h1>

      {/* FORM */}
      <div className="bg-white shadow p-4 rounded mb-6">
        <h2 className="font-bold mb-4 text-lg">Novo lançamento</h2>

        <div className="flex gap-3 mb-3">
          <select
            className="border p-2 rounded w-1/3"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>

          <input
            type="number"
            placeholder="Valor (R$)"
            className="border p-2 rounded w-2/3"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
          />
        </div>

        <input
          className="border p-2 rounded w-full mb-3"
          placeholder="Descrição"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />

        <input
          className="border p-2 rounded w-full mb-3"
          placeholder="Categoria (ex: sessões, materiais)"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
        />

        <input
          type="date"
          className="border p-2 rounded w-full mb-4"
          value={form.data}
          onChange={(e) => setForm({ ...form, data: e.target.value })}
        />

        <button
          onClick={salvarLancamento}
          className="bg-blue-600 w-full text-white p-2 rounded"
        >
          Salvar
        </button>
      </div>

      {/* RESUMO */}
      <div className="grid grid-cols-3 gap-4 text-center mb-8">
        <div className="p-4 bg-green-100 rounded shadow">
          <p className="text-xs">Entradas</p>
          <p className="font-bold text-green-600 text-lg">
            R$ {totalEntradas.toFixed(2)}
          </p>
        </div>

        <div className="p-4 bg-red-100 rounded shadow">
          <p className="text-xs">Saídas</p>
          <p className="font-bold text-red-600 text-lg">
            R$ {totalSaidas.toFixed(2)}
          </p>
        </div>

        <div className="p-4 bg-blue-100 rounded shadow">
          <p className="text-xs">Saldo</p>
          <p className="font-bold text-blue-600 text-lg">
            R$ {saldo.toFixed(2)}
          </p>
        </div>
      </div>

      {/* LISTAGEM */}
      <h2 className="text-lg font-bold mb-3">Últimos Lançamentos</h2>

      <ul className="space-y-3">
        {lancamentos.map((l) => (
          <li key={l.id} className="bg-white shadow p-4 rounded flex justify-between">
            <div>
              <p className="font-bold">{l.descricao}</p>
              <p className="text-xs text-gray-500">
                {l.categoria} • {new Date(l.data).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <span
              className={`font-bold ${
                l.tipo === "entrada" ? "text-green-600" : "text-red-600"
              }`}
            >
              {l.tipo === "entrada" ? "+" : "-"} R$ {l.valor.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
