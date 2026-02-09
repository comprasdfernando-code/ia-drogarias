"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProdutoFormModal({ produto, onClose, onSave }: any) {
  const [form, setForm] = useState<any>({
    nome: produto.nome || "",
    tipo: produto.tipo || "produto",
    preco: produto.preco || 0,
    custo: produto.custo || 0,
    controla_estoque: produto.controla_estoque ?? true,
    ativo: produto.ativo ?? true,
    empresa_id: produto.empresa_id,
  });

  async function salvar() {
    if (produto.id) {
      await supabase
        .from("ae_produtos")
        .update(form)
        .eq("id", produto.id);
    } else {
      await supabase.from("ae_produtos").insert(form);
    }

    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-96 space-y-3">
        <h2 className="font-bold">
          {produto.id ? "Editar Produto" : "Novo Produto"}
        </h2>

        <input
          className="border p-2 w-full"
          placeholder="Nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />

        <select
          className="border p-2 w-full"
          value={form.tipo}
          onChange={(e) =>
            setForm({ ...form, tipo: e.target.value, controla_estoque: e.target.value === "produto" })
          }
        >
          <option value="produto">Produto</option>
          <option value="servico">Serviço</option>
        </select>

        <input
          type="number"
          className="border p-2 w-full"
          placeholder="Preço"
          value={form.preco}
          onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })}
        />

        {form.tipo === "produto" && (
          <>
            <input
              type="number"
              className="border p-2 w-full"
              placeholder="Custo"
              value={form.custo}
              onChange={(e) => setForm({ ...form, custo: Number(e.target.value) })}
            />
          </>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancelar</button>
          <button
            onClick={salvar}
            className="bg-slate-800 text-white px-4 py-2 rounded"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
