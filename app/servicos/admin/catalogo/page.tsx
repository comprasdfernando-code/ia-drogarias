"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Servico = {
  id: string;
  nome: string | null;
  descricao: string | null;
  preco: number | null;
  ativo?: boolean | null;
};

function moneyToNumber(v: string) {
  const clean = v.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

function formatBRL(n: number | null | undefined) {
  const v = Number(n ?? 0);
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminCatalogoPage() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rows, setRows] = useState<Servico[]>([]);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => (r.nome ?? "").toLowerCase().includes(s));
  }, [rows, q]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("servicos_catalogo")
      .select("id,nome,descricao,preco,ativo")
      .order("nome", { ascending: true });

    if (error) console.error(error);
    setRows((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function savePrice(id: string, preco: number) {
    setSavingId(id);
    const { error } = await supabase
      .from("servicos_catalogo")
      .update({ preco })
      .eq("id", id);

    if (error) {
      alert("Erro ao salvar preço. Verifique se você está como admin (RLS).");
      console.error(error);
    } else {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, preco } : r)));
    }
    setSavingId(null);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Admin • Catálogo</h1>
            <p className="text-slate-600 text-sm">Editar preço dos serviços.</p>
          </div>
          <button
            onClick={load}
            className="px-4 py-2 rounded-lg bg-white border text-slate-800 font-semibold"
          >
            Atualizar
          </button>
        </div>

        <div className="bg-white border rounded-2xl p-4 mb-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar serviço..."
            className="w-full px-4 py-3 rounded-xl border bg-slate-50"
          />
        </div>

        <div className="bg-white border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-bold text-slate-900">Serviços</div>
            <div className="text-sm text-slate-600">
              {loading ? "Carregando..." : `${filtered.length} itens`}
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-slate-600">Carregando catálogo...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-slate-600">Nada encontrado.</div>
          ) : (
            <div className="divide-y">
              {filtered.map((r) => (
                <div key={r.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-extrabold text-slate-900">
                        {r.nome ?? "—"}
                      </div>
                      {r.descricao ? (
                        <div className="text-sm text-slate-600">{r.descricao}</div>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500">Preço atual</div>
                      <div className="font-extrabold text-slate-900">
                        {formatBRL(r.preco)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      defaultValue={(r.preco ?? 0).toString().replace(".", ",")}
                      inputMode="decimal"
                      placeholder="Ex: 15,00"
                      className="w-40 px-3 py-2 rounded-lg border bg-slate-50"
                      onBlur={(e) => {
                        const preco = moneyToNumber(e.target.value);
                        savePrice(r.id, preco);
                      }}
                    />
                    <button
                      disabled={savingId === r.id}
                      onClick={() => savePrice(r.id, Number(r.preco ?? 0))}
                      className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold disabled:opacity-60"
                      title="Salva o valor atual"
                    >
                      {savingId === r.id ? "Salvando..." : "Salvar"}
                    </button>

                    <div className="text-xs text-slate-500">
                      Dica: edite e **saia do campo** pra salvar (onBlur).
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Se der “policy / RLS”, confirme que seu usuário está em <code>admin_users</code>.
        </div>
      </div>
    </div>
  );
}
