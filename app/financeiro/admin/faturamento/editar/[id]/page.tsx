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

export default function EditarFaturamento() {
  const router = useRouter();
  const { id } = useParams();

  // Estados do formulário
  const [competencia, setCompetencia] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [numeroNF, setNumeroNF] = useState("");
  const [valorBruto, setValorBruto] = useState("");
  const [deducoes, setDeducoes] = useState("");
  const [valorLiquido, setValorLiquido] = useState("0");

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // Cálculo automático
  const calcularLiquido = (bruto: string, ded: string) => {
    const b = Number(bruto.replace(",", "."));
    const d = Number(ded.replace(",", "."));
    if (isNaN(b) || isNaN(d)) return "0";
    return (b - d).toFixed(2);
  };

  const handleCalculo = (bruto: string, ded: string) => {
    setValorLiquido(calcularLiquido(bruto, ded));
  };

  // Buscar dados existentes
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("finance_faturamento")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setMsg("Erro ao carregar dados.");
        setLoading(false);
        return;
      }

      setCompetencia(data.competencia || "");
      setDataEmissao(data.data_emissao || "");
      setNumeroNF(data.numero_nf || "");
      setValorBruto(String(data.valor_bruto || ""));
      setDeducoes(String(data.deducoes || ""));
      setValorLiquido(String(data.valor_liquido || "0"));

      setLoading(false);
    }

    load();
  }, [id]);

  async function salvar() {
    if (!competencia || !dataEmissao || !valorBruto) {
      setMsg("Preencha os campos obrigatórios.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("finance_faturamento")
      .update({
        competencia,
        data_emissao: dataEmissao,
        numero_nf: numeroNF,
        valor_bruto: Number(valorBruto),
        deducoes: Number(deducoes),
        valor_liquido: Number(valorLiquido),
      })
      .eq("id", id);

    setLoading(false);

    if (error) {
      console.log(error);
      setMsg("Erro ao salvar.");
      return;
    }

    setMsg("Atualizado com sucesso!");

    setTimeout(() => {
      router.push("/financeiro/admin/faturamento");
    }, 800);
  }

  if (loading)
    return <p className="p-4 text-slate-300">Carregando dados...</p>;

  return (
    <div className="px-4 md:px-10 py-8 space-y-8">

      <Card>
        <CardHeader>
          <CardTitle>Editar Faturamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {msg && <p className="text-emerald-400">{msg}</p>}

          {/* Competência */}
          <div className="space-y-2">
            <p className="text-sm text-slate-300">Competência *</p>
            <input
              type="month"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded p-2 w-full"
            />
          </div>

          {/* Data Emissão */}
          <div className="space-y-2">
            <p className="text-sm text-slate-300">Data de Emissão *</p>
            <input
              type="date"
              value={dataEmissao}
              onChange={(e) => setDataEmissao(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded p-2 w-full"
            />
          </div>

          {/* Número NF */}
          <div className="space-y-2">
            <p className="text-sm text-slate-300">Número da NF</p>
            <input
              type="text"
              value={numeroNF}
              onChange={(e) => setNumeroNF(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded p-2 w-full"
            />
          </div>

          {/* Valor Bruto */}
          <div className="space-y-2">
            <p className="text-sm text-slate-300">Valor Bruto *</p>
            <input
              type="number"
              step="0.01"
              value={valorBruto}
              onChange={(e) => {
                setValorBruto(e.target.value);
                handleCalculo(e.target.value, deducoes);
              }}
              className="bg-zinc-900 border border-zinc-700 rounded p-2 w-full"
            />
          </div>

          {/* Deduções */}
          <div className="space-y-2">
            <p className="text-sm text-slate-300">Deduções</p>
            <input
              type="number"
              step="0.01"
              value={deducoes}
              onChange={(e) => {
                setDeducoes(e.target.value);
                handleCalculo(valorBruto, e.target.value);
              }}
              className="bg-zinc-900 border border-zinc-700 rounded p-2 w-full"
            />
          </div>

          {/* Valor Líquido */}
          <div className="space-y-2">
            <p className="text-sm text-slate-300">Valor Líquido</p>
            <input
              type="text"
              value={valorLiquido}
              readOnly
              className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full text-slate-400"
            />
          </div>

          <button
            onClick={salvar}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mt-4 disabled:bg-blue-300"
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
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
