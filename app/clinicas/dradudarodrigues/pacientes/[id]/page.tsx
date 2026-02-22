"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../../_lib/clinic";
import type { Paciente } from "../../_lib/types";

function cleanTags(s: string) {
  const arr = (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return arr.length ? arr : null;
}

export default function PacienteDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [p, setP] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // campos editáveis
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [origem, setOrigem] = useState("");
  const [tags, setTags] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("pacientes")
          .select("*")
          .eq("id", id)
          .eq("clinica_slug", CLINICA_SLUG)
          .single();

        if (error) throw error;

        if (!alive) return;
        const paciente = data as Paciente;
        setP(paciente);

        setNome(paciente.nome || "");
        setTelefone(paciente.telefone || "");
        setEmail(paciente.email || "");
        setCpf(paciente.cpf || "");
        setDataNascimento(paciente.data_nascimento || "");
        setOrigem(paciente.origem || "");
        setTags(paciente.tags?.join(", ") || "");
        setObservacoes(paciente.observacoes || "");
      } catch (e: any) {
        alert(e?.message || "Erro ao carregar paciente.");
        router.push("/clinicas/dradudarodrigues/pacientes");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (id) load();
    return () => {
      alive = false;
    };
  }, [id, router]);

  async function salvar() {
    if (!p) return;
    if (!nome.trim()) {
      alert("Nome é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        cpf: cpf.trim() || null,
        data_nascimento: dataNascimento || null,
        origem: origem.trim() || null,
        tags: cleanTags(tags),
        observacoes: observacoes.trim() || null,
      };

      const { error } = await supabase
        .from("pacientes")
        .update(payload)
        .eq("id", p.id)
        .eq("clinica_slug", CLINICA_SLUG);

      if (error) throw error;

      alert("Salvo ✅");
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function excluir() {
    if (!p) return;
    const ok = confirm(
      `Tem certeza que deseja excluir o paciente "${p.nome}"?\n\nEssa ação não pode ser desfeita.`
    );
    if (!ok) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("pacientes")
        .delete()
        .eq("id", p.id)
        .eq("clinica_slug", CLINICA_SLUG);

      if (error) throw error;

      alert("Excluído ✅");
      router.push("/clinicas/dradudarodrigues/pacientes");
    } catch (e: any) {
      alert(e?.message || "Erro ao excluir.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-slate-300">Carregando…</div>;
  }

  if (!p) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xl font-semibold">{p.nome}</div>
          <div className="text-sm text-slate-300">
            {p.telefone ? p.telefone : "Sem telefone"} •{" "}
            {p.email ? p.email : "Sem e-mail"}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={excluir}
            className="rounded-xl border border-rose-900/40 bg-rose-950/30 px-4 py-2 text-sm text-rose-200 hover:bg-rose-950/40 disabled:opacity-60"
            disabled={saving}
          >
            Excluir
          </button>
          <button
            onClick={salvar}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>

      {/* atalhos próximos módulos */}
      <div className="flex flex-wrap gap-2">
        {[
          { href: `/clinicas/dradudarodrigues/pacientes/${p.id}/historico`, label: "Histórico" },
          { href: `/clinicas/dradudarodrigues/pacientes/${p.id}/prontuario`, label: "Prontuário" },
          { href: `/clinicas/dradudarodrigues/pacientes/${p.id}/documentos`, label: "Documentos" },
          { href: `/clinicas/dradudarodrigues/pacientes/${p.id}/fotos`, label: "Fotos" },
        ].map((x) => (
          <Link
            key={x.href}
            href={x.href}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900"
          >
            {x.label}
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-slate-300">Nome *</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Telefone</label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">E-mail</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">CPF</label>
            <input
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
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
              placeholder="Instagram / Indicação / etc."
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">Tags</label>
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}