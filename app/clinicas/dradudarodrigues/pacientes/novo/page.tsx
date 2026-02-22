"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../../_lib/clinic";

function cleanTags(s: string) {
  const arr = (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return arr.length ? arr : null;
}

export default function NovoPacientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [origem, setOrigem] = useState("");
  const [tags, setTags] = useState("");
  const [observacoes, setObservacoes] = useState("");

  async function salvar() {
    if (!nome.trim()) {
      alert("Informe o nome do paciente.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        clinica_slug: CLINICA_SLUG,
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        cpf: cpf.trim() || null,
        data_nascimento: dataNascimento || null,
        origem: origem.trim() || null,
        tags: cleanTags(tags),
        observacoes: observacoes.trim() || null,
      };

      const { data, error } = await supabase
        .from("pacientes")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      router.push(`/clinicas/dradudarodrigues/pacientes/${data.id}`);
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar paciente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">Novo paciente</div>
        <div className="text-sm text-slate-300">
          Cadastre os dados principais. Depois você completa no prontuário/histórico.
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-slate-300">Nome *</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Nome completo"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Telefone</label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">E-mail</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">CPF</label>
            <input
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Somente se necessário"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Data de nascimento</label>
            <input
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Origem</label>
            <input
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Instagram / Indicação / Tráfego / etc."
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">Tags (separadas por vírgula)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="botox, retorno, preenchimento"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Anotações internas…"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
            disabled={loading}
          >
            Voltar
          </button>

          <button
            onClick={salvar}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}