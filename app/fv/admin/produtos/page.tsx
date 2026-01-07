"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// =====================
// Supabase client
// =====================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Produto = {
  id: string;
  ean: string;
  nome: string;
  laboratorio: string;
  categoria: string | null;
  pmc: number | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  ativo: boolean | null;
  destaque_home: boolean | null;
};

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminFVProdutosPage() {
  const [loading, setLoading] = useState(false);

  // filtros
  const [q, setQ] = useState("");
  const [ativo, setAtivo] = useState<"all" | "true" | "false">("all");
  const [promo, setPromo] = useState<"all" | "true" | "false">("all");
  const [destaque, setDestaque] = useState<"all" | "true" | "false">("all");

  // paginação
  const pageSize = 50;
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const [rows, setRows] = useState<Produto[]>([]);

  const qDebounced = useDebouncedValue(q, 350);

  async function load() {
    setLoading(true);
    try {
      let query = supabase
        .from("fv_produtos")
        .select(
          "id,ean,nome,laboratorio,categoria,pmc,em_promocao,preco_promocional,percentual_off,ativo,destaque_home",
          { count: "exact" }
        );

      // busca: se for só dígitos => EAN exato; senão => ILIKE no nome
      const clean = (qDebounced || "").trim();
      if (clean) {
        const onlyDigits = /^[0-9]+$/.test(clean);
        if (onlyDigits) query = query.eq("ean", clean);
        else query = query.ilike("nome", `%${clean}%`);
      }

      if (ativo !== "all") query = query.eq("ativo", ativo === "true");
      if (promo !== "all") query = query.eq("em_promocao", promo === "true");
      if (destaque !== "all") query = query.eq("destaque_home", destaque === "true");

      // paginação
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // ordena por nome
      query = query.order("nome", { ascending: true }).range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      setRows((data || []) as Produto[]);
      setTotal(count || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(0); // reset quando muda filtro
  }, [qDebounced, ativo, promo, destaque]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced, ativo, promo, destaque, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Admin FV — Produtos</h1>
          <p className="text-sm text-gray-600">
            Total: <b>{total}</b> | Página {page + 1} de {totalPages}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou EAN..."
            className="border rounded-md px-3 py-2 w-[320px] max-w-full"
          />

          <select className="border rounded-md px-3 py-2" value={ativo} onChange={(e) => setAtivo(e.target.value as any)}>
            <option value="all">Ativo: Todos</option>
            <option value="true">Ativo: Sim</option>
            <option value="false">Ativo: Não</option>
          </select>

          <select className="border rounded-md px-3 py-2" value={promo} onChange={(e) => setPromo(e.target.value as any)}>
            <option value="all">Promo: Todas</option>
            <option value="true">Promo: Sim</option>
            <option value="false">Promo: Não</option>
          </select>

          <select className="border rounded-md px-3 py-2" value={destaque} onChange={(e) => setDestaque(e.target.value as any)}>
            <option value="all">Home: Todos</option>
            <option value="true">Home: Destaques</option>
            <option value="false">Home: Não</option>
          </select>
        </div>
      </div>

      <div className="mt-4 border rounded-lg overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-3">EAN</th>
                <th className="p-3">Nome</th>
                <th className="p-3">Laboratório</th>
                <th className="p-3">PMC</th>
                <th className="p-3">Promo</th>
                <th className="p-3">% OFF</th>
                <th className="p-3">Ativo</th>
                <th className="p-3">Home</th>
                <th className="p-3">Ação</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-3 text-gray-600" colSpan={9}>Carregando…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-600" colSpan={9}>Nenhum produto encontrado.</td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-mono">{r.ean}</td>
                    <td className="p-3">{r.nome}</td>
                    <td className="p-3">{r.laboratorio}</td>
                    <td className="p-3">{brl(r.pmc)}</td>
                    <td className="p-3">{r.em_promocao ? brl(r.preco_promocional) : "—"}</td>
                    <td className="p-3">{r.em_promocao && r.percentual_off != null ? `${r.percentual_off}%` : "—"}</td>
                    <td className="p-3">{r.ativo ? "Sim" : "Não"}</td>
                    <td className="p-3">{r.destaque_home ? "Sim" : "Não"}</td>
                    <td className="p-3">
                      <Link
                        className="text-blue-700 underline"
                        href={`/fv/admin/produtos/${r.id}`}
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-3 bg-white border-t">
          <button
            className="border rounded px-3 py-1 disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
          >
            ← Anterior
          </button>

          <div className="text-sm text-gray-600">
            {total > 0 ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} de ${total}` : "0"}
          </div>

          <button
            className="border rounded px-3 py-1 disabled:opacity-40"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loading}
          >
            Próxima →
          </button>
        </div>
      </div>
    </div>
  );
}

// Debounce simples
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return v;
}
