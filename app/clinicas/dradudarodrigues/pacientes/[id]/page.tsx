"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../../_lib/clinic";
import type { Paciente } from "../../_lib/types";
import { DUDA_THEME } from "../../_lib/theme";

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

  if (loading) return <div className="text-slate-200 text-base">Carregando…</div>;
  if (!p) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className={DUDA_THEME.h1}>{p.nome}</div>
          <div className={DUDA_THEME.muted}>
            {p.telefone ? p.telefone : "Sem telefone"} •{" "}
            {p.email ? p.email : "Sem e-mail"}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={excluir}
            className={[
              "rounded-xl px-4 py-2 text-base font-semibold",
              "border border-rose-300/15 bg-rose-950/25 text-rose-100",
              "hover:bg-rose-950/35 disabled:opacity-60",
            ].join(" ")}
            disabled={saving}
          >
            Excluir
          </button>

          <button
            onClick={salvar}
            className={DUDA_THEME.btnPrimary}
            disabled={saving}
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>

      {/* atalhos */}
      <div className="flex flex-wrap gap-2">
        {[
          { href: `/clinicas/dradudarodrigues/pacientes/${p.id}/historico`, label: "Histórico" },
          { href: `/clinicas/dradudarodrigues/pacientes/${p.id}/prontuario`, label: "Prontuário" },

          // ✅ NOVO: gerar documento + lista
          { href: `/clinicas/dradudarodrigues/pacientes/${p.id}/documentos/novo`, label: "Gerar documento" },
          { href: `/clinicas/dradudarodrigues/documentos`, label: "Lista de documentos" },

          { href: `/clinicas/dradudarodrigues/pacientes/${p.id}/fotos`, label: "Fotos" },
        ].map((x) => (
          <Link
            key={x.href}
            href={x.href}
            className={[
              "rounded-xl px-3 py-2 text-sm md:text-base font-semibold",
              "border border-[#f2caa2]/15 bg-[#050208]/30 text-slate-100",
              "hover:bg-[#050208]/45 hover:border-[#f2caa2]/25",
            ].join(" ")}
          >
            {x.label}
          </Link>
        ))}
      </div>

      {/* formulário */}
      <div className={`rounded-2xl p-6 ${DUDA_THEME.surface}`}>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-base md:text-lg font-semibold text-slate-100">
              Nome <span className="text-[#f2caa2]">*</span>
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={`${DUDA_THEME.input} mt-2`}
            />
          </div>

          <div>
            <label className="text-base md:text-lg font-semibold text-slate-100">
              Telefone
            </label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className={`${DUDA_THEME.input} mt-2`}
            />
          </div>

          <div>
            <label className="text-base md:text-lg font-semibold text-slate-100">
              E-mail
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${DUDA_THEME.input} mt-2`}
            />
          </div>

          <div>
            <label className="text-base md:text-lg font-semibold text-slate-100">
              CPF
            </label>
            <input
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className={`${DUDA_THEME.input} mt-2`}
            />
          </div>

          <div>
            <label className="text-base md:text-lg font-semibold text-slate-100">
              Data de nascimento
            </label>
            <input
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              className={`${DUDA_THEME.input} mt-2`}
            />
          </div>

          <div>
            <label className="text-base md:text-lg font-semibold text-slate-100">
              Origem
            </label>
            <input
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
              className={`${DUDA_THEME.input} mt-2`}
              placeholder="Instagram / Indicação / etc."
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-base md:text-lg font-semibold text-slate-100">
              Tags
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={`${DUDA_THEME.input} mt-2`}
              placeholder="botox, retorno, preenchimento"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-base md:text-lg font-semibold text-slate-100">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={5}
              className={`${DUDA_THEME.input} mt-2`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}