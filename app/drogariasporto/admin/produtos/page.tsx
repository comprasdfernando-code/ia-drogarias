"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

/**
 * Drogarias Porto • Loja 2 • Admin de Produtos
 *
 * Modelo visual baseado no Admin DF.
 * Aqui, porém, o cadastro já é o próprio catálogo FV:
 * - dados gerais do produto -> public.fv_produtos
 * - preço/estoque/ativo/promo da Porto -> public.fv_farmacia_produtos
 * - leitura consolidada -> public.fv_produtos_loja_view
 *
 * Resultado: criou ou editou aqui -> o FV já recebe a alteração.
 */

const SENHA_ADMIN = "021185"; // troque depois
const FARMACIA_SLUG = "drogariasporto-loja2";
const PROD_TABLE = "fv_produtos";
const STORE_TABLE = "fv_farmacia_produtos";
const VIEW = "fv_produtos_loja_view";
const PAGE_SIZE = 50;

type ProdutoPorto = {
  farmacia_slug: string;
  produto_id: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;
  imagens: string[] | null;
  disponivel_farmacia: boolean | null;
  ativo_site: boolean | null;
  ativo_pdv: boolean | null;
  estoque: number | null;
  preco_venda: number | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  destaque_home: boolean | null;
};

type EditProduto = ProdutoPorto & { pmc?: number | null };

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0 && imagens[0]) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function toNum(v: unknown) {
  if (v === null || v === undefined) return null;
  let s = String(v).trim();
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toInt(v: unknown) {
  const n = toNum(v);
  return n === null ? null : Math.trunc(n);
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
  } catch {}
  const arr = raw
    .split(/[\n,;]/g)
    .map((x) => x.trim())
    .filter(Boolean);
  return arr.length ? arr : null;
}

