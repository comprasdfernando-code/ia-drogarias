"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../../../../_lib/clinic";

type Modelo = {
  id: string;
  clinica_slug: string;
  titulo: string;
  conteudo: string;
  ativo: boolean;
  created_at: string;
};

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function normalizeNewlines(t: string) {
  return String(t || "").replaceAll("\\n", "\n");
}

function todayBR() {
  return new Date().toLocaleDateString("pt-BR");
}

function applyVars(texto: string, vars: Record<string, string>) {
  let out = String(texto || "");
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, v);
  }
  return out;
}

function badgeAtivo(ativo: boolean) {
  const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]";
  return ativo
    ? `${base} border-emerald-900/40 bg-emerald-950/30 text-emerald-200`
    : `${base} border-slate-700 bg-slate-950 text-slate-200`;
}

export default function ModelosPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [items, setItems] = useState<Modelo[]>([]);

  // modal
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [ativo, setAtivo] = useState(true);

  const qNorm = useMemo(() => q.trim().toLowerCase(), [q]);

  const filtered = useMemo(() => {
    if (!qNorm) return items;
    return items.filter((m) => {
      const t = (m.titulo || "").toLowerCase();
      const c = (m.conteudo || "").toLowerCase();
      return t.includes(qNorm) || c.includes(qNorm);
    });
  }, [items, qNorm]);

  const preview = useMemo(() => {
    const base = normalizeNewlines(conteudo);
    return normalizeNewlines(
      applyVars(base, {
        NOME: "Paciente Exemplo",
        DATA: todayBR(),
      })
    );
  }, [conteudo]);

  async function carregar() {
    setLoading(true);
    setErr(null);

    try {
      const { data, error } = await supabase
        .from("doc_modelos")
        .select("id, clinica_slug, titulo, conteudo, ativo, created_at")
        .eq("clinica_slug", CLINICA_SLUG)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      setItems((data || []) as Modelo[]);
    } catch (e: any) {
      setErr(e?.message || "Erro ao carregar modelos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function abrirNovo() {
    setEditId(null);
    setTitulo("");
    setConteudo(
      "Eu, {NOME}, declaro que fui informado(a) sobre o procedimento, possíveis efeitos, cuidados e orientações.\n\nAutorizo a realização do procedimento conforme orientação profissional.\n\nData: {DATA}"
    );
    setAtivo(true);
    setOpen(true);
  }

  function abrirEditar(m: Modelo) {
    setEditId(m.id);
    setTitulo(m.titulo || "");
    setConteudo(normalizeNewlines(m.conteudo || ""));
    setAtivo(!!m.ativo);
    setOpen(true);
  }

  async function salvar() {
    if (!titulo.trim()) {
      alert("Título é obrigatório.");
      return;
    }
    if (!conteudo.trim()) {
      alert("Conteúdo é obrigatório.");
      return;
    }

    setSaving(true);
    setErr(null);

    try {
      const payload = {
        clinica_slug: CLINICA_SLUG,
        titulo: titulo.trim(),
        conteudo: normalizeNewlines(conteudo),
        ativo: !!ativo,
      };

      if (editId) {
        const { error } = await supabase
          .from("doc_modelos")
          .update(payload)
          .eq("id", editId)
          .eq("clinica_slug", CLINICA_SLUG);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("doc_modelos").insert(payload);
        if (error) throw error;
      }

      setOpen(false);
      await carregar();
    } catch (e: any) {
      setErr(e?.message || "Erro ao salvar modelo.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(m: Modelo) {
    const next = !m.ativo;

    // otimista
    setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, ativo: next } : x)));

    const { error } = await supabase
      .from("doc_modelos")
      .update({ ativo: next })
      .eq("id", m.id)
      .eq("clinica_slug", CLINICA_SLUG);

    if (error) {
      // rollback
      setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, ativo: m.ativo } : x)));
      alert(error.message);
    }
  }

  async function excluir(m: Modelo) {
    const ok = confirm(`Excluir o modelo "${m.titulo}"?\n\nEssa ação não pode ser desfeita.`);
    if (!ok) return;

    const { error } = await supabase
      .from("doc_modelos")
      .delete()
      .eq("id", m.id)
      .eq("clinica_slug", CLINICA_SLUG);

    if (error) {
      alert(error.message);
      return;
    }
    await carregar();
  }

  return (
    <div className="space-y-4">
      {/* topo */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xl font-semibold">Modelos</div>
          <div className="text-sm text-slate-300">
            Crie e edite termos/consentimentos. Variáveis: <span className="text-slate-100">{"{NOME}"}</span> e{" "}
            <span className="text-slate-100">{"{DATA}"}</span>.
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/clinicas/dradudarodrigues/documentos"
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
          >
            ← Documentos
          </Link>

          <button
            onClick={carregar}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Atualizando…" : "Atualizar"}
          </button>

          {/* botão dourado */}
          <button
            onClick={abrirNovo}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-900
                       bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200
                       hover:from-amber-100 hover:to-amber-100
                       border border-amber-300/50 shadow-[0_0_0_1px_rgba(251,191,36,0.18)]"
          >
            + Novo modelo
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/30 p-3 text-sm text-rose-200">
          {err}
        </div>
      )}

      {/* filtro + tabela */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-300">
            Total: <span className="text-slate-100 font-semibold">{items.length}</span>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título ou conteúdo…"
            className="w-full md:max-w-md rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none
                       focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300/40"
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/60 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left">Modelo</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left hidden lg:table-cell">Criado</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {filtered.map((m) => (
                <tr key={m.id} className="bg-slate-900/10">
                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-100">{m.titulo}</div>
                    <div className="text-xs text-slate-400">#{m.id.slice(0, 8)}</div>
                  </td>

                  <td className="px-3 py-3">
                    <span className={badgeAtivo(!!m.ativo)}>{m.ativo ? "ativo" : "inativo"}</span>
                  </td>

                  <td className="px-3 py-3 hidden lg:table-cell text-slate-200">
                    {fmtDateTime(m.created_at)}
                  </td>

                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleAtivo(m)}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                      >
                        {m.ativo ? "Desativar" : "Ativar"}
                      </button>

                      <button
                        onClick={() => abrirEditar(m)}
                        className="rounded-xl border border-amber-300/30 bg-amber-950/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-950/20"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => excluir(m)}
                        className="rounded-xl border border-rose-900/40 bg-rose-950/20 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-950/30"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-slate-400">
                    Nenhum modelo encontrado.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-slate-400">
                    Carregando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-slate-400">
          Dica: mantenha apenas os modelos que a clínica usa como <span className="text-slate-200">ativo</span> pra
          facilitar na geração pelo paciente.
        </div>
      </div>

      {/* modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 p-4">
              <div>
                <div className="text-base font-semibold text-slate-100">
                  {editId ? "Editar modelo" : "Novo modelo"}
                </div>
                <div className="text-xs text-slate-400">
                  Toque dourado + feminino • variáveis: {"{NOME}"} {"{DATA}"}
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-2">
              {/* editor */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-300">Título</label>
                  <input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none
                               focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300/40"
                    placeholder="Ex: Termo de Consentimento – Botox"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-300">Conteúdo</label>
                  <textarea
                    value={conteudo}
                    onChange={(e) => setConteudo(e.target.value)}
                    rows={14}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none
                               focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300/40"
                    placeholder={"Use {NOME} e {DATA}.\n\nQuebras de linha são aceitas."}
                  />
                </div>

                <label className="flex items-center gap-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Modelo ativo (aparece na geração)
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900 disabled:opacity-60"
                    disabled={saving}
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={salvar}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-900
                               bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200
                               hover:from-amber-100 hover:to-amber-100
                               border border-amber-300/50 disabled:opacity-60"
                    disabled={saving}
                  >
                    {saving ? "Salvando…" : "Salvar"}
                  </button>
                </div>
              </div>

              {/* preview */}
              <div className="space-y-3">
                <div className="rounded-2xl border border-amber-300/20 bg-amber-950/10 p-4">
                  <div className="text-sm font-semibold text-amber-200">Prévia (com variáveis)</div>
                  <div className="mt-1 text-xs text-slate-300">
                    Exemplo: NOME = “Paciente Exemplo”, DATA = {todayBR()}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 whitespace-pre-line text-sm text-slate-200">
                  {preview}
                </div>

                <div className="text-xs text-slate-400">
                  Sugestão: coloque no final do termo uma frase tipo “Declaro que li e concordo com os termos acima.”
                  (a confirmação é o checkbox na tela).
                </div>
              </div>
            </div>

            {err && (
              <div className="border-t border-slate-800 p-4">
                <div className="rounded-xl border border-rose-900/40 bg-rose-950/30 p-3 text-sm text-rose-200">
                  {err}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}