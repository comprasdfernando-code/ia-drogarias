"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EditarProduto() {
  const params = useParams();
  const router = useRouter();

  // ✅ blindado: id pode vir string | string[]
  const idParam = (params as any)?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function load() {
      try {
        setLoading(true);
        setErro(null);
        setOk(null);

        if (!id) throw new Error("ID não veio na URL. Verifique a rota /fv/admin/produtos/[id].");

        const { data, error } = await supabase
          .from("fv_produtos")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("Produto não encontrado para esse ID.");

        if (!cancelado) setP(data);
      } catch (e: any) {
        if (!cancelado) {
          console.error(e);
          setErro(e?.message || "Erro ao carregar produto.");
          setP(null);
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    load();
    return () => {
      cancelado = true;
    };
  }, [id]);

  async function salvar() {
    try {
      setSaving(true);
      setErro(null);
      setOk(null);

      if (!id) throw new Error("ID inválido.");

      // ✅ validação básica de promo
      const pmc = p?.pmc ?? null;
      const promo = p?.preco_promocional ?? null;

      if (p?.em_promocao) {
        if (promo === null || promo === undefined || Number(promo) <= 0) {
          throw new Error("Informe o Preço promocional (maior que 0) para ativar promoção.");
        }
        if (pmc && Number(promo) >= Number(pmc)) {
          throw new Error("Preço promocional precisa ser menor que o PMC.");
        }
      }

      const { error } = await supabase
        .from("fv_produtos")
        .update({
          pmc: p.pmc,
          em_promocao: p.em_promocao,
          preco_promocional: p.em_promocao ? p.preco_promocional : null, // ✅ zera se não for promo
          ativo: p.ativo,
          destaque_home: p.destaque_home,
          imagens: p.imagens,
        })
        .eq("id", id);

      if (error) throw error;

      setOk("Salvo com sucesso!");
      router.push("/fv/admin/produtos");
    } catch (e: any) {
      console.error(e);
      setErro(e?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6">Carregando…</p>;

  if (erro) {
    return (
      <div className="p-6">
        <p className="text-red-600 font-semibold">❌ {erro}</p>
        <button
          onClick={() => router.push("/fv/admin/produtos")}
          className="mt-4 px-4 py-2 bg-blue-700 text-white rounded"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Produto não encontrado.</p>
        <button
          onClick={() => router.push("/fv/admin/produtos")}
          className="mt-4 px-4 py-2 bg-blue-700 text-white rounded"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <main className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow">
      <h1 className="text-xl font-bold text-blue-800 mb-4">Editar Produto</h1>

      <div className="text-sm text-gray-500 mb-4">
        {p.nome} <br />
        EAN: {p.ean}
      </div>

      <label className="block mb-2">
        PMC
        <input
          type="number"
          step="0.01"
          value={p.pmc ?? ""}
          onChange={(e) => setP({ ...p, pmc: e.target.value === "" ? null : Number(e.target.value) })}
          className="w-full border rounded px-3 py-2"
        />
      </label>

      <label className="block mb-2">
        <input
          type="checkbox"
          checked={p.em_promocao ?? false}
          onChange={(e) => setP({ ...p, em_promocao: e.target.checked })}
        />{" "}
        Em promoção
      </label>

      {p.em_promocao && (
        <label className="block mb-2">
          Preço promocional
          <input
            type="number"
            step="0.01"
            value={p.preco_promocional ?? ""}
            onChange={(e) =>
              setP({
                ...p,
                preco_promocional: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="w-full border rounded px-3 py-2"
          />
          <div className="text-xs text-gray-500 mt-1">
            Dica: o preço promocional precisa ser menor que o PMC.
          </div>
        </label>
      )}

      <label className="block mb-2">
        <input
          type="checkbox"
          checked={p.destaque_home ?? false}
          onChange={(e) => setP({ ...p, destaque_home: e.target.checked })}
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

      {ok && <p className="text-green-700 text-sm mb-3">✅ {ok}</p>}

      <button
        onClick={salvar}
        disabled={saving}
        className="w-full bg-blue-700 disabled:opacity-60 text-white py-3 rounded-lg font-semibold hover:bg-blue-800"
      >
        {saving ? "Salvando..." : "Salvar alterações"}
      </button>
    </main>
  );
}
