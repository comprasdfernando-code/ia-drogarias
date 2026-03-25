"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import InventarioShell from "./_components/InventarioShell";
import ResumoCards from "./_components/ResumoCards";
import StatusBadge from "./_components/StatusBadge";
import type { Inventario } from "@/types/inventario";

type InventarioComResumo = Inventario & {
  itens_total?: number;
  divergentes_total?: number;
};

export default function InventarioHomePage() {
  const [inventarios, setInventarios] = useState<InventarioComResumo[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    setLoading(true);

    const { data, error } = await supabase
      .from("inventarios")
      .select("*")
      .eq("loja_slug", "drogariaredefabiano")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const ids = (data || []).map((i) => i.id);
    const countsMap: Record<string, { total: number; divergentes: number }> = {};

    if (ids.length > 0) {
      const { data: itens, error: itensError } = await supabase
        .from("inventario_itens")
        .select("inventario_id, status")
        .in("inventario_id", ids);

      if (itensError) {
        console.error(itensError);
      }

      for (const item of itens || []) {
        if (!countsMap[item.inventario_id]) {
          countsMap[item.inventario_id] = { total: 0, divergentes: 0 };
        }

        countsMap[item.inventario_id].total += 1;
        if (item.status === "divergente") {
          countsMap[item.inventario_id].divergentes += 1;
        }
      }
    }

    const merged = (data || []).map((inv) => ({
      ...inv,
      itens_total: countsMap[inv.id]?.total || 0,
      divergentes_total: countsMap[inv.id]?.divergentes || 0,
    }));

    setInventarios(merged);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    const abertos = inventarios.filter(
      (i) => i.status === "aberto" || i.status === "em_contagem"
    ).length;

    const finalizados = inventarios.filter((i) => i.status === "finalizado").length;

    const divergencias = inventarios.reduce(
      (acc, item) => acc + (item.divergentes_total || 0),
      0
    );

    const itensHistorico = inventarios.reduce(
      (acc, item) => acc + (item.itens_total || 0),
      0
    );

    return {
      abertos,
      finalizados,
      divergencias,
      itensHistorico,
    };
  }, [inventarios]);

  return (
    <InventarioShell
      title="Inventário de Controlados e Antibióticos"
      subtitle="Contagem por armário, prateleira, gaveta ou local"
      right={
        <Link
          href="/inventario/novo"
          className="inline-flex rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          + Novo inventário
        </Link>
      }
    >
      <ResumoCards
        cards={[
          { label: "Inventários abertos", value: resumo.abertos },
          { label: "Inventários finalizados", value: resumo.finalizados },
          { label: "Divergências", value: resumo.divergencias },
          { label: "Itens no histórico", value: resumo.itensHistorico },
        ]}
      />

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 md:p-5">
          <h2 className="text-lg font-bold text-slate-900">Inventários recentes</h2>
          <p className="text-sm text-slate-500">Últimos inventários da loja</p>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-slate-500">Carregando...</div>
        ) : inventarios.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">
            Nenhum inventário encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Local</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Itens</th>
                  <th className="px-4 py-3">Divergências</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {inventarios.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      {new Date(inv.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 capitalize">{inv.tipo}</td>
                    <td className="px-4 py-3">{inv.local_nome || "-"}</td>
                    <td className="px-4 py-3">{inv.responsavel_nome || "-"}</td>
                    <td className="px-4 py-3">{inv.itens_total || 0}</td>
                    <td className="px-4 py-3">{inv.divergentes_total || 0}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/inventario/${inv.id}`}
                        className="font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </InventarioShell>
  );
}