// app/dfdistribuidora/admin/produtos/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

/**
 * ✅ Admin DF (df_produtos) com ESTOQUE:
 * - login por senha (local)
 * - lista com paginação + busca
 * - editar campos + estoque (saldo disponível)
 * - criar produto já com estoque
 * - ativar/desativar
 * - promoção + destaque
 * - imagens (JSON)
 * - excluir
 *
 * Requisito: tabela public.df_produtos precisa ter coluna:
 * - estoque numeric/int (default 0)
 */

const SENHA_ADMIN = "102030"; // 🔴 troque
const TABLE = "df_produtos";
const PAGE_SIZE = 50;

type DFProduto = {
  id: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;
  pmc: number | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  destaque_home: boolean | null;
  ativo: boolean | null;
  imagens: string[] | null;
  estoque: number | null; // ✅ NOVO
};

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0 && imagens[0]) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function toNum(v: any) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\./g, "").replace(",", ".").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toInt(v: any) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/[^\d-]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function safeJsonArray(v: string): string[] | null {
  const raw = v.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const arr = parsed.map((x) => String(x || "").trim()).filter(Boolean);
      return arr.length ? arr : null;
    }
    return null;
  } catch {
    const arr = raw
      .split(/[\n,;]/g)
      .map((x) => x.trim())
      .filter(Boolean);
    return arr.length ? arr : null;
  }
}

export default function AdminProdutosDF() {
  const [authed, setAuthed] = useState(false);
  const [senha, setSenha] = useState("");

  useEffect(() => {
    const ok = typeof window !== "undefined" && localStorage.getItem("df_admin_ok") === "1";
    if (ok) setAuthed(true);
  }, []);

  function login() {
    if (senha === SENHA_ADMIN) {
      localStorage.setItem("df_admin_ok", "1");
      setAuthed(true);
    } else {
      alert("Senha incorreta.");
    }
  }

  function sair() {
    localStorage.removeItem("df_admin_ok");
    setAuthed(false);
    setSenha("");
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border rounded-3xl shadow-sm p-6">
          <div className="text-xl font-extrabold text-gray-900">Admin • Produtos (DF)</div>
          <div className="text-sm text-gray-600 mt-1">Digite a senha para acessar.</div>

          <input
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            type="password"
            placeholder="Senha"
            className="mt-4 w-full border rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />

          <button
            onClick={login}
            className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white rounded-2xl py-3 font-extrabold"
          >
            Entrar
          </button>

          <div className="mt-3 text-[11px] text-gray-500">Dica: fica salvo no navegador (localStorage).</div>
        </div>
      </div>
    );
  }

  return <AdminProdutosInner onSair={sair} />;
}