export default function AdminProdutosPorto() {
  const [authed, setAuthed] = useState(false);
  const [senha, setSenha] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("porto_admin_produtos_ok") === "1") {
      setAuthed(true);
    }
  }, []);

  function login() {
    if (senha === SENHA_ADMIN) {
      localStorage.setItem("porto_admin_produtos_ok", "1");
      setAuthed(true);
    } else alert("Senha incorreta.");
  }

  function sair() {
    localStorage.removeItem("porto_admin_produtos_ok");
    setAuthed(false);
    setSenha("");
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border rounded-3xl shadow-sm p-6">
          <div className="text-xl font-extrabold text-gray-900">Drogarias Porto • Produtos</div>
          <div className="text-sm text-gray-600 mt-1">Loja 2 • integrado ao FV Marketplace</div>
          <input
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            type="password"
            placeholder="Senha"
            className="mt-4 w-full border rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />
          <button onClick={login} className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white rounded-2xl py-3 font-extrabold">
            Entrar
          </button>
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
  const [stockMode, setStockMode] = useState<"all" | "gt0" | "eq0">("all");
  const [rows, setRows] = useState<ProdutoPorto[]>([]);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<EditProduto | null>(null);

  const [novo, setNovo] = useState({
    ean: "",
    nome: "",
    laboratorio: "",
    categoria: "",
    apresentacao: "",
    pmc: "",
    preco_venda: "",
    estoque: "0",
    em_promocao: false,
    preco_promocional: "",
    percentual_off: "",
    destaque_home: false,
    ativo: true,
    ativo_site: true,
    ativo_pdv: true,
    imagensText: "",
  });

  async function load() {
    try {
      setLoading(true);
      let query = supabase
        .from(VIEW)
        .select(
          "farmacia_slug,produto_id,ean,nome,laboratorio,categoria,apresentacao,imagens,disponivel_farmacia,estoque,preco_venda,em_promocao,preco_promocional,percentual_off,destaque_home",
          { count: "exact" }
        )
        .eq("farmacia_slug", FARMACIA_SLUG);

      const raw = q.trim();
      if (raw) {
        const digits = onlyDigits(raw);
        if (digits.length >= 8 && digits.length <= 14) {
          query = query.or(`ean.eq.${digits},nome.ilike.%${raw}%`);
        } else {
          const safe = raw.replace(/,/g, " ");
          query = query.or(
            `nome.ilike.%${safe}%,laboratorio.ilike.%${safe}%,categoria.ilike.%${safe}%,apresentacao.ilike.%${safe}%`
          );
        }
      }

      if (stockMode === "gt0") query = query.gt("estoque", 0);
      if (stockMode === "eq0") query = query.eq("estoque", 0);

      query = query.order("estoque", { ascending: false }).order("nome", { ascending: true });

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, count, error } = await query.range(from, to);
      if (error) throw error;

      const baseRows = (data || []) as ProdutoPorto[];
      const ids = baseRows.map((r) => r.produto_id).filter(Boolean);

      let flagMap = new Map<string, { ativo_site: boolean; ativo_pdv: boolean }>();
      if (ids.length) {
        const { data: flags, error: flagsError } = await supabase
          .from(STORE_TABLE)
          .select("produto_id,ativo_site,ativo_pdv")
          .eq("farmacia_slug", FARMACIA_SLUG)
          .in("produto_id", ids);
        if (flagsError) throw flagsError;
        flagMap = new Map(
          (flags || []).map((f: any) => [
            String(f.produto_id),
            { ativo_site: !!f.ativo_site, ativo_pdv: !!f.ativo_pdv },
          ])
        );
      }

      setRows(
        baseRows.map((r) => ({
          ...r,
          ativo_site: flagMap.get(String(r.produto_id))?.ativo_site ?? false,
          ativo_pdv: flagMap.get(String(r.produto_id))?.ativo_pdv ?? false,
        }))
      );
      setTotal(count || 0);
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar produtos da Porto/FV.");
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
  }, [q, stockMode]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function patchLoja(produtoId: string, patch: Record<string, unknown>) {
    const { error } = await supabase
      .from(STORE_TABLE)
      .upsert(
        { farmacia_slug: FARMACIA_SLUG, produto_id: produtoId, ...patch },
        { onConflict: "farmacia_slug,produto_id" }
      );
    if (error) throw error;
  }

  async function toggleQuick(produtoId: string, patch: Record<string, unknown>) {
    try {
      setSavingId(produtoId);
      await patchLoja(produtoId, patch);
      await load();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar alteração no FV.");
    } finally {
      setSavingId(null);
    }
  }

  async function changeEstoque(produtoId: string, delta: number) {
    const current = rows.find((r) => r.produto_id === produtoId)?.estoque ?? 0;
    const next = Math.max(0, Number(current) + delta);
    await toggleQuick(produtoId, { estoque: next });
  }

  async function openEdit(p: ProdutoPorto) {
    try {
      const { data, error } = await supabase.from(PROD_TABLE).select("pmc").eq("id", p.produto_id).single();
      if (error) throw error;
      setEditing({ ...p, pmc: data?.pmc ?? null });
    } catch {
      setEditing({ ...p, pmc: null });
    }
  }

  async function saveEdit() {
    if (!editing) return;
    const id = editing.produto_id;

    try {
      setSavingId(id);
      const ean = onlyDigits(editing.ean || "");
      if (ean.length < 8) return alert("EAN inválido.");
      if (!editing.nome.trim()) return alert("Nome é obrigatório.");

      // 1) Atualiza catálogo master do FV
      const { error: masterError } = await supabase
        .from(PROD_TABLE)
        .update({
          ean,
          nome: editing.nome.trim(),
          laboratorio: editing.laboratorio?.trim() || null,
          categoria: editing.categoria?.trim() || null,
          apresentacao: editing.apresentacao?.trim() || null,
          pmc: toNum(editing.pmc) ?? 0,
          imagens: Array.isArray(editing.imagens) ? editing.imagens.filter(Boolean) : null,
        })
        .eq("id", id);
      if (masterError) throw masterError;

      // 2) Atualiza/vincula a Porto no FV
      await patchLoja(id, {
        ativo: !!editing.disponivel_farmacia,
        ativo_site: !!editing.ativo_site,
        ativo_pdv: !!editing.ativo_pdv,
        estoque: Math.max(0, Number(toInt(editing.estoque) ?? 0)),
        preco_venda: toNum(editing.preco_venda),
        em_promocao: !!editing.em_promocao,
        preco_promocional: editing.em_promocao ? toNum(editing.preco_promocional) : null,
        percentual_off: toNum(editing.percentual_off),
        destaque_home: !!editing.destaque_home,
      });

      setEditing(null);
      await load();
      alert("Produto salvo e atualizado no FV.");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao salvar produto no FV.");
    } finally {
      setSavingId(null);
    }
  }

  async function createNovo() {
    try {
      setSavingId("novo");
      const ean = onlyDigits(novo.ean);
      if (ean.length < 8) return alert("EAN inválido (mínimo 8 dígitos).");
      if (!novo.nome.trim()) return alert("Nome é obrigatório.");

      const imagens = safeJsonArray(novo.imagensText);

      // procura no FV para não duplicar o EAN
      const { data: found, error: findError } = await supabase
        .from(PROD_TABLE)
        .select("id")
        .eq("ean", ean)
        .limit(1);
      if (findError) throw findError;

      let produtoId = found?.[0]?.id as string | undefined;

      if (!produtoId) {
        const { data: created, error: createError } = await supabase
          .from(PROD_TABLE)
          .insert({
            ean,
            nome: novo.nome.trim(),
            laboratorio: novo.laboratorio.trim() || null,
            categoria: novo.categoria.trim() || null,
            apresentacao: novo.apresentacao.trim() || null,
            pmc: toNum(novo.pmc) ?? 0,
            imagens,
            ativo: true,
          })
          .select("id")
          .single();
        if (createError) throw createError;
        produtoId = created?.id;
      } else {
        // se já existe no FV, atualiza os dados gerais
        const { error: updateMaster } = await supabase
          .from(PROD_TABLE)
          .update({
            nome: novo.nome.trim(),
            laboratorio: novo.laboratorio.trim() || null,
            categoria: novo.categoria.trim() || null,
            apresentacao: novo.apresentacao.trim() || null,
            pmc: toNum(novo.pmc) ?? 0,
            imagens,
          })
          .eq("id", produtoId);
        if (updateMaster) throw updateMaster;
      }

      if (!produtoId) throw new Error("Não foi possível obter o produto_id.");

      // vincula/atualiza a Drogarias Porto no marketplace FV
      await patchLoja(produtoId, {
        ativo: novo.ativo,
        ativo_site: novo.ativo_site,
        ativo_pdv: novo.ativo_pdv,
        estoque: Math.max(0, Number(toInt(novo.estoque) ?? 0)),
        preco_venda: toNum(novo.preco_venda),
        em_promocao: novo.em_promocao,
        preco_promocional: novo.em_promocao ? toNum(novo.preco_promocional) : null,
        percentual_off: toNum(novo.percentual_off),
        destaque_home: novo.destaque_home,
      });

      setNovo({
        ean: "",
        nome: "",
        laboratorio: "",
        categoria: "",
        apresentacao: "",
        pmc: "",
        preco_venda: "",
        estoque: "0",
        em_promocao: false,
        preco_promocional: "",
        percentual_off: "",
        destaque_home: false,
        ativo: true,
        ativo_site: true,
        ativo_pdv: true,
        imagensText: "",
      });
      setQ(ean);
      setPage(1);
      await load();
      alert("Produto cadastrado na Porto e acrescentado ao FV.");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao criar produto.");
    } finally {
      setSavingId(null);
    }
  }

  async function retirarDaLoja(produtoId: string) {
    if (!confirm("Retirar este produto da Drogarias Porto Loja 2? O cadastro master do FV será mantido.")) return;
    try {
      setDeletingId(produtoId);
      const { error } = await supabase
        .from(STORE_TABLE)
        .delete()
        .eq("farmacia_slug", FARMACIA_SLUG)
        .eq("produto_id", produtoId);
      if (error) throw error;
      await load();
    } catch (e) {
      console.error(e);
      alert("Erro ao retirar produto da loja.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div>
            <div className="font-extrabold text-gray-900">Drogarias Porto • Produtos</div>
            <div className="text-[11px] font-bold text-green-700">Loja 2 • sincronizado com FV Marketplace</div>
          </div>
          <div className="flex-1" />
          <Link href="/drogariasporto/admin" className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-sm">
            Admin
          </Link>
          <button onClick={load} className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-sm">
            ↻ Atualizar
          </button>
          <button onClick={onSair} className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-sm">
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-3xl p-4 text-sm text-green-900">
          <b>Integração ativa:</b> tudo que você cadastrar ou editar nesta página atualiza o catálogo FV e o vínculo da Drogarias Porto Loja 2.
          Preço e estoque continuam exclusivos desta loja.
        </div>

        <div className="bg-white border rounded-3xl p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1">
              <div className="text-xs font-bold text-gray-600">Buscar</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nome, EAN, laboratório, categoria ou apresentação..."
                className="mt-1 w-full rounded-2xl border px-4 py-2.5 outline-none focus:ring-4 focus:ring-blue-100"
              />
              <select
                value={stockMode}
                onChange={(e) => setStockMode(e.target.value as "all" | "gt0" | "eq0")}
                className="mt-3 rounded-xl border px-3 py-2 text-sm font-bold bg-white"
              >
                <option value="all">Estoque: todos</option>
                <option value="gt0">Somente com estoque</option>
                <option value="eq0">Somente zerados</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Resumo label="Total" value={String(total)} />
              <Resumo label="Página" value={`${page}/${pages}`} />
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-3xl p-4 shadow-sm">
          <div className="font-extrabold text-gray-900">+ Novo produto • já cadastra no FV</div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-3">
            <Field label="EAN" className="md:col-span-2">
              <input value={novo.ean} onChange={(e) => setNovo((p) => ({ ...p, ean: e.target.value }))} className="input" placeholder="789..." />
            </Field>
            <Field label="Nome" className="md:col-span-4">
              <input value={novo.nome} onChange={(e) => setNovo((p) => ({ ...p, nome: e.target.value }))} className="input" placeholder="Nome do produto" />
            </Field>
            <Field label="Laboratório" className="md:col-span-2">
              <input value={novo.laboratorio} onChange={(e) => setNovo((p) => ({ ...p, laboratorio: e.target.value }))} className="input" />
            </Field>
            <Field label="Categoria" className="md:col-span-2">
              <input value={novo.categoria} onChange={(e) => setNovo((p) => ({ ...p, categoria: e.target.value }))} className="input" />
            </Field>
            <Field label="Apresentação" className="md:col-span-2">
              <input value={novo.apresentacao} onChange={(e) => setNovo((p) => ({ ...p, apresentacao: e.target.value }))} className="input" />
            </Field>
            <Field label="PMC catálogo" className="md:col-span-2">
              <input value={novo.pmc} onChange={(e) => setNovo((p) => ({ ...p, pmc: e.target.value }))} className="input" placeholder="12,90" />
            </Field>
            <Field label="Preço Porto" className="md:col-span-2">
              <input value={novo.preco_venda} onChange={(e) => setNovo((p) => ({ ...p, preco_venda: e.target.value }))} className="input" placeholder="9,90" />
            </Field>
            <Field label="Estoque inicial" className="md:col-span-2">
              <input value={novo.estoque} onChange={(e) => setNovo((p) => ({ ...p, estoque: e.target.value }))} className="input" placeholder="0" />
            </Field>
            <Field label="Promo?" className="md:col-span-1">
              <SelectBool value={novo.em_promocao} onChange={(v) => setNovo((p) => ({ ...p, em_promocao: v }))} />
            </Field>
            <Field label="Preço promo" className="md:col-span-2">
              <input value={novo.preco_promocional} onChange={(e) => setNovo((p) => ({ ...p, preco_promocional: e.target.value }))} className="input" />
            </Field>
            <Field label="OFF (%)" className="md:col-span-1">
              <input value={novo.percentual_off} onChange={(e) => setNovo((p) => ({ ...p, percentual_off: e.target.value }))} className="input" />
            </Field>
            <Field label="Destaque?" className="md:col-span-1">
              <SelectBool value={novo.destaque_home} onChange={(v) => setNovo((p) => ({ ...p, destaque_home: v }))} />
            </Field>
            <Field label="Ativo no FV?" className="md:col-span-1">
              <SelectBool value={novo.ativo} onChange={(v) => setNovo((p) => ({ ...p, ativo: v }))} />
            </Field>
            <Field label="Ativo no Site Porto?" className="md:col-span-1">
              <SelectBool value={novo.ativo_site} onChange={(v) => setNovo((p) => ({ ...p, ativo_site: v }))} />
            </Field>
            <Field label="Ativo no PDV?" className="md:col-span-1">
              <SelectBool value={novo.ativo_pdv} onChange={(v) => setNovo((p) => ({ ...p, ativo_pdv: v }))} />
            </Field>
            <Field label="Imagens (JSON ou URLs separadas)" className="md:col-span-6">
              <textarea value={novo.imagensText} onChange={(e) => setNovo((p) => ({ ...p, imagensText: e.target.value }))} rows={2} className="input" placeholder='["https://.../foto.jpg"]' />
            </Field>
          </div>
          <button
            onClick={createNovo}
            disabled={savingId === "novo"}
            className={`mt-4 px-4 py-3 rounded-2xl font-extrabold ${savingId === "novo" ? "bg-gray-200 text-gray-500" : "bg-green-600 hover:bg-green-700 text-white"}`}
          >
            {savingId === "novo" ? "Salvando..." : "Criar na Porto + FV"}
          </button>
        </div>

        <div className="bg-white border rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-extrabold text-gray-900">Produtos {loading ? "• carregando…" : ""}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="navbtn" disabled={page <= 1}>←</button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} className="navbtn" disabled={page >= pages}>→</button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-gray-500">Carregando produtos...</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-gray-600">Nenhum produto vinculado à Porto Loja 2.</div>
          ) : (
            <div className="divide-y">
              {rows.map((p) => (
                <div key={p.produto_id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
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
                        <span className="font-extrabold text-blue-900">Porto: {brl(p.preco_venda)}</span>
                        {p.em_promocao && p.preco_promocional ? <span className="ml-2 text-green-700 font-extrabold">Promo: {brl(p.preco_promocional)}</span> : null}
                      </div>
                      <div className="text-xs mt-1">Estoque: <span className={`font-extrabold ${Number(p.estoque ?? 0) > 0 ? "text-green-700" : "text-red-600"}`}>{Number(p.estoque ?? 0)}</span></div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <button onClick={() => changeEstoque(p.produto_id, -1)} disabled={savingId === p.produto_id || Number(p.estoque ?? 0) <= 0} className="smallbtn">-1</button>
                    <button onClick={() => changeEstoque(p.produto_id, 1)} disabled={savingId === p.produto_id} className="smallbtn">+1</button>
                    <button onClick={() => changeEstoque(p.produto_id, 10)} disabled={savingId === p.produto_id} className="smallbtn">+10</button>
                    <QuickToggle label="FV" value={!!p.disponivel_farmacia} disabled={savingId === p.produto_id} onChange={(v) => toggleQuick(p.produto_id, { ativo: v })} />
                    <QuickToggle label="Site" value={!!p.ativo_site} disabled={savingId === p.produto_id} onChange={(v) => toggleQuick(p.produto_id, { ativo_site: v })} />
                    <QuickToggle label="PDV" value={!!p.ativo_pdv} disabled={savingId === p.produto_id} onChange={(v) => toggleQuick(p.produto_id, { ativo_pdv: v })} />
                    <QuickToggle label="Promo" value={!!p.em_promocao} disabled={savingId === p.produto_id} onChange={(v) => toggleQuick(p.produto_id, { em_promocao: v })} />
                    <QuickToggle label="Destaque" value={!!p.destaque_home} disabled={savingId === p.produto_id} onChange={(v) => toggleQuick(p.produto_id, { destaque_home: v })} />
                    <button onClick={() => openEdit(p)} className="smallbtn">Editar</button>
                    <button
                      onClick={() => retirarDaLoja(p.produto_id)}
                      disabled={deletingId === p.produto_id}
                      className={`px-3 py-2 rounded-xl font-extrabold text-sm ${deletingId === p.produto_id ? "bg-gray-200 text-gray-500" : "bg-red-600 hover:bg-red-700 text-white"}`}
                    >
                      {deletingId === p.produto_id ? "Retirando..." : "Retirar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {editing ? <EditModal p={editing} setP={setEditing} saving={savingId === editing.produto_id} onClose={() => setEditing(null)} onSave={saveEdit} /> : null}
      </div>

      <style jsx global>{`
        .input { width: 100%; border: 1px solid rgb(209 213 219); border-radius: 1rem; padding: .5rem .75rem; outline: none; background: white; }
        .input:focus { box-shadow: 0 0 0 4px rgb(219 234 254); }
        .smallbtn, .navbtn { padding: .5rem .75rem; border-radius: .75rem; border: 1px solid rgb(209 213 219); background: white; font-weight: 800; font-size: .875rem; }
        .smallbtn:hover, .navbtn:hover { background: rgb(249 250 251); }
        .smallbtn:disabled, .navbtn:disabled { opacity: .45; }
      `}</style>
    </div>
  );
}

function Resumo({ label, value }: { label: string; value: string }) {
  return <div className="bg-gray-50 border rounded-2xl px-4 py-2"><div className="text-[11px] text-gray-500 font-bold">{label}</div><div className="font-extrabold text-gray-900">{value}</div></div>;
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <div className={className}><div className="text-xs font-bold text-gray-600">{label}</div>{children}</div>;
}

function SelectBool({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return <select value={value ? "1" : "0"} onChange={(e) => onChange(e.target.value === "1")} className="input"><option value="0">Não</option><option value="1">Sim</option></select>;
}

function QuickToggle({ label, value, disabled, onChange }: { label: string; value: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      disabled={disabled}
      className={`px-3 py-2 rounded-xl border font-extrabold text-sm ${value ? "bg-green-600 text-white border-green-600" : "bg-white hover:bg-gray-50"} ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      {label}: {value ? "Sim" : "Não"}
    </button>
  );
}

function EditModal({ p, setP, saving, onClose, onSave }: { p: EditProduto; setP: (v: EditProduto | null) => void; saving: boolean; onClose: () => void; onSave: () => void }) {
  const imagensText = useMemo(() => (Array.isArray(p.imagens) && p.imagens.length ? JSON.stringify(p.imagens) : ""), [p.imagens]);

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[95vw] max-w-3xl max-h-[92vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl border">
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div><div className="font-extrabold text-gray-900">Editar produto</div><div className="text-[11px] font-bold text-green-700">Salvar atualiza Porto + FV</div></div>
          <button onClick={onClose} className="smallbtn">Fechar</button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
          <Field label="EAN" className="md:col-span-2"><input value={p.ean} onChange={(e) => setP({ ...p, ean: e.target.value })} className="input" /></Field>
          <Field label="Nome" className="md:col-span-4"><input value={p.nome} onChange={(e) => setP({ ...p, nome: e.target.value })} className="input" /></Field>
          <Field label="Laboratório" className="md:col-span-2"><input value={p.laboratorio || ""} onChange={(e) => setP({ ...p, laboratorio: e.target.value })} className="input" /></Field>
          <Field label="Categoria" className="md:col-span-2"><input value={p.categoria || ""} onChange={(e) => setP({ ...p, categoria: e.target.value })} className="input" /></Field>
          <Field label="Apresentação" className="md:col-span-2"><input value={p.apresentacao || ""} onChange={(e) => setP({ ...p, apresentacao: e.target.value })} className="input" /></Field>
          <Field label="PMC catálogo" className="md:col-span-2"><input value={String(p.pmc ?? "")} onChange={(e) => setP({ ...p, pmc: e.target.value as any })} className="input" /></Field>
          <Field label="Preço Porto" className="md:col-span-2"><input value={String(p.preco_venda ?? "")} onChange={(e) => setP({ ...p, preco_venda: e.target.value as any })} className="input" /></Field>
          <Field label="Estoque Porto" className="md:col-span-2"><input value={String(p.estoque ?? 0)} onChange={(e) => setP({ ...p, estoque: e.target.value as any })} className="input" /></Field>
          <Field label="Ativo no FV?" className="md:col-span-2"><SelectBool value={!!p.disponivel_farmacia} onChange={(v) => setP({ ...p, disponivel_farmacia: v })} /></Field>
          <Field label="Ativo no Site Porto?" className="md:col-span-2"><SelectBool value={!!p.ativo_site} onChange={(v) => setP({ ...p, ativo_site: v })} /></Field>
          <Field label="Ativo no PDV?" className="md:col-span-2"><SelectBool value={!!p.ativo_pdv} onChange={(v) => setP({ ...p, ativo_pdv: v })} /></Field>
          <Field label="Promo?" className="md:col-span-2"><SelectBool value={!!p.em_promocao} onChange={(v) => setP({ ...p, em_promocao: v })} /></Field>
          <Field label="Destaque?" className="md:col-span-2"><SelectBool value={!!p.destaque_home} onChange={(v) => setP({ ...p, destaque_home: v })} /></Field>
          <Field label="Preço promocional" className="md:col-span-2"><input value={String(p.preco_promocional ?? "")} onChange={(e) => setP({ ...p, preco_promocional: e.target.value as any })} className="input" /></Field>
          <Field label="Percentual OFF" className="md:col-span-2"><input value={String(p.percentual_off ?? "")} onChange={(e) => setP({ ...p, percentual_off: e.target.value as any })} className="input" /></Field>
          <Field label="Imagens (JSON ou URLs)" className="md:col-span-6"><textarea defaultValue={imagensText} onChange={(e) => setP({ ...p, imagens: safeJsonArray(e.target.value) })} rows={3} className="input" /></Field>
        </div>
        <div className="p-4 border-t flex gap-2 justify-end sticky bottom-0 bg-white">
          <button onClick={onClose} className="smallbtn">Cancelar</button>
          <button onClick={onSave} disabled={saving} className={`px-4 py-3 rounded-2xl font-extrabold ${saving ? "bg-gray-200 text-gray-500" : "bg-blue-700 hover:bg-blue-800 text-white"}`}>{saving ? "Salvando..." : "Salvar Porto + FV"}</button>
        </div>
      </div>
    </div>
  );
}
