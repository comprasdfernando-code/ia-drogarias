"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const EMPRESA_SLUG = "ninhocar";

function brl(v: any) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function hojeISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDiasISO(iso: string, dias: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + dias);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function RelatoriosClient() {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  // filtros
  const [ini, setIni] = useState<string>(() => hojeISO());
  const [fim, setFim] = useState<string>(() => hojeISO());

  // dados
  const [loading, setLoading] = useState(false);
  const [comandas, setComandas] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);

  async function loadEmpresa() {
    setErro("");
    const { data, error } = await supabase
      .from("ae_empresas")
      .select("id")
      .eq("slug", EMPRESA_SLUG)
      .single();

    if (error || !data?.id) {
      setErro("Empresa não cadastrada (ae_empresas). Crie o slug 'ninhocar'.");
      return;
    }
    setEmpresaId(data.id);
  }

  async function carregar() {
    if (!empresaId) return;

    setLoading(true);
    setErro("");

    // intervalo [ini 00:00, fim+1 00:00)
    const start = ini + "T00:00:00";
    const end = addDiasISO(fim, 1) + "T00:00:00";

    try {
      // 1) comandas fechadas no período
      const { data: c, error: e1 } = await supabase
        .from("ae_comandas")
        .select("id,numero,status,total,created_at,closed_at,observacao,cliente_nome,cliente_whatsapp")
        .eq("empresa_id", empresaId)
        .eq("status", "fechada")
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: false });

      if (e1) throw e1;

      const ids = (c || []).map((x: any) => x.id);

      // 2) pagamentos dessas comandas (pra somar por forma)
      let p: any[] = [];
      if (ids.length) {
        const { data: p2, error: e2 } = await supabase
          .from("ae_pagamentos")
          .select("id,comanda_id,forma,valor,status,created_at")
          .in("comanda_id", ids);

        if (e2) throw e2;
        p = p2 || [];
      }

      setComandas(c || []);
      setPagamentos(p);
    } catch (e: any) {
      console.error(e);
      setErro(e?.message || "Erro ao carregar relatório");
      setComandas([]);
      setPagamentos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmpresa();
  }, []);

  useEffect(() => {
    if (empresaId) carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const resumo = useMemo(() => {
    const qtd = comandas.length;
    const total = comandas.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
    const ticket = qtd ? total / qtd : 0;
    return { qtd, total, ticket };
  }, [comandas]);

  const porForma = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of pagamentos) {
      if (p.status && p.status !== "confirmado") continue;
      const k = String(p.forma || "outros").toLowerCase();
      map[k] = (map[k] || 0) + (Number(p.valor) || 0);
    }
    const ordem = ["dinheiro", "pix", "debito", "credito", "outros"];
    return ordem
      .filter((k) => map[k] != null)
      .map((k) => ({ forma: k, valor: map[k] || 0 }));
  }, [pagamentos]);

  if (erro) {
    return (
      <div className="p-6">
        <div className="max-w-xl bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="font-semibold mb-2">Relatórios</div>
          <div className="text-sm text-red-300">{erro}</div>
        </div>
      </div>
    );
  }

  if (!empresaId) return <div className="p-6 text-slate-200">Carregando…</div>;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-bold">Relatórios de Vendas</div>
          <div className="text-xs text-slate-400">Ninho Car · ERP</div>
        </div>

        <div className="flex gap-2">
          <div>
            <div className="text-xs text-slate-400">Início</div>
            <input
              type="date"
              className="border border-slate-700 bg-slate-950/60 rounded px-3 py-2 text-slate-100"
              value={ini}
              onChange={(e) => setIni(e.target.value)}
            />
          </div>

          <div>
            <div className="text-xs text-slate-400">Fim</div>
            <input
              type="date"
              className="border border-slate-700 bg-slate-950/60 rounded px-3 py-2 text-slate-100"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
            />
          </div>

          <button
            onClick={carregar}
            className="self-end bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg"
            disabled={loading}
          >
            {loading ? "Carregando…" : "Aplicar"}
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Total vendido</div>
          <div className="text-2xl font-bold">{brl(resumo.total)}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Vendas</div>
          <div className="text-2xl font-bold">{resumo.qtd}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Ticket médio</div>
          <div className="text-2xl font-bold">{brl(resumo.ticket)}</div>
        </div>
      </div>

      {/* Por forma */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="font-semibold">Por forma de pagamento</div>
          <div className="text-xs text-slate-400">{porForma.length} tipo(s)</div>
        </div>

        {porForma.length === 0 ? (
          <div className="p-4 text-sm text-slate-400">Sem pagamentos no período.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {porForma.map((x) => (
              <div key={x.forma} className="px-4 py-3 flex items-center justify-between">
                <div className="text-sm text-slate-200">{x.forma.toUpperCase()}</div>
                <div className="text-sm font-semibold text-slate-100">{brl(x.valor)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de vendas */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="font-semibold">Vendas (comandas fechadas)</div>
          <div className="text-xs text-slate-400">{comandas.length} registro(s)</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/40">
              <tr className="border-b border-slate-800 text-slate-300">
                <th className="p-3 text-left font-medium">Comanda</th>
                <th className="p-3 text-left font-medium">Data</th>
                <th className="p-3 text-left font-medium">Cliente</th>
                <th className="p-3 text-right font-medium">Total</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {comandas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-slate-400">
                    Nenhuma venda no período selecionado.
                  </td>
                </tr>
              ) : (
                comandas.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-semibold text-slate-100">#{c.numero}</div>
                      <div className="text-xs text-slate-400">{c.status}</div>
                    </td>
                    <td className="p-3 text-slate-200">
                      {new Date(c.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3 text-slate-200">
                      {c.cliente_nome || "—"}
                      <div className="text-xs text-slate-400">{c.cliente_whatsapp || ""}</div>
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-100">{brl(c.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        * Período considera a data de criação da comanda. Se quiser, trocamos para “data de fechamento”.
      </div>
    </div>
  );
}