function AdminProdutosInner({ onSair }: { onSair: () => void }) {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<DFProduto[]>([]);
  const [total, setTotal] = useState(0);

  const [editing, setEditing] = useState<DFProduto | null>(null);

  // ✅ novo produto já com estoque
  const [novo, setNovo] = useState<Partial<DFProduto>>({
    ativo: true,
    em_promocao: false,
    destaque_home: false,
    percentual_off: null,
    imagens: null,
    estoque: 0,
  });

  async function load() {
    try {
      setLoading(true);

      let query = supabase
        .from(TABLE)
        .select(
          "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens,estoque",
          { count: "exact" }
        );

      const raw = q.trim();
      if (raw) {
        const digits = onlyDigits(raw);
        if (digits.length >= 8 && digits.length <= 14) query = query.or(`ean.eq.${digits},nome.ilike.%${raw}%`);
        else query = query.ilike("nome", `%${raw}%`);
      }

      query = query.order("nome", { ascending: true });

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, count, error } = await query.range(from, to);
      if (error) throw error;

      setRows((data || []) as DFProduto[]);
      setTotal(count || 0);
    } catch (e) {
      console.error("Erro load admin produtos:", e);
      alert("Erro ao carregar produtos. Veja o console.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function toggleQuick(id: string, patch: Partial<DFProduto>) {
    try {
      setSavingId(id);
      const { error } = await supabase.from(TABLE).update(patch).eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === id ? ({ ...r, ...patch } as DFProduto) : r)));
    } catch (e) {
      console.error("Erro toggleQuick:", e);
      alert("Erro ao salvar.");
    } finally {
      setSavingId(null);
    }
  }

  // ✅ ajuste rápido de estoque na lista (incrementa/decrementa)
  async function changeEstoque(id: string, delta: number) {
    const current = rows.find((r) => r.id === id)?.estoque ?? 0;
    const next = Math.max(0, Number(current) + delta);

    try {
      setSavingId(id);
      const { error } = await supabase.from(TABLE).update({ estoque: next }).eq("id", id);
      if (error) throw error;

      setRows((prev) => prev.map((r) => (r.id === id ? ({ ...r, estoque: next } as DFProduto) : r)));
    } catch (e) {
      console.error("Erro changeEstoque:", e);
      alert("Erro ao ajustar estoque.");
    } finally {
      setSavingId(null);
    }
  }

  function openEdit(p: DFProduto) {
    setEditing({
      ...p,
      imagens: Array.isArray(p.imagens) ? [...p.imagens] : null,
      estoque: Number(p.estoque ?? 0),
    });
  }

  async function saveEdit() {
    if (!editing) return;
    const id = editing.id;

    try {
      setSavingId(id);

      const payload: Partial<DFProduto> = {
        ean: onlyDigits(editing.ean || ""),
        nome: (editing.nome || "").trim(),
        laboratorio: editing.laboratorio?.trim() || null,
        categoria: editing.categoria?.trim() || null,
        apresentacao: editing.apresentacao?.trim() || null,
        pmc: toNum(editing.pmc),
        em_promocao: !!editing.em_promocao,
        preco_promocional: toNum(editing.preco_promocional),
        percentual_off: toNum(editing.percentual_off),
        destaque_home: !!editing.destaque_home,
        ativo: !!editing.ativo,
        imagens: Array.isArray(editing.imagens) ? editing.imagens.filter(Boolean) : null,
        estoque: Math.max(0, Number(toInt(editing.estoque) ?? 0)), // ✅
      };

      if (!payload.ean || payload.ean.length < 8) {
        alert("EAN inválido (mínimo 8 dígitos).");
        return;
      }
      if (!payload.nome) {
        alert("Nome é obrigatório.");
        return;
      }

      const { error } = await supabase.from(TABLE).update(payload).eq("id", id);
      if (error) throw error;

      setEditing(null);
      await load();
    } catch (e) {
      console.error("Erro saveEdit:", e);
      alert("Erro ao salvar. Veja o console.");
    } finally {
      setSavingId(null);
    }
  }

  async function createNovo() {
    try {
      setSavingId("novo");

      const payload: Partial<DFProduto> = {
        ean: onlyDigits(String(novo.ean || "")),
        nome: String(novo.nome || "").trim(),
        laboratorio: String(novo.laboratorio || "").trim() || null,
        categoria: String(novo.categoria || "").trim() || null,
        apresentacao: String(novo.apresentacao || "").trim() || null,
        pmc: toNum(novo.pmc),
        em_promocao: !!novo.em_promocao,
        preco_promocional: toNum(novo.preco_promocional),
        percentual_off: toNum(novo.percentual_off),
        destaque_home: !!novo.destaque_home,
        ativo: novo.ativo ?? true,
        imagens: Array.isArray(novo.imagens) ? (novo.imagens as any) : null,
        estoque: Math.max(0, Number(toInt(novo.estoque) ?? 0)), // ✅ já cria com estoque
      };

      if (!payload.ean || payload.ean.length < 8) {
        alert("EAN inválido (mínimo 8 dígitos).");
        return;
      }
      if (!payload.nome) {
        alert("Nome é obrigatório.");
        return;
      }

      const { error } = await supabase.from(TABLE).insert(payload);
      if (error) throw error;

      setNovo({
        ativo: true,
        em_promocao: false,
        destaque_home: false,
        percentual_off: null,
        imagens: null,
        estoque: 0,
      });

      setPage(1);
      await load();
    } catch (e) {
      console.error("Erro createNovo:", e);
      alert("Erro ao criar. Veja o console.");
    } finally {
      setSavingId(null);
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este produto? Essa ação não tem volta.")) return;
    try {
      setDeletingId(id);
      const { error } = await supabase.from(TABLE).delete().eq("id", id);
      if (error) throw error;
      await load();
    } catch (e) {
      console.error("Erro excluir:", e);
      alert("Erro ao excluir. Veja o console.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="font-extrabold text-gray-900">Admin • Produtos (DF)</div>

          <div className="flex-1" />

          <button
            onClick={load}
            className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-sm"
            title="Recarregar"
          >
            ↻ Atualizar
          </button>

          <button
            onClick={onSair}
            className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-sm"
            title="Sair"
          >
            Sair
          </button>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* BUSCA + RESUMO */}
        <div className="bg-white border rounded-3xl p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1">
              <div className="text-xs font-bold text-gray-600">Buscar</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nome ou EAN..."
                className="mt-1 w-full rounded-2xl border px-4 py-2.5 outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex gap-3">
              <div className="bg-gray-50 border rounded-2xl px-4 py-2">
                <div className="text-[11px] text-gray-500 font-bold">Total</div>
                <div className="font-extrabold text-gray-900">{total}</div>
              </div>

              <div className="bg-gray-50 border rounded-2xl px-4 py-2">
                <div className="text-[11px] text-gray-500 font-bold">Página</div>
                <div className="font-extrabold text-gray-900">
                  {page}/{pages}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NOVO PRODUTO */}
        <div className="bg-white border rounded-3xl p-4 shadow-sm">
          <div className="font-extrabold text-gray-900">+ Novo produto</div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-3">
            <Field label="EAN" className="md:col-span-2">
              <input
                value={String(novo.ean || "")}
                onChange={(e) => setNovo((p) => ({ ...p, ean: e.target.value }))}
                className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="789..."
              />
            </Field>

            <Field label="Nome" className="md:col-span-4">
              <input
                value={String(novo.nome || "")}
                onChange={(e) => setNovo((p) => ({ ...p, nome: e.target.value }))}
                className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Nome do produto"
              />
            </Field>

            <Field label="Estoque inicial" className="md:col-span-2">
              <input
                value={String(novo.estoque ?? 0)}
                onChange={(e) => setNovo((p) => ({ ...p, estoque: e.target.value as any }))}
                className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="0"
              />
              <div className="text-[11px] text-gray-500 mt-1">Dica: coloque 0 pra ficar indisponível no site.</div>
            </Field>

            <Field label="Laboratório" className="md:col-span-2">
              <input
                value={String(novo.laboratorio || "")}
                onChange={(e) => setNovo((p) => ({ ...p, laboratorio: e.target.value }))}
                className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
              />
            </Field>

            <Field label="Categoria" className="md:col-span-2">
              <input
                value={String(novo.categoria || "")}
                onChange={(e) => setNovo((p) => ({ ...p, categoria: e.target.value }))}
                className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
              />
            </Field>

            <Field label="Apresentação" className="md:col-span-2">
              <input
                value={String(novo.apresentacao || "")}
                onChange={(e) => setNovo((p) => ({ ...p, apresentacao: e.target.value }))}
                className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
              />
            </Field>

            <Field label="Preço (PMC)" className="md:col-span-2">
              <input
                value={String(novo.pmc ?? "")}
                onChange={(e) => setNovo((p) => ({ ...p, pmc: e.target.value as any }))}
                className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="ex: 12,90"
              />
            </Field>

            <Field label="Promo?" className="md:col-span-1">
              <select
                value={novo.em_promocao ? "1" : "0"}
                onChange={(e) => setNovo((p) => ({ ...p, em_promocao: e.target.value === "1" }))}
                className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100 bg-white"
              >
                <option value="0">Não</option>
                <option value="1">Sim</option>
              </select>
            </Field>

            <Field label="Preço promo" className="md:col-span-2">
              <input
                value={String(novo.preco_promocional ?? "")}
                onChange={(e) => setNovo((p) => ({ ...p, preco_promocional: e.target.value as any }))}
                className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="ex: 9,90"
              />
            </Field>

            <Field label="OFF (%)" className="md:col-span-1">
              <input
                value={String(novo.percentual_off ?? "")}
                onChange={(e) => setNovo((p) => ({ ...p, percentual_off: e.target.value as any }))}
                className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="ex: 20"
              />
            </Field>

            <Field label="Destaque?" className="md:col-span-1">
              <select
                value={novo.destaque_home ? "1" : "0"}
                onChange={(e) => setNovo((p) => ({ ...p, destaque_home: e.target.value === "1" }))}
                className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100 bg-white"
              >
                <option value="0">Não</option>
                <option value="1">Sim</option>
              </select>
            </Field>

            <Field label="Ativo?" className="md:col-span-1">
              <select
                value={novo.ativo === false ? "0" : "1"}
                onChange={(e) => setNovo((p) => ({ ...p, ativo: e.target.value === "1" }))}
                className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100 bg-white"
              >
                <option value="1">Sim</option>
                <option value="0">Não</option>
              </select>
            </Field>

            <Field label="Imagens (JSON ou URLs separadas)" className="md:col-span-6">
              <textarea
                value={Array.isArray(novo.imagens) ? JSON.stringify(novo.imagens) : ""}
                onChange={(e) => setNovo((p) => ({ ...p, imagens: safeJsonArray(e.target.value) }))}
                rows={2}
                className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
                placeholder='["https://.../1.jpg","https://.../2.jpg"]  OU  https://.../1.jpg, https://.../2.jpg'
              />
            </Field>
          </div>

          <button
            onClick={createNovo}
            disabled={savingId === "novo"}
            className={`mt-4 px-4 py-3 rounded-2xl font-extrabold ${
              savingId === "novo" ? "bg-gray-200 text-gray-500" : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {savingId === "novo" ? "Salvando..." : "Criar produto"}
          </button>
        </div>

        {/* LISTA */}
        <div className="bg-white border rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-extrabold text-gray-900">Produtos {loading ? "• carregando…" : ""}</div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-sm"
                disabled={page <= 1}
              >
                ←
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-sm"
                disabled={page >= pages}
              >
                →
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-4">
              <SkeletonRows />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-gray-600">Nenhum produto.</div>
          ) : (
            <div className="divide-y">
              {rows.map((p) => (
                <div key={p.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex gap-3 items-center min-w-0 flex-1">
                    <div className="h-14 w-14 rounded-xl bg-gray-50 border overflow-hidden flex items-center justify-center shrink-0">
                      <Image src={firstImg(p.imagens)} alt={p.nome || "Produto"} width={64} height={64} className="object-contain" />
                    </div>

                    <div className="min-w-0">
                      <div className="font-extrabold text-gray-900 line-clamp-1">{p.nome}</div>
                      <div className="text-xs text-gray-500">
                        EAN: <span className="font-bold">{p.ean}</span>
                        {p.laboratorio ? ` • ${p.laboratorio}` : ""}
                        {p.apresentacao ? ` • ${p.apresentacao}` : ""}
                      </div>

                      <div className="text-xs mt-1">
                        <span className="font-extrabold text-blue-900">{brl(p.pmc)}</span>
                        {p.em_promocao && p.preco_promocional ? (
                          <span className="ml-2 text-green-700 font-extrabold">Promo: {brl(p.preco_promocional)}</span>
                        ) : null}
                      </div>

                      <div className="text-xs mt-1">
                        Estoque:{" "}
                        <span className={`font-extrabold ${Number(p.estoque ?? 0) > 0 ? "text-green-700" : "text-red-600"}`}>
                          {Number(p.estoque ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* estoque rápido */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      onClick={() => changeEstoque(p.id, -1)}
                      disabled={savingId === p.id || Number(p.estoque ?? 0) <= 0}
                      className={`px-3 py-2 rounded-xl border font-extrabold text-sm ${
                        savingId === p.id || Number(p.estoque ?? 0) <= 0 ? "bg-gray-100 text-gray-400" : "bg-white hover:bg-gray-50"
                      }`}
                      title="Diminuir estoque"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => changeEstoque(p.id, +1)}
                      disabled={savingId === p.id}
                      className={`px-3 py-2 rounded-xl border font-extrabold text-sm ${
                        savingId === p.id ? "bg-gray-100 text-gray-400" : "bg-white hover:bg-gray-50"
                      }`}
                      title="Aumentar estoque"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => changeEstoque(p.id, +10)}
                      disabled={savingId === p.id}
                      className={`px-3 py-2 rounded-xl border font-extrabold text-sm ${
                        savingId === p.id ? "bg-gray-100 text-gray-400" : "bg-white hover:bg-gray-50"
                      }`}
                      title="Aumentar +10"
                    >
                      +10
                    </button>

                    {/* toggles rápidos */}
                    <QuickToggle label="Ativo" value={!!p.ativo} disabled={savingId === p.id} onChange={(v) => toggleQuick(p.id, { ativo: v })} />
                    <QuickToggle label="Promo" value={!!p.em_promocao} disabled={savingId === p.id} onChange={(v) => toggleQuick(p.id, { em_promocao: v })} />
                    <QuickToggle
                      label="Destaque"
                      value={!!p.destaque_home}
                      disabled={savingId === p.id}
                      onChange={(v) => toggleQuick(p.id, { destaque_home: v })}
                    />

                    <button onClick={() => openEdit(p)} className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-sm">
                      Editar
                    </button>

                    <button
                      onClick={() => excluir(p.id)}
                      disabled={deletingId === p.id}
                      className={`px-3 py-2 rounded-xl font-extrabold text-sm ${
                        deletingId === p.id ? "bg-gray-200 text-gray-500" : "bg-red-600 hover:bg-red-700 text-white"
                      }`}
                    >
                      {deletingId === p.id ? "Excluindo..." : "Excluir"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL EDITAR */}
        {editing ? (
          <EditModal p={editing} setP={setEditing} saving={savingId === editing.id} onClose={() => setEditing(null)} onSave={saveEdit} />
        ) : null}
      </div>
    </div>
  );
}

/* =========================
   UI helpers
========================= */
function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <div className="text-xs font-bold text-gray-600">{label}</div>
      {children}
    </div>
  );
}

function QuickToggle({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      disabled={disabled}
      className={`px-3 py-2 rounded-xl border font-extrabold text-sm ${
        value ? "bg-green-600 text-white border-green-600" : "bg-white hover:bg-gray-50"
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      title={label}
    >
      {label}: {value ? "Sim" : "Não"}
    </button>
  );
}

function EditModal({
  p,
  setP,
  saving,
  onClose,
  onSave,
}: {
  p: DFProduto;
  setP: (v: DFProduto | null) => void;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const imagensText = useMemo(() => {
    if (Array.isArray(p.imagens) && p.imagens.length) return JSON.stringify(p.imagens);
    return "";
  }, [p.imagens]);

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-extrabold text-gray-900">Editar produto</div>
          <button onClick={onClose} className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold">
            Fechar
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
          <Field label="EAN" className="md:col-span-2">
            <input
              value={p.ean}
              onChange={(e) => setP({ ...p, ean: e.target.value })}
              className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          <Field label="Nome" className="md:col-span-4">
            <input
              value={p.nome}
              onChange={(e) => setP({ ...p, nome: e.target.value })}
              className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          <Field label="Estoque (saldo disponível)" className="md:col-span-2">
            <input
              value={String(p.estoque ?? 0)}
              onChange={(e) => setP({ ...p, estoque: e.target.value as any })}
              className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
              placeholder="0"
            />
          </Field>

          <Field label="Laboratório" className="md:col-span-2">
            <input
              value={p.laboratorio || ""}
              onChange={(e) => setP({ ...p, laboratorio: e.target.value })}
              className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          <Field label="Categoria" className="md:col-span-2">
            <input
              value={p.categoria || ""}
              onChange={(e) => setP({ ...p, categoria: e.target.value })}
              className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          <Field label="Apresentação" className="md:col-span-2">
            <input
              value={p.apresentacao || ""}
              onChange={(e) => setP({ ...p, apresentacao: e.target.value })}
              className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          <Field label="PMC" className="md:col-span-2">
            <input
              value={String(p.pmc ?? "")}
              onChange={(e) => setP({ ...p, pmc: e.target.value as any })}
              className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          <Field label="Em promoção?" className="md:col-span-2">
            <select
              value={p.em_promocao ? "1" : "0"}
              onChange={(e) => setP({ ...p, em_promocao: e.target.value === "1" })}
              className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100 bg-white"
            >
              <option value="0">Não</option>
              <option value="1">Sim</option>
            </select>
          </Field>

          <Field label="Preço promocional" className="md:col-span-2">
            <input
              value={String(p.preco_promocional ?? "")}
              onChange={(e) => setP({ ...p, preco_promocional: e.target.value as any })}
              className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          <Field label="Percentual off" className="md:col-span-2">
            <input
              value={String(p.percentual_off ?? "")}
              onChange={(e) => setP({ ...p, percentual_off: e.target.value as any })}
              className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          <Field label="Destaque home?" className="md:col-span-2">
            <select
              value={p.destaque_home ? "1" : "0"}
              onChange={(e) => setP({ ...p, destaque_home: e.target.value === "1" })}
              className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100 bg-white"
            >
              <option value="0">Não</option>
              <option value="1">Sim</option>
            </select>
          </Field>

          <Field label="Ativo?" className="md:col-span-2">
            <select
              value={p.ativo === false ? "0" : "1"}
              onChange={(e) => setP({ ...p, ativo: e.target.value === "1" })}
              className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100 bg-white"
            >
              <option value="1">Sim</option>
              <option value="0">Não</option>
            </select>
          </Field>

          <Field label="Imagens (JSON ou URLs separadas)" className="md:col-span-6">
            <textarea
              defaultValue={imagensText}
              onChange={(e) => setP({ ...p, imagens: safeJsonArray(e.target.value) })}
              rows={3}
              className="w-full rounded-2xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
              placeholder='["https://.../1.jpg","https://.../2.jpg"]'
            />
          </Field>
        </div>

        <div className="p-4 border-t flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-3 rounded-2xl border bg-white hover:bg-gray-50 font-extrabold">
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className={`px-4 py-3 rounded-2xl font-extrabold ${saving ? "bg-gray-200 text-gray-500" : "bg-blue-700 hover:bg-blue-800 text-white"}`}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="border rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 bg-gray-100 rounded-xl animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
              <div className="mt-2 h-3 w-72 bg-gray-100 rounded animate-pulse" />
              <div className="mt-2 h-3 w-40 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-10 w-36 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
