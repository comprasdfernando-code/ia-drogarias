"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Servico = {
  id: string;
  nome: string | null;
  descricao: string | null;
  preco: number | null;
  ativo?: boolean | null;
};

type Draft = {
  nome: string;
  descricao: string;
  precoStr: string; // "15,00"
  ativo: boolean;
};

function moneyToNumber(v: string) {
  const clean = (v ?? "")
    .toString()
    .trim()
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

function formatToBRLInput(n: number | null | undefined) {
  const v = Number(n ?? 0);
  // mantém simples: 12,5 => "12,50"
  return v.toFixed(2).replace(".", ",");
}

function formatBRL(n: number | null | undefined) {
  const v = Number(n ?? 0);
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminCatalogoPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Servico[]>([]);
  const [q, setQ] = useState("");

  // drafts por id (edição local)
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // modal novo serviço
  const [openNew, setOpenNew] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [newDescricao, setNewDescricao] = useState("");
  const [newPreco, setNewPreco] = useState("0,00");
  const [newAtivo, setNewAtivo] = useState(true);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const nome = (r.nome ?? "").toLowerCase();
      const desc = (r.descricao ?? "").toLowerCase();
      return nome.includes(s) || desc.includes(s);
    });
  }, [rows, q]);

  function buildDraftFromRow(r: Servico): Draft {
    return {
      nome: r.nome ?? "",
      descricao: r.descricao ?? "",
      precoStr: formatToBRLInput(r.preco),
      ativo: Boolean(r.ativo ?? true),
    };
  }

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("servicos_catalogo")
      .select("id,nome,descricao,preco,ativo")
      .order("nome", { ascending: true });

    if (error) {
      console.error(error);
      alert("Erro ao carregar catálogo.");
      setRows([]);
      setLoading(false);
      return;
    }

    const list = ((data as any) ?? []) as Servico[];
    setRows(list);

    // inicializa drafts
    const map: Record<string, Draft> = {};
    for (const r of list) map[r.id] = buildDraftFromRow(r);
    setDrafts(map);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { nome: "", descricao: "", precoStr: "0,00", ativo: true }), ...patch },
    }));
  }

  function isDirty(id: string) {
    const r = rows.find((x) => x.id === id);
    const d = drafts[id];
    if (!r || !d) return false;

    const precoN = moneyToNumber(d.precoStr);
    const baseNome = r.nome ?? "";
    const baseDesc = r.descricao ?? "";
    const basePreco = Number(r.preco ?? 0);
    const baseAtivo = Boolean(r.ativo ?? true);

    return (
      d.nome !== baseNome ||
      d.descricao !== baseDesc ||
      Number(precoN.toFixed(2)) !== Number(basePreco.toFixed(2)) ||
      d.ativo !== baseAtivo
    );
  }

  async function saveRow(id: string) {
    const d = drafts[id];
    if (!d) return;

    const nome = d.nome.trim();
    if (!nome) {
      alert("Nome do serviço não pode ficar vazio.");
      return;
    }

    const preco = moneyToNumber(d.precoStr);

    setSavingId(id);
    const { error } = await supabase
      .from("servicos_catalogo")
      .update({
        nome,
        descricao: d.descricao.trim() || null,
        preco,
        ativo: d.ativo,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao salvar. Verifique permissão (RLS/admin).");
      setSavingId(null);
      return;
    }

    // reflete na lista base
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, nome, descricao: d.descricao.trim() || null, preco, ativo: d.ativo }
          : r
      )
    );

    // normaliza precoStr após salvar
    updateDraft(id, { precoStr: formatToBRLInput(preco) });

    setSavingId(null);
  }

  async function toggleAtivoQuick(id: string, ativo: boolean) {
    // atualiza draft imediatamente
    updateDraft(id, { ativo });
    // salva direto (pra ficar prático)
    await saveRow(id);
  }

  async function createNew() {
    const nome = newNome.trim();
    if (!nome) {
      alert("Informe o nome do serviço.");
      return;
    }
    const preco = moneyToNumber(newPreco);

    setCreating(true);
    const { data, error } = await supabase
      .from("servicos_catalogo")
      .insert({
        nome,
        descricao: newDescricao.trim() || null,
        preco,
        ativo: newAtivo,
      })
      .select("id,nome,descricao,preco,ativo")
      .single();

    if (error) {
      console.error(error);
      alert("Erro ao criar serviço. Verifique permissão (RLS/admin).");
      setCreating(false);
      return;
    }

    const created = data as Servico;

    setRows((prev) => {
      const next = [created, ...prev];
      next.sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? ""));
      return next;
    });

    setDrafts((prev) => ({ ...prev, [created.id]: buildDraftFromRow(created) }));

    // limpa modal
    setNewNome("");
    setNewDescricao("");
    setNewPreco("0,00");
    setNewAtivo(true);
    setOpenNew(false);
    setCreating(false);
  }

  async function deleteServico(id: string) {
    const r = rows.find((x) => x.id === id);
    const ok = confirm(`Excluir "${r?.nome ?? "serviço"}"? Essa ação não pode ser desfeita.`);
    if (!ok) return;

    setDeletingId(id);
    const { error } = await supabase.from("servicos_catalogo").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir. Verifique permissão (RLS/admin).");
      setDeletingId(null);
      return;
    }

    setRows((prev) => prev.filter((x) => x.id !== id));
    setDrafts((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setDeletingId(null);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Admin • Catálogo</h1>
            <p className="text-slate-600 text-sm">
              Adicione, remova e edite serviços (nome, descrição, preço e status).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenNew(true)}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold"
            >
              + Novo serviço
            </button>

            <button
              onClick={load}
              className="px-4 py-2 rounded-lg bg-white border text-slate-800 font-semibold"
            >
              Atualizar
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 mb-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou descrição..."
            className="w-full px-4 py-3 rounded-xl border bg-slate-50"
          />
        </div>

        <div className="bg-white border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-bold text-slate-900">Serviços</div>
            <div className="text-sm text-slate-600">
              {loading ? "Carregando..." : `${filtered.length} itens`}
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-slate-600">Carregando catálogo...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-slate-600">Nada encontrado.</div>
          ) : (
            <div className="divide-y">
              {filtered.map((r) => {
                const d = drafts[r.id] ?? buildDraftFromRow(r);
                const dirty = isDirty(r.id);

                return (
                  <div key={r.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-col gap-2">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Nome</div>
                            <input
                              value={d.nome}
                              onChange={(e) => updateDraft(r.id, { nome: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border bg-slate-50 font-semibold"
                              placeholder="Ex: Aplicação de injetável"
                            />
                          </div>

                          <div>
                            <div className="text-xs text-slate-500 mb-1">Descrição</div>
                            <textarea
                              value={d.descricao}
                              onChange={(e) => updateDraft(r.id, { descricao: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border bg-slate-50 min-h-[72px]"
                              placeholder="Ex: Inclui orientação e registro."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="w-72">
                        <div className="bg-slate-50 border rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-slate-500">Preço atual</div>
                              <div className="font-extrabold text-slate-900">
                                {formatBRL(r.preco)}
                              </div>
                            </div>

                            <button
                              onClick={() => toggleAtivoQuick(r.id, !d.ativo)}
                              disabled={savingId === r.id}
                              className={`px-3 py-2 rounded-lg text-sm font-bold border ${
                                d.ativo
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              } disabled:opacity-60`}
                              title="Ativar/Desativar"
                            >
                              {d.ativo ? "Ativo" : "Inativo"}
                            </button>
                          </div>

                          <div className="mt-3">
                            <div className="text-xs text-slate-500 mb-1">Editar preço</div>
                            <input
                              value={d.precoStr}
                              onChange={(e) => updateDraft(r.id, { precoStr: e.target.value })}
                              inputMode="decimal"
                              placeholder="Ex: 15,00"
                              className="w-full px-3 py-2 rounded-lg border bg-white"
                            />
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <button
                              disabled={savingId === r.id || !dirty}
                              onClick={() => saveRow(r.id)}
                              className="flex-1 px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold disabled:opacity-50"
                            >
                              {savingId === r.id ? "Salvando..." : dirty ? "Salvar alterações" : "Salvo"}
                            </button>

                            <button
                              disabled={deletingId === r.id}
                              onClick={() => deleteServico(r.id)}
                              className="px-4 py-2 rounded-lg bg-white border text-rose-700 font-semibold disabled:opacity-60"
                              title="Excluir serviço"
                            >
                              {deletingId === r.id ? "Excluindo..." : "Excluir"}
                            </button>
                          </div>

                          <div className="mt-2 text-xs text-slate-500">
                            Dica: edite os campos e clique em <b>Salvar alterações</b>.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Se der “policy / RLS”, confirme que seu usuário está em <code>admin_users</code> (ou ajuste as policies).
        </div>
      </div>

      {/* MODAL NOVO SERVIÇO */}
      {openNew ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="font-extrabold text-slate-900">Novo serviço</div>
              <button
                onClick={() => setOpenNew(false)}
                className="px-3 py-1 rounded-lg border bg-white text-slate-700 font-semibold"
              >
                Fechar
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Nome</div>
                <input
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-slate-50"
                  placeholder="Ex: Aferição de pressão arterial"
                />
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-1">Descrição</div>
                <textarea
                  value={newDescricao}
                  onChange={(e) => setNewDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-slate-50 min-h-[90px]"
                  placeholder="Ex: Atendimento rápido com orientação farmacêutica."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Preço</div>
                  <input
                    value={newPreco}
                    onChange={(e) => setNewPreco(e.target.value)}
                    inputMode="decimal"
                    className="w-full px-3 py-2 rounded-lg border bg-slate-50"
                    placeholder="Ex: 10,00"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newAtivo}
                      onChange={(e) => setNewAtivo(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Ativo
                  </label>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => setOpenNew(false)}
                className="px-4 py-2 rounded-lg bg-white border text-slate-800 font-semibold"
              >
                Cancelar
              </button>
              <button
                disabled={creating}
                onClick={createNew}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold disabled:opacity-60"
              >
                {creating ? "Criando..." : "Criar serviço"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
