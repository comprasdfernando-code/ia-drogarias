"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminEditarProduto() {
  const params = useParams();
  const router = useRouter();

  const idParam = (params as any)?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const [p, setP] = useState<any>(null);
  const [pmc, setPmc] = useState<string>("");
  const [emPromo, setEmPromo] = useState<boolean>(false);
  const [home, setHome] = useState<boolean>(false);
  const [ativo, setAtivo] = useState<boolean>(true);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function load() {
      try {
        setLoading(true);
        setErro(null);

        if (!id) throw new Error("ID não veio na URL (rota/Link incorreto).");

        const { data, error } = await supabase
          .from("fv_produtos")
          .select("id,ean,nome,pmc,em_promocao,destaque_home,ativo")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;

        if (!data) throw new Error("Produto não encontrado para esse ID.");

        if (!cancelado) {
          setP(data);
          setPmc(String(data.pmc ?? ""));
          setEmPromo(!!data.em_promocao);
          setHome(!!data.destaque_home);
          setAtivo(!!data.ativo);
        }
      } catch (e: any) {
        if (!cancelado) setErro(e?.message || "Erro ao carregar produto.");
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
      setLoading(true);
      setErro(null);

      if (!id) throw new Error("ID inválido.");

      const pmcNum = pmc === "" ? null : Number(String(pmc).replace(",", "."));
      if (pmcNum !== null && Number.isNaN(pmcNum)) {
        throw new Error("PMC inválido (use número).");
      }

      const { error } = await supabase
        .from("fv_produtos")
        .update({
          pmc: pmcNum,
          em_promocao: emPromo,
          destaque_home: home,
          ativo: ativo,
        })
        .eq("id", id);

      if (error) throw error;

      router.push("/fv/admin/produtos");
    } catch (e: any) {
      setErro(e?.message || "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">Carregando…</div>;

  if (erro) {
    return (
      <div className="p-6">
        <p className="text-red-600 font-semibold">❌ {erro}</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-700 text-white rounded"
          onClick={() => router.push("/fv/admin/produtos")}
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Editar Produto</h1>

      <p className="text-sm text-gray-600">{p?.nome}</p>
      <p className="text-sm text-gray-600 mb-4">EAN: {p?.ean}</p>

      <label className="block text-sm font-medium mb-1">PMC</label>
      <input
        value={pmc}
        onChange={(e) => setPmc(e.target.value)}
        className="w-full border rounded p-2 mb-3"
        placeholder="Ex: 45,65"
      />

      <label className="flex items-center gap-2 mb-2">
        <input type="checkbox" checked={emPromo} onChange={(e) => setEmPromo(e.target.checked)} />
        Em promoção
      </label>

      <label className="flex items-center gap-2 mb-2">
        <input type="checkbox" checked={home} onChange={(e) => setHome(e.target.checked)} />
        Destaque na Home
      </label>

      <label className="flex items-center gap-2 mb-4">
        <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
        Produto ativo
      </label>

      <button
        onClick={salvar}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded py-3 font-semibold"
      >
        Salvar alterações
      </button>
    </main>
  );
}
