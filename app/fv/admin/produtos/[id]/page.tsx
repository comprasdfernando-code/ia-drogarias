"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EditarProduto() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("fv_produtos")
        .select("*")
        .eq("id", id)
        .single();
      setP(data);
      setLoading(false);
    }
    load();
  }, [id]);

  async function salvar() {
    await supabase
      .from("fv_produtos")
      .update({
        pmc: p.pmc,
        em_promocao: p.em_promocao,
        preco_promocional: p.preco_promocional,
        ativo: p.ativo,
        destaque_home: p.destaque_home,
        imagens: p.imagens,
      })
      .eq("id", id);

    router.push("/fv/admin/produtos");
  }

  if (loading || !p) return <p className="p-6">Carregando…</p>;

  return (
    <main className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow">
      <h1 className="text-xl font-bold text-blue-800 mb-4">
        Editar Produto
      </h1>

      <div className="text-sm text-gray-500 mb-4">
        {p.nome} <br />
        EAN: {p.ean}
      </div>

      <label className="block mb-2">
        PMC
        <input
          type="number"
          value={p.pmc ?? ""}
          onChange={(e) => setP({ ...p, pmc: Number(e.target.value) })}
          className="w-full border rounded px-3 py-2"
        />
      </label>

      <label className="block mb-2">
        <input
          type="checkbox"
          checked={p.em_promocao ?? false}
          onChange={(e) =>
            setP({ ...p, em_promocao: e.target.checked })
          }
        />{" "}
        Em promoção
      </label>

      {p.em_promocao && (
        <label className="block mb-2">
          Preço promocional
          <input
            type="number"
            value={p.preco_promocional ?? ""}
            onChange={(e) =>
              setP({ ...p, preco_promocional: Number(e.target.value) })
            }
            className="w-full border rounded px-3 py-2"
          />
        </label>
      )}

      <label className="block mb-2">
        <input
          type="checkbox"
          checked={p.destaque_home ?? false}
          onChange={(e) =>
            setP({ ...p, destaque_home: e.target.checked })
          }
        />{" "}
        Destaque na Home
      </label>

      <label className="block mb-4">
        <input
          type="checkbox"
          checked={p.ativo ?? false}
          onChange={(e) => setP({ ...p, ativo: e.target.checked })}
        />{" "}
        Produto ativo
      </label>

      <button
        onClick={salvar}
        className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800"
      >
        Salvar alterações
      </button>
    </main>
  );
}
