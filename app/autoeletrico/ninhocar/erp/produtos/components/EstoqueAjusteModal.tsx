"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function EstoqueAjusteModal({
  produto,
  onClose,
  onSave,
}: {
  produto: any;
  onClose: () => void;
  onSave: () => void;
}) {
  const [qtd, setQtd] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function ajustar() {
    setErro("");
    setLoading(true);

    try {
      // registra movimento (auditoria)
      const { error: e1 } = await supabase.from("ae_estoque_movs").insert({
        empresa_id: produto.empresa_id,
        produto_id: produto.id,
        origem: "ajuste",
        tipo: qtd >= 0 ? "entrada" : "saida",
        quantidade: Math.abs(Number(qtd || 0)),
        custo_unit: Number(produto.custo || 0),
      });

      if (e1) throw e1;

      // atualiza estoque no produto
      const novo = Number(produto.estoque_atual || 0) + Number(qtd || 0);

      const { error: e2 } = await supabase
        .from("ae_produtos")
        .update({ estoque_atual: novo })
        .eq("id", produto.id);

      if (e2) throw e2;

      onSave();
      onClose();
    } catch (e: any) {
      console.error(e);
      setErro(e?.message || "Erro ao ajustar estoque");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay (fecha clicando fora) */}
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Fechar"
      />

      {/* modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200">
          <div className="p-5 border-b border-slate-200">
            <div className="text-lg font-semibold text-slate-900">Ajustar Estoque</div>
            <div className="text-xs text-slate-500">
              Use <b>positivo</b> para entrada e <b>negativo</b> para saída.
            </div>
          </div>

          <div className="p-5 space-y-3 text-slate-900">
            <div className="text-sm">
              <div className="text-slate-700">Produto</div>
              <div className="font-medium">{produto?.nome}</div>
            </div>

            <div className="text-sm">
              <span className="text-slate-700">Atual: </span>
              <span className="font-semibold">{Number(produto?.estoque_atual || 0)}</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ajuste (ex: 5 / -2)
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-300"
                value={qtd}
                onChange={(e) => setQtd(Number(e.target.value))}
              />
            </div>

            <div className="text-xs text-slate-500">
              Novo estoque:{" "}
              <b className="text-slate-900">
                {Number(produto?.estoque_atual || 0) + Number(qtd || 0)}
              </b>
            </div>

            {erro && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                {erro}
              </div>
            )}
          </div>

          <div className="p-5 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
              onClick={ajustar}
              disabled={loading}
            >
              {loading ? "Salvando…" : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
