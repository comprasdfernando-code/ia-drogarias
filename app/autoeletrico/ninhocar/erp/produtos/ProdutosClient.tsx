"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProdutosTable from "./components/ProdutosTable";
import ProdutoFormModal from "./components/ProdutoFormModal";
import EstoqueAjusteModal from "./components/EstoqueAjusteModal";

export default function ProdutosClient() {
  const empresaId = "UUID_DA_EMPRESA"; // depois vem do contexto/login
  const [lista, setLista] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const [ajuste, setAjuste] = useState<any>(null);

  async function carregar() {
    const { data } = await supabase
      .from("ae_produtos")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("nome");

    setLista(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Produtos / Serviços</h1>

        <button
          onClick={() => setEdit({ empresa_id: empresaId })}
          className="bg-slate-800 text-white px-4 py-2 rounded"
        >
          + Novo
        </button>
      </div>

      <ProdutosTable
        lista={lista}
        onEdit={setEdit}
        onAjuste={setAjuste}
      />

      {edit && (
        <ProdutoFormModal
          produto={edit}
          onClose={() => setEdit(null)}
          onSave={carregar}
        />
      )}

      {ajuste && (
        <EstoqueAjusteModal
          produto={ajuste}
          onClose={() => setAjuste(null)}
          onSave={carregar}
        />
      )}
    </div>
  );
}
