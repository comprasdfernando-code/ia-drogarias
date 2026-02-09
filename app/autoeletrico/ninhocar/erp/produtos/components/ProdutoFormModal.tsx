"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Produto = {
  id?: string;
  empresa_id: string;

  nome?: string;
  tipo?: "produto" | "servico";
  ean?: string | null;
  sku?: string | null;

  preco?: number;
  custo?: number;

  controla_estoque?: boolean;
  ativo?: boolean;
};

export default function ProdutoFormModal({
  produto,
  onClose,
  onSave,
}: {
  produto: Produto;
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!produto.id;

  const [form, setForm] = useState<Produto>({
    empresa_id: produto.empresa_id,

    nome: produto.nome ?? "",
    tipo: (produto.tipo as any) ?? "produto",
    ean: produto.ean ?? "",
    sku: produto.sku ?? "",

    preco: Number(produto.preco ?? 0),
    custo: Number(produto.custo ?? 0),

    controla_estoque: produto.controla_estoque ?? true,
    ativo: produto.ativo ?? true,
  });

  const isProduto = useMemo(() => form.tipo === "produto", [form.tipo]);

  async function salvar() {
    const payload: any = {
      empresa_id: form.empresa_id,
      nome: (form.nome || "").trim(),
      tipo: form.tipo,
      ean: (form.ean || "").trim() || null,

      preco: Number(form.preco || 0),
      custo: Number(form.custo || 0),

      controla_estoque: form.tipo === "produto",
      ativo: !!form.ativo,
    };

    if (!payload.nome) return;

    if (isEdit) {
      const { error } = await supabase.from("ae_produtos").update(payload).eq("id", produto.id);
      if (error) {
        alert(error.message);
        return;
      }
    } else {
      // SKU é gerado no trigger; se você quiser permitir informar, adicione sku aqui
      const { error } = await supabase.from("ae_produtos").insert(payload);
      if (error) {
        alert(error.message);
        return;
      }
    }

    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Fechar"
      />

      {/* modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
          <div className="p-5 border-b border-slate-200">
            <div className="text-lg font-semibold text-slate-900">
              {isEdit ? "Editar Produto/Serviço" : "Novo Produto/Serviço"}
            </div>
            <div className="text-xs text-slate-500">
              Preencha os dados abaixo e clique em salvar.
            </div>
          </div>

          <div className="p-5 space-y-4 text-slate-900">
            {/* Nome */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome</label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Ex: Lâmpada H4 / Diagnóstico elétrico"
                value={form.nome as any}
                onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                value={form.tipo as any}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    tipo: e.target.value as any,
                    controla_estoque: e.target.value === "produto",
                  }))
                }
              >
                <option value="produto">Produto</option>
                <option value="servico">Serviço</option>
              </select>
            </div>

            {/* EAN / SKU */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">EAN (opcional)</label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Código de barras"
                  value={(form.ean ?? "") as any}
                  onChange={(e) => setForm((s) => ({ ...s, ean: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">SKU (interno)</label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-600 outline-none"
                  value={form.sku ? String(form.sku) : isEdit ? "" : "Será gerado ao salvar"}
                  disabled
                />
              </div>
            </div>

            {/* Preço / Custo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Preço</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-300"
                  value={Number(form.preco || 0)}
                  onChange={(e) => setForm((s) => ({ ...s, preco: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Custo {isProduto ? "" : "(opcional)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={!isProduto}
                  className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300 ${
                    isProduto
                      ? "border border-slate-300 bg-white text-slate-900"
                      : "border border-slate-200 bg-slate-100 text-slate-500"
                  }`}
                  value={Number(form.custo || 0)}
                  onChange={(e) => setForm((s) => ({ ...s, custo: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Ativo */}
            <div className="flex items-center justify-between border border-slate-200 rounded-lg p-3">
              <div>
                <div className="text-sm font-medium text-slate-900">Ativo</div>
                <div className="text-xs text-slate-500">Aparece na busca de vendas</div>
              </div>

              <input
                type="checkbox"
                className="h-5 w-5"
                checked={!!form.ativo}
                onChange={(e) => setForm((s) => ({ ...s, ativo: e.target.checked }))}
              />
            </div>
          </div>

          <div className="p-5 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              onClick={salvar}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
