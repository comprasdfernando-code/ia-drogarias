"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ProdutoPage() {
  const params = useParams();
  const eanParam = params?.ean; // pode vir string ou string[]
  const ean = Array.isArray(eanParam) ? eanParam[0] : eanParam;
  const eanClean = String(ean || "").replace(/\D/g, "");

  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function load() {
      try {
        setLoading(true);
        setErro(null);

        if (!eanClean) {
          throw new Error("EAN inválido na URL.");
        }

        const { data, error } = await supabase
          .from("fv_produtos")
          .select("*")
          .eq("ean", eanClean)
          .limit(1);

        if (error) throw error;

        const item = data?.[0] ?? null;

        if (!cancelado) {
          setP(item);
          if (!item) setErro("Produto não encontrado (EAN não existe na base).");
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
  }, [eanClean]);

  if (loading) return <p className="p-6">Carregando produto…</p>;

  if (erro) return <p className="p-6 text-red-600">❌ {erro}</p>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">{p.nome}</h1>
      <p className="text-sm text-gray-600">EAN: {p.ean}</p>
      <p className="text-sm text-gray-600">Laboratório: {p.laboratorio}</p>
    </main>
  );
}
