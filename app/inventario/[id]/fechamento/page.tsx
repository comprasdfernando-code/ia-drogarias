"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import InventarioShell from "../../_components/InventarioShell";
import ResumoCards from "../../_components/ResumoCards";
import type { Inventario, InventarioItem } from "@/types/inventario";

function isVencido(validade?: string | null) {
  if (!validade) return false;
  return new Date(validade).getTime() < new Date().setHours(0, 0, 0, 0);
}

function isVencendo(validade?: string | null) {
  if (!validade) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const v = new Date(validade);
  const limite = new Date();
  limite.setHours(0, 0, 0, 0);
  limite.setDate(limite.getDate() + 30);

  return v >= hoje && v <= limite;
}

export default function FechamentoInventarioPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [inventario, setInventario] = useState<Inventario | null>(null);
  const [itens, setItens] = useState<InventarioItem[]>([]);
  const [observacaoFinal, setObservacaoFinal] = useState("");
  const [loading, setLoading] = useState(true);
  const [finalizando, setFinalizando] = useState(false);

  async function carregar() {
    setLoading(true);

    const { data: inv, error: invError } = await supabase
      .from("inventarios")
      .select("*")
      .eq("id", id)
      .single();

    if (invError) {
      console.error(invError);
      setLoading(false);
      return;
    }

    const { data: itensData, error: itensError } = await supabase
      .from("inventario_itens")
      .select("*")
      .eq("inventario_id", id)
      .order("produto_nome", { ascending: true });

    if (itensError) {
      console.error(itensError);
    }

    setInventario(inv);
    setItens((itensData || []) as InventarioItem[]);
    setObservacaoFinal(inv?.observacoes || "");
    setLoading(false);
  }

  useEffect(() => {
    if (id) carregar();
  }, [id]);

  const resumo = useMemo(() => {
    const total = itens.length;
    const contados = itens.filter((i) => i.status !== "pendente").length;
    const divergentes = itens.filter((i) => i.status === "divergente").length;
    const faltas = itens.filter((i) => Number(i.diferenca) < 0).length;
    const sobras = itens.filter((i) => Number(i.diferenca) > 0).length;
    const naoEncontrados = itens.filter((i) => i.status === "nao_encontrado").length;
    const vencidos = itens.filter((i) => isVencido(i.validade)).length;
    const vencendo = itens.filter((i) => isVencendo(i.validade)).length;

    return {
      total,
      contados,
      divergentes,
      faltas,
      sobras,
      naoEncontrados,
      vencidos,
      vencendo,
    };
  }, [itens]);

  async function finalizar() {
    try {
      setFinalizando(true);

      const { error } = await supabase
        .from("inventarios")
        .update({
          status: "finalizado",
          finalizado_em: new Date().toISOString(),
          observacoes: observacaoFinal || null,
        })
        .eq("id", id);

      if (error) throw error;

      router.push("/inventario");
    } catch (error) {
      console.error(error);
      alert("Erro ao finalizar inventário");
    } finally {
      setFinalizando(false);
    }
  }

  if (loading || !inventario) {
    return (
      <InventarioShell title="Fechamento do inventário">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          Carregando...
        </div>
      </InventarioShell>
    );
  }

  const divergentes = itens.filter(
    (item) => item.status === "divergente" || item.status === "nao_encontrado"
  );

  return (
    <InventarioShell
      title="Fechamento do inventário"
      subtitle={`${inventario.tipo} • ${inventario.local_nome || "Sem local"} • ${
        inventario.responsavel_nome || "Sem responsável"
      }`}
    >
      <ResumoCards
        cards={[
          { label: "Itens totais", value: resumo.total },
          { label: "Conferidos", value: resumo.contados },
          { label: "Divergentes", value: resumo.divergentes },
          { label: "Não encontrados", value: resumo.naoEncontrados },
        ]}
      />

      <ResumoCards
        cards={[
          { label: "Faltas", value: resumo.faltas },
          { label: "Sobras", value: resumo.sobras },
          { label: "Vencidos", value: resumo.vencidos },
          { label: "Vencendo 30 dias", value: resumo.vencendo },
        ]}
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Observação final</h2>

        <textarea
          value={observacaoFinal}
          onChange={(e) => setObservacaoFinal(e.target.value)}
          rows={5}
          placeholder="Resumo do fechamento, divergências relevantes, itens vencidos, observações da conferência..."
          className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Divergências encontradas</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-3 pr-4">Produto</th>
                <th className="py-3 pr-4">Sistema</th>
                <th className="py-3 pr-4">Contado</th>
                <th className="py-3 pr-4">Diferença</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {divergentes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Nenhuma divergência encontrada
                  </td>
                </tr>
              ) : (
                divergentes.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4">{item.produto_nome}</td>
                    <td className="py-3 pr-4">{Number(item.quantidade_sistema)}</td>
                    <td className="py-3 pr-4">{item.quantidade_contada ?? "-"}</td>
                    <td className="py-3 pr-4">{Number(item.diferenca)}</td>
                    <td className="py-3 pr-4">{item.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={finalizar}
          disabled={finalizando}
          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
        >
          {finalizando ? "Finalizando..." : "Confirmar fechamento"}
        </button>
      </div>
    </InventarioShell>
  );
}