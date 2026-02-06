"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AgendaItem = {
  id: string;
  tipo: "entrada" | "saida";
  titulo: string;
  origem: string | null;
  categoria: string;
  valor: number;
  dia_mes: number;
  inicio: string;
  fim: string | null;
  ativo: boolean;
};

function brl(v: any) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CalendarioFinanceiro() {
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const ano = now.getFullYear();
  const mes = now.getMonth();

  async function carregar() {
    setLoading(true);

    const inicioMes = new Date(ano, mes, 1);
    const fimMes = new Date(ano, mes + 1, 0);

    const { data, error } = await supabase.from("finance_agenda").select("*").eq("ativo", true);

    if (!error && data) {
      const filtrado = (data as any[]).filter((i) => {
        const ini = new Date(i.inicio);
        const fim = i.fim ? new Date(i.fim) : null;
        return ini <= fimMes && (!fim || fim >= inicioMes);
      });

      setAgenda(filtrado as AgendaItem[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const porDia = useMemo(() => {
    const map = new Map<number, AgendaItem[]>();
    agenda.forEach((i) => {
      map.set(i.dia_mes, [...(map.get(i.dia_mes) || []), i]);
    });
    return map;
  }, [agenda]);

  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  const totalDia = (dia: number) => {
    const items = porDia.get(dia) || [];
    const entradas = items.filter((i) => i.tipo === "entrada").reduce((a, i) => a + Number(i.valor || 0), 0);
    const saidas = items.filter((i) => i.tipo === "saida").reduce((a, i) => a + Number(i.valor || 0), 0);
    return { entradas, saidas, saldo: entradas - saidas };
  };

  if (loading) return <p className="text-white p-4">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="bg-[#112240] border border-cyan-500/20 shadow-md rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-cyan-300">Calendário do Mês</h2>
        <p className="text-slate-400 text-sm mt-1">Tudo que entra e sai por dia (visão do Fer)</p>
      </div>

      <div className="bg-[#0D1B2A] border border-cyan-500/20 rounded-2xl p-6 shadow">
        <table className="w-full text-left text-white">
          <thead className="text-cyan-400 border-b border-cyan-500/20">
            <tr>
              <th className="py-2 w-20">Dia</th>
              <th className="py-2">Eventos</th>
              <th className="py-2 w-40">Entradas</th>
              <th className="py-2 w-40">Saídas</th>
              <th className="py-2 w-40">Saldo do dia</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: diasNoMes }, (_, idx) => idx + 1).map((dia) => {
              const items = (porDia.get(dia) || []).sort((a, b) => (a.tipo > b.tipo ? 1 : -1));
              const t = totalDia(dia);

              return (
                <tr key={dia} className="border-b border-cyan-500/10 align-top">
                  <td className="py-3 font-semibold">{String(dia).padStart(2, "0")}</td>
                  <td className="py-3">
                    {items.length === 0 ? (
                      <span className="text-slate-500">—</span>
                    ) : (
                      <div className="space-y-2">
                        {items.map((i) => (
                          <div key={i.id} className="flex items-center justify-between gap-4">
                            <div>
                              <div className="text-sm font-medium">
                                {i.titulo}
                                <span className="text-xs text-slate-400"> • {i.categoria}</span>
                              </div>
                              <div className="text-xs text-slate-500">{i.origem ?? "—"}</div>
                            </div>
                            <div className={`${i.tipo === "entrada" ? "text-emerald-300" : "text-amber-300"} font-semibold`}>
                              {i.tipo === "entrada" ? "+" : "-"} {brl(i.valor)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-emerald-300 font-semibold">{t.entradas ? brl(t.entradas) : "—"}</td>
                  <td className="py-3 text-amber-300 font-semibold">{t.saidas ? brl(t.saidas) : "—"}</td>
                  <td className={`py-3 font-semibold ${t.saldo >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                    {t.entradas || t.saidas ? brl(t.saldo) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
