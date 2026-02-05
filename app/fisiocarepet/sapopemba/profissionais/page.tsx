"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Prof = {
  id: string;
  nome: string;
  crmv: string | null;
  pix_chave: string | null;
  ativo: boolean;
  created_at: string;
};

export default function ProfissionaisPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Prof[]>([]);
  const [form, setForm] = useState({ nome: "", crmv: "", pix_chave: "" });

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("fisio_profissionais")
      .select("*")
      .order("nome", { ascending: true });
    if (!error) setRows((data || []) as Prof[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!form.nome.trim()) return alert("Preencha o nome.");
    const { error } = await supabase.from("fisio_profissionais").insert([
      {
        nome: form.nome.trim(),
        crmv: form.crmv.trim() || null,
        pix_chave: form.pix_chave.trim() || null,
      },
    ]);
    if (error) return alert(error.message);
    setForm({ nome: "", crmv: "", pix_chave: "" });
    load();
  }

  async function toggleAtivo(p: Prof) {
    const { error } = await supabase
      .from("fisio_profissionais")
      .update({ ativo: !p.ativo })
      .eq("id", p.id);
    if (error) return alert(error.message);
    setRows((prev) => prev.map((x) => (x.id === p.id ? { ...x, ativo: !p.ativo } : x)));
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Veterinárias • Cadastro</h1>
            <p className="mt-1 text-sm text-slate-600">
              Cadastre profissionais para vincular nos recebíveis e calcular comissão no mês.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/fisiocarepet/sapopemba"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              ← Voltar
            </Link>
            <Link
              href="/fisiocarepet/sapopemba/recebiveis"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Recebíveis →
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">Nova veterinária</h2>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="CRMV (opcional)"
              value={form.crmv}
              onChange={(e) => setForm({ ...form, crmv: e.target.value })}
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Chave PIX (opcional)"
              value={form.pix_chave}
              onChange={(e) => setForm({ ...form, pix_chave: e.target.value })}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={add}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">
            Lista {loading ? "(carregando…)" : `(${rows.length})`}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">CRMV</th>
                  <th className="px-4 py-3">PIX</th>
                  <th className="px-4 py-3">Ativo</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{p.nome}</td>
                    <td className="px-4 py-3">{p.crmv || "-"}</td>
                    <td className="px-4 py-3">{p.pix_chave || "-"}</td>
                    <td className="px-4 py-3">{p.ativo ? "Sim" : "Não"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleAtivo(p)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold hover:bg-slate-100"
                      >
                        {p.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      Nenhuma veterinária cadastrada.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
