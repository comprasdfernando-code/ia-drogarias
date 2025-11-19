"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default function ExcluirFaturamento() {
  const router = useRouter();
  const { id } = useParams();

  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("finance_faturamento")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setMsg("Dados não encontrados.");
        setLoading(false);
        return;
      }

      setDados(data);
      setLoading(false);
    }

    load();
  }, [id]);

  async function excluir() {
    setLoading(true);

    const { error } = await supabase
      .from("finance_faturamento")
      .delete()
      .eq("id", id);

    setLoading(false);

    if (error) {
      setMsg("Erro ao excluir.");
      return;
    }

    setMsg("Excluído com sucesso!");

    setTimeout(() => {
      router.push("/financeiro/admin/faturamento");
    }, 800);
  }

  if (loading)
    return <p className="p-4 text-slate-300">Carregando...</p>;

  if (!dados)
    return <p className="p-4 text-red-400">Registro não encontrado.</p>;

  const real = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="px-4 md:px-10 py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Excluir Faturamento</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {msg && <p className="text-emerald-400">{msg}</p>}

          <p className="text-slate-300">
            Tem certeza que deseja excluir este lançamento?
          </p>

          <div className="bg-zinc-900 p-4 rounded border border-zinc-700 space-y-2">
            <p>
              <strong>Competência:</strong> {dados.competencia}
            </p>
            <p>
              <strong>NF:</strong> {dados.numero_nf}
            </p>
            <p>
              <strong>Data Emissão:</strong> {dados.data_emissao}
            </p>
            <p>
              <strong>Valor Líquido:</strong>{" "}
              {real(Number(dados.valor_liquido))}
            </p>
          </div>

          <button
            onClick={excluir}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Excluindo..." : "Excluir"}
          </button>

          <button
            onClick={() => router.back()}
            className="ml-3 text-slate-300 hover:underline"
          >
            Cancelar
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
