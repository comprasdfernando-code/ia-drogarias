"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type FVProduto = {
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
};

type Tog = "todos" | "sim" | "nao";

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

function calcOff(pmc?: number | null, promo?: number | null) {
  const a = Number(pmc || 0);
  const b = Number(promo || 0);
  if (!a || !b || b >= a) return 0;
  return Math.round(((a - b) / a) * 100);
}

function precos(p: FVProduto) {
  const pmc = Number(p.pmc || 0);
  const promo = Number(p.preco_promocional || 0);
  const emPromo = !!p.em_promocao && promo > 0 && (!pmc || promo < pmc);

  const final = emPromo ? promo : pmc;

  const offDb = Number(p.percentual_off || 0);
  const off = emPromo ? (offDb > 0 ? offDb : calcOff(pmc, promo)) : 0;

  return { pmc, promo, emPromo, final, off };
}

function buildProductLink(ean: string) {
  return `/fv/produtos/${ean}`;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export default function AdminProdutosPage() {
  // filtros
  const [q, setQ] = useState("");
  const [ativo, setAtivo] = useState<Tog>("todos");
  const [promo, setPromo] = useState<Tog>("todos");
  const [home, setHome] = useState<Tog>("todos");
  const [precoZerado, setPrecoZerado] = useState<Tog>("todos");
  const [categoria, setCategoria] = useState("");
  const [laboratorio, setLaboratorio] = useState("");

  // paginação
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // dados
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<FVProduto[]>([]);
  const [totalFound, setTotalFound] = useState(0);

  // seleção (para salvar em lote / ativar em lote etc.)
  const [selected, setSelected] = useState<Record<string, boolean>>({}); // id -> bool
  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);
  const allOnPageSelected = useMemo(
    () => rows.length > 0 && rows.every((r) => !!selected[r.id]),
    [rows, selected]
  );
  const someOnPageSelected = useMemo(
    () => rows.some((r) => !!selected[r.id]) && !allOnPageSelected,
    [rows, selected, allOnPageSelected]
  );

  // kpis
  const [kpis, setKpis] = useState({
    total: 0,
    ativos: 0,
    emPromo: 0,
    home: 0,
    precoZerado: 0,
  });

  // options
  const [cats, setCats] = useState<string[]>([]);
  const [labs, setLabs] = useState<string[]>([]);

  const [err, setErr] = useState<string | null>(null);

  // lote: clonar promo (fonte)
  const [cloneFromId, setCloneFromId] = useState<string>("");

  // lote: estados de loading
  const [savingBatch, setSavingBatch] = useState(false);
  const [bulkBusy, setBulkBusy] = useState<null | string>(null);

  /**
   * ✅ IMPORTANTE:
   * Sempre comece o builder com .select() para liberar .eq/.or/.not corretamente.
   * Aqui retornamos um query builder já com select básico, e o loadTable usa .range().
   */
  function buildQueryBaseSelect() {
    let qb = supabase
      .from("fv_produtos")
      .select(
        "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens",
        { count: "exact" }
      );

    // boolean filters
    if (ativo === "sim") qb = qb.eq("ativo", true);
    if (ativo === "nao") qb = qb.eq("ativo", false);

    if (promo === "sim") qb = qb.eq("em_promocao", true);
    if (promo === "nao") qb = qb.eq("em_promocao", false);

    if (home === "sim") qb = qb.eq("destaque_home", true);
    if (home === "nao") qb = qb.eq("destaque_home", false);

    // categoria / lab
    const cat = categoria.trim();
    if (cat) qb = qb.ilike("categoria", `%${cat}%`);

    const lab = laboratorio.trim();
    if (lab) qb = qb.ilike("laboratorio", `%${lab}%`);

    // preço zerado (pmc null ou 0)
    if (precoZerado === "sim") qb = qb.or("pmc.is.null,pmc.eq.0");

    // "não" = pmc não é null E pmc != 0
    if (precoZerado === "nao") qb = qb.not("pmc", "is", null).neq("pmc", 0);

    return qb;
  }

  function applySearch(qb: any) {
    const t = q.trim();
    if (!t) return qb;

    const digits = onlyDigits(t);

    // EAN exato quando só número e tamanho típico
    if (digits && digits.length >= 8 && digits.length <= 14 && digits === t.replace(/\s/g, "")) {
      return qb.eq("ean", digits);
    }

    // se digitou números misturado, tenta OR (ean eq digits) + nome ilike
    if (digits.length >= 8 && digits.length <= 14) {
      return qb.or(`ean.eq.${digits},nome.ilike.%${t}%`);
    }

    return qb.ilike("nome", `%${t}%`);
  }

  async function loadOptions() {
    try {
      // amostra grande só pra montar combos (evita distinct/RPC)
      const { data, error } = await supabase.from("fv_produtos").select("categoria,laboratorio").limit(8000);
      if (error) throw error;

      const cset = new Set<string>();
      const lset = new Set<string>();

      (data || []).forEach((r: any) => {
        if (r.categoria) cset.add(String(r.categoria).trim());
        if (r.laboratorio) lset.add(String(r.laboratorio).trim());
      });

      setCats(Array.from(cset).filter(Boolean).sort((a, b) => a.localeCompare(b)));
      setLabs(Array.from(lset).filter(Boolean).sort((a, b) => a.localeCompare(b)));
    } catch (e: any) {
      console.error(e);
    }
  }

  // contagens: use head:true para não baixar linhas
  async function countHead(builder: any) {
    const { count, error } = await builder.select("id", { count: "exact", head: true });
    if (error) throw error;
    return count || 0;
  }

  async function loadKpis() {
    try {
      const total = await countHead(supabase.from("fv_produtos"));

      const ativosCount = await countHead(buildQueryBaseSelect().eq("ativo", true));
      const emPromoCount = await countHead(buildQueryBaseSelect().eq("em_promocao", true));
      const homeCount = await countHead(buildQueryBaseSelect().eq("destaque_home", true));
      const precoZeradoCount = await countHead(buildQueryBaseSelect().or("pmc.is.null,pmc.eq.0"));

      setKpis({
        total,
        ativos: ativosCount,
        emPromo: emPromoCount,
        home: homeCount,
        precoZerado: precoZeradoCount,
      });
    } catch (e: any) {
      console.error(e);
    }
  }

  function clearSelectionNotOnPage(nextRows: FVProduto[]) {
    // mantém seleção global, mas remove ids que não existem mais no dataset atual? (opcional)
    // aqui vamos manter seleção global, e só limpar quando clicar "Limpar seleção"
    void nextRows;
  }

  async function loadTable() {
    setErr(null);
    setLoading(true);

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let qb = buildQueryBaseSelect();
      qb = applySearch(qb);

      const { data, count, error } = await qb.order("nome", { ascending: true }).range(from, to);
      if (error) throw error;

      const arr = (data || []) as FVProduto[];
      setRows(arr);
      setTotalFound(count || 0);
      clearSelectionNotOnPage(arr);
    } catch (e: any) {
      console.error(e);
      setRows([]);
      setTotalFound(0);
      setErr(e?.message || "Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }

  // init
  useEffect(() => {
    loadOptions();
    loadKpis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload tabela quando filtros mudarem (exceto page)
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadTable();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, ativo, promo, home, precoZerado, categoria, laboratorio, pageSize]);

  // reload tabela quando page mudar
  useEffect(() => {
    loadTable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(totalFound / pageSize));

  function limparFiltros() {
    setQ("");
    setAtivo("todos");
    setPromo("todos");
    setHome("todos");
    setPrecoZerado("todos");
    setCategoria("");
    setLaboratorio("");
    setPage(1);
  }

  function toggleSelectRow(id: string, v?: boolean) {
    setSelected((prev) => ({ ...prev, [id]: typeof v === "boolean" ? v : !prev[id] }));
  }

  function toggleSelectAllOnPage() {
    const next = !allOnPageSelected;
    setSelected((prev) => {
      const copy = { ...prev };
      for (const r of rows) copy[r.id] = next;
      return copy;
    });
  }

  function clearSelection() {
    setSelected({});
  }

  // ============ LOTE ============
  async function saveBatchSelected() {
    if (selectedIds.length === 0) return;
    setSavingBatch(true);
    try {
      // pega os payloads alterados do cache local (editsById)
      const payloads = selectedIds
        .map((id) => editsById[id])
        .filter(Boolean)
        .map((p) => ({
          id: p.id,
          pmc: p.pmc,
          em_promocao: p.em_promocao,
          preco_promocional: p.preco_promocional,
          percentual_off: p.percentual_off,
          destaque_home: p.destaque_home,
          ativo: p.ativo,
          imagens: p.imagens && p.imagens.length ? p.imagens : null,
        }));

      if (payloads.length === 0) {
        alert("Nenhuma linha selecionada tem alterações pendentes.");
        return;
      }

      const { error } = await supabase.from("fv_produtos").upsert(payloads, { onConflict: "id" });
      if (error) throw error;

      await loadTable();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao salvar em lote.");
    } finally {
      setSavingBatch(false);
    }
  }

  async function bulkSet(field: "ativo" | "destaque_home" | "em_promocao", value: boolean) {
    if (selectedIds.length === 0) return;
    setBulkBusy(`${field}:${value ? "sim" : "nao"}`);
    try {
      const patch: any = { [field]: value };

      // se desligar promo em lote, zera preco_promocional e off
      if (field === "em_promocao" && value === false) {
        patch.preco_promocional = null;
        patch.percentual_off = 0;
      }

      const { error } = await supabase.from("fv_produtos").update(patch).in("id", selectedIds);
      if (error) throw error;

      await loadTable();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro no lote.");
    } finally {
      setBulkBusy(null);
    }
  }

  async function clonePromoToSelected() {
    if (!cloneFromId) {
      alert("Selecione o produto fonte para clonar a promo.");
      return;
    }
    if (selectedIds.length === 0) {
      alert("Selecione pelo menos 1 produto destino.");
      return;
    }

    // evita clonar nele mesmo (ok também, mas fica estranho)
    const targets = selectedIds.filter((id) => id !== cloneFromId);
    if (targets.length === 0) {
      alert("Selecione destinos diferentes do produto fonte.");
      return;
    }

    setBulkBusy("clonePromo");
    try {
      const src = rows.find((r) => r.id === cloneFromId);
      if (!src) {
        // se não estiver na página, busca no banco
        const { data, error } = await supabase
          .from("fv_produtos")
          .select("em_promocao,preco_promocional,percentual_off")
          .eq("id", cloneFromId)
          .single();
        if (error) throw error;

        const patch = {
          em_promocao: !!data.em_promocao,
          preco_promocional: data.preco_promocional,
          percentual_off: Number(data.percentual_off || 0),
        };

        const { error: e2 } = await supabase.from("fv_produtos").update(patch).in("id", targets);
        if (e2) throw e2;
      } else {
        const patch = {
          em_promocao: !!src.em_promocao,
          preco_promocional: src.preco_promocional,
          percentual_off: Number(src.percentual_off || 0),
        };
        const { error: e2 } = await supabase.from("fv_produtos").update(patch).in("id", targets);
        if (e2) throw e2;
      }

      await loadTable();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao clonar promo.");
    } finally {
      setBulkBusy(null);
    }
  }

  // ============ EDIÇÃO LOCAL (para salvar em lote) ============
  // guarda as edições por id (o que o admin mudou na UI)
  const [editsById, setEditsById] = useState<Record<string, FVProduto>>({});

  function setEdit(id: string, patch: Partial<FVProduto>) {
    setEditsById((prev) => {
      const base = prev[id] || rows.find((r) => r.id === id);
      if (!base) return prev;
      const merged: FVProduto = { ...base, ...patch } as FVProduto;

      // recalcula off coerente se estiver em promo
      const pr = precos(merged);
      merged.percentual_off = pr.emPromo && pr.off > 0 ? pr.off : 0;

      // se desligou promo, limpa preco_promocional e off
      if (!merged.em_promocao) {
        merged.preco_promocional = null;
        merged.percentual_off = 0;
      }

      return { ...prev, [id]: merged };
    });
  }

  function getRowView(r: FVProduto) {
    return editsById[r.id] || r;
  }

  function markSelectedFromRow(id: string) {
    // quando editar, auto-seleciona a linha (pra facilitar salvar em lote)
    setSelected((prev) => ({ ...prev, [id]: true }));
  }

  const selectedCount = selectedIds.length;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-blue-950">
              Admin FV — Produtos (V4)
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              EAN sempre visível • Seleção • Salvar em lote • Copiar link • Clonar promo
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                loadKpis();
                loadTable();
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold"
            >
              Atualizar
            </button>
            <button
              onClick={limparFiltros}
              className="px-4 py-2.5 rounded-xl bg-white border hover:bg-gray-50 font-extrabold"
            >
              Limpar filtros
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
          <Kpi label="Total" value={kpis.total} />
          <Kpi label="Ativos" value={kpis.ativos} />
          <Kpi label="Em promo" value={kpis.emPromo} />
          <Kpi label="Home" value={kpis.home} />
          <Kpi label="Preço zerado" value={kpis.precoZerado} />
        </div>

        {/* filtros */}
        <div className="mt-5 bg-white border rounded-3xl p-4 md:p-5 shadow-sm">
          <div className="grid md:grid-cols-12 gap-3">
            <div className="md:col-span-6">
              <label className="text-xs font-bold text-gray-700">Buscar (EAN ou nome)</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Digite EAN (só números) ou nome…"
                className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="mt-1 text-[11px] text-gray-500">
                Dica: se digitar só números (8–14 dígitos), busca <b>EAN exato</b>.
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-700">Ativo</label>
              <select
                value={ativo}
                onChange={(e) => setAtivo(e.target.value as Tog)}
                className="mt-1 w-full bg-white border rounded-2xl px-3 py-3"
              >
                <option value="todos">Todos</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-700">Promoção</label>
              <select
                value={promo}
                onChange={(e) => setPromo(e.target.value as Tog)}
                className="mt-1 w-full bg-white border rounded-2xl px-3 py-3"
              >
                <option value="todos">Todas</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-700">Destaque Home</label>
              <select
                value={home}
                onChange={(e) => setHome(e.target.value as Tog)}
                className="mt-1 w-full bg-white border rounded-2xl px-3 py-3"
              >
                <option value="todos">Todos</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>

            <div className="md:col-span-6">
              <label className="text-xs font-bold text-gray-700">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="mt-1 w-full bg-white border rounded-2xl px-3 py-3"
              >
                <option value="">Todas</option>
                {cats.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="text-xs font-bold text-gray-700">Laboratório</label>
              <select
                value={laboratorio}
                onChange={(e) => setLaboratorio(e.target.value)}
                className="mt-1 w-full bg-white border rounded-2xl px-3 py-3"
              >
                <option value="">Todos</option>
                {labs.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-700">Preço zerado</label>
              <select
                value={precoZerado}
                onChange={(e) => setPrecoZerado(e.target.value as Tog)}
                className="mt-1 w-full bg-white border rounded-2xl px-3 py-3"
              >
                <option value="todos">Todos</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>

            <div className="md:col-span-12 flex items-center justify-between gap-3 flex-wrap pt-1">
              <div className="text-sm text-gray-600">
                Mostrando <b>{rows.length}</b> de <b>{totalFound}</b>
                {q.trim() ? (
                  <>
                    {" "}
                    • busca: <b>{q.trim()}</b>
                  </>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">Itens/página</div>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white border rounded-xl px-3 py-2"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-2 rounded-xl border bg-white disabled:opacity-40"
                >
                  ←
                </button>

                <div className="px-3 py-2 rounded-xl border bg-white font-bold">
                  Página {page} / {totalPages}
                </div>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-2 rounded-xl border bg-white disabled:opacity-40"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AÇÕES EM LOTE */}
        <div className="mt-4 bg-white border rounded-3xl p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm text-gray-700">
                Selecionados: <b>{selectedCount}</b>
                {someOnPageSelected ? <span className="ml-2 text-xs text-gray-500">(parcial na página)</span> : null}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                Dica: ao editar um campo na linha, ela é auto-selecionada pra salvar em lote.
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={saveBatchSelected}
                disabled={savingBatch || selectedCount === 0}
                className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold disabled:opacity-50"
              >
                {savingBatch ? "Salvando lote…" : "Salvar em lote"}
              </button>

              <button
                onClick={() => bulkSet("ativo", true)}
                disabled={bulkBusy !== null || selectedCount === 0}
                className="px-3 py-2.5 rounded-xl border bg-white hover:bg-gray-50 font-extrabold disabled:opacity-50"
              >
                Ativar selecionados
              </button>

              <button
                onClick={() => bulkSet("ativo", false)}
                disabled={bulkBusy !== null || selectedCount === 0}
                className="px-3 py-2.5 rounded-xl border bg-white hover:bg-gray-50 font-extrabold disabled:opacity-50"
              >
                Desativar selecionados
              </button>

              <button
                onClick={() => bulkSet("destaque_home", true)}
                disabled={bulkBusy !== null || selectedCount === 0}
                className="px-3 py-2.5 rounded-xl border bg-white hover:bg-gray-50 font-extrabold disabled:opacity-50"
              >
                Colocar Home
              </button>

              <button
                onClick={() => bulkSet("destaque_home", false)}
                disabled={bulkBusy !== null || selectedCount === 0}
                className="px-3 py-2.5 rounded-xl border bg-white hover:bg-gray-50 font-extrabold disabled:opacity-50"
              >
                Tirar Home
              </button>

              <div className="flex items-center gap-2">
                <select
                  value={cloneFromId}
                  onChange={(e) => setCloneFromId(e.target.value)}
                  className="bg-white border rounded-xl px-3 py-2"
                  title="Produto fonte"
                >
                  <option value="">Clonar promo de… (fonte)</option>
                  {rows.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome?.slice(0, 48)}{r.nome && r.nome.length > 48 ? "…" : ""} • {r.ean}
                    </option>
                  ))}
                </select>

                <button
                  onClick={clonePromoToSelected}
                  disabled={bulkBusy !== null || selectedCount === 0 || !cloneFromId}
                  className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold disabled:opacity-50"
                  title="Copia em_promocao / preco_promocional / percentual_off do produto fonte para os selecionados"
                >
                  {bulkBusy === "clonePromo" ? "Clonando…" : "Clonar promo"}
                </button>
              </div>

              <button
                onClick={clearSelection}
                disabled={selectedCount === 0}
                className="px-3 py-2.5 rounded-xl border bg-white hover:bg-gray-50 font-extrabold disabled:opacity-50"
              >
                Limpar seleção
              </button>
            </div>
          </div>
        </div>

        {/* tabela */}
        <div className="mt-4 bg-white border rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-extrabold text-blue-950">Produtos</h2>
              <p className="text-sm text-gray-600">Selecione, edite e depois use “Salvar em lote”. EAN sempre visível.</p>
            </div>

            {err ? (
              <div className="text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl">
                {err}
              </div>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full text-sm">
              <thead className="bg-gray-50 border-t border-b">
                <tr className="text-left">
                  <Th>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someOnPageSelected;
                        }}
                        onChange={toggleSelectAllOnPage}
                        title="Selecionar todos na página"
                      />
                      <span>Sel.</span>
                    </div>
                  </Th>
                  <Th>Imagem</Th>
                  <Th>EAN</Th>
                  <Th>Nome</Th>
                  <Th>Lab</Th>
                  <Th>Categoria</Th>
                  <Th>PMC</Th>
                  <Th>Promo</Th>
                  <Th>%OFF</Th>
                  <Th>Ativo</Th>
                  <Th>Home</Th>
                  <Th>Preço</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={13} className="p-6 text-gray-600">
                      Carregando…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-6 text-gray-600">
                      Nenhum produto encontrado com esses filtros.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const view = getRowView(r);
                    return (
                      <RowV4
                        key={r.id}
                        r={r}
                        view={view}
                        selected={!!selected[r.id]}
                        onSelect={(v) => toggleSelectRow(r.id, v)}
                        onEdit={(patch) => {
                          setEdit(r.id, patch);
                          markSelectedFromRow(r.id);
                        }}
                        onSaved={loadTable}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 md:p-5 text-xs text-gray-500">
            Botões: <b>Copiar link</b> copia o caminho do produto no site • <b>Clonar promo</b> acelera campanhas.
          </div>
        </div>
      </div>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border rounded-2xl p-4 shadow-sm">
      <div className="text-xs font-bold text-gray-600">{label}</div>
      <div className="text-2xl font-extrabold text-blue-950 mt-1">{value}</div>
    </div>
  );
}

function Th({ children }: { children: any }) {
  return <th className="px-4 py-3 text-xs font-extrabold text-gray-700">{children}</th>;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
        checked ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700"
      }`}
      aria-label={label}
      title={label}
    >
      {checked ? "Sim" : "Não"}
    </button>
  );
}

function RowV4({
  r,
  view,
  selected,
  onSelect,
  onEdit,
  onSaved,
}: {
  r: FVProduto;
  view: FVProduto;
  selected: boolean;
  onSelect: (v: boolean) => void;
  onEdit: (patch: Partial<FVProduto>) => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const pr = useMemo(() => precos(view), [view]);

  async function salvarLinha() {
    setSaving(true);
    try {
      const payload: any = {
        pmc: Number.isFinite(Number(view.pmc)) ? Number(view.pmc) : null,
        em_promocao: !!view.em_promocao,
        preco_promocional: view.em_promocao ? (Number.isFinite(Number(view.preco_promocional)) ? Number(view.preco_promocional) : null) : null,
        ativo: !!view.ativo,
        destaque_home: !!view.destaque_home,
        imagens: view.imagens?.length ? view.imagens : null,
        percentual_off: pr.emPromo && pr.off > 0 ? pr.off : 0,
      };

      const { error } = await supabase.from("fv_produtos").update(payload).eq("id", r.id);
      if (error) throw error;

      onSaved();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function copiarLink() {
    const link = buildProductLink(r.ean);
    const ok = await copyToClipboard(link);
    if (!ok) alert("Não consegui copiar. Copie manualmente: " + link);
  }

  return (
    <tr className={`border-t ${selected ? "bg-blue-50/40" : ""}`}>
      <td className="px-4 py-3">
        <input type="checkbox" checked={selected} onChange={(e) => onSelect(e.target.checked)} />
      </td>

      <td className="px-4 py-3">
        <div className="w-14 h-14 bg-gray-50 border rounded-xl flex items-center justify-center overflow-hidden">
          <Image src={firstImg(view.imagens)} alt={r.nome || "Produto"} width={56} height={56} className="object-contain" />
        </div>
      </td>

      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{r.ean}</td>

      <td className="px-4 py-3">
        <div className="font-bold text-blue-950 line-clamp-2">{r.nome}</div>
        {r.apresentacao ? <div className="text-xs text-gray-500 line-clamp-1">{r.apresentacao}</div> : null}
        <Link href={buildProductLink(r.ean)} className="text-xs text-blue-700 hover:underline">
          Ver no site →
        </Link>
      </td>

      <td className="px-4 py-3 text-xs text-gray-600">{r.laboratorio || "—"}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{r.categoria || "—"}</td>

      <td className="px-4 py-3">
        <input
          type="number"
          value={Number(view.pmc || 0)}
          onChange={(e) => onEdit({ pmc: Number(e.target.value) || 0 })}
          className="w-28 bg-white border rounded-xl px-3 py-2 text-sm"
        />
        <div className="text-[11px] text-gray-500 mt-1">{brl(view.pmc)}</div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Toggle checked={!!view.em_promocao} onChange={(v) => onEdit({ em_promocao: v })} label="Promo" />
          <input
            type="number"
            value={Number(view.preco_promocional || 0)}
            onChange={(e) => onEdit({ preco_promocional: Number(e.target.value) || 0 })}
            className={`w-28 bg-white border rounded-xl px-3 py-2 text-sm ${!view.em_promocao ? "opacity-50" : ""}`}
            disabled={!view.em_promocao}
          />
        </div>
        <div className="text-[11px] text-gray-500 mt-1">
          {view.em_promocao ? `Por ${brl(view.preco_promocional)}` : "—"}
        </div>
      </td>

      <td className="px-4 py-3">
        {pr.emPromo && pr.off > 0 ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-600 text-white text-xs font-extrabold">
            {pr.off}% OFF
          </span>
        ) : (
          <span className="text-xs text-gray-500">—</span>
        )}
      </td>

      <td className="px-4 py-3">
        <Toggle checked={!!view.ativo} onChange={(v) => onEdit({ ativo: v })} label="Ativo" />
      </td>

      <td className="px-4 py-3">
        <Toggle checked={!!view.destaque_home} onChange={(v) => onEdit({ destaque_home: v })} label="Home" />
      </td>

      <td className="px-4 py-3">
        {pr.emPromo ? (
          <>
            <div className="text-xs text-gray-500">
              De <span className="line-through">{brl(pr.pmc)}</span>
            </div>
            <div className="font-extrabold text-blue-950">Por {brl(pr.final)}</div>
          </>
        ) : (
          <div className="font-extrabold text-blue-950">{brl(pr.final)}</div>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col gap-2">
          <button
            onClick={salvarLinha}
            disabled={saving}
            className="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar (linha)"}
          </button>

          <button
            onClick={copiarLink}
            className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-xs font-extrabold"
            title="Copia /fv/produtos/EAN"
          >
            Copiar link
          </button>

          <ImagesEditor imagens={Array.isArray(view.imagens) ? view.imagens : []} setImagens={(imgs) => onEdit({ imagens: imgs })} />

          <Link
            href={`/fv/admin/produtos/${r.id}`}
            className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-xs font-extrabold text-center"
          >
            Editar (página)
          </Link>
        </div>
      </td>
    </tr>
  );
}

function ImagesEditor({
  imagens,
  setImagens,
}: {
  imagens: string[];
  setImagens: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [txt, setTxt] = useState((imagens || []).join("\n"));

  useEffect(() => {
    setTxt((imagens || []).join("\n"));
  }, [imagens]);

  function apply() {
    const list = txt
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    setImagens(list);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-xs font-extrabold"
      >
        Imagens
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-lg overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-extrabold text-blue-950">Editar imagens</div>
              <button onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl border bg-white">
                Fechar
              </button>
            </div>

            <div className="p-4 grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-bold text-gray-700 mb-2">
                  Cole URLs (1 por linha). Salva como array em <code>imagens</code>.
                </div>
                <textarea
                  value={txt}
                  onChange={(e) => setTxt(e.target.value)}
                  className="w-full h-56 border rounded-2xl p-3 text-sm"
                  placeholder="https://…\nhttps://…"
                />
                <button
                  onClick={apply}
                  className="mt-3 w-full px-4 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold"
                >
                  Aplicar (não salva no banco ainda)
                </button>
                <div className="text-[11px] text-gray-500 mt-2">
                  Depois clique em <b>Salvar em lote</b> ou <b>Salvar (linha)</b>.
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-700 mb-2">Preview</div>
                <div className="grid grid-cols-3 gap-2">
                  {(txt || "")
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .slice(0, 9)
                    .map((url) => (
                      <div key={url} className="bg-gray-50 border rounded-2xl p-2 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="img" className="max-h-20 object-contain" />
                      </div>
                    ))}
                </div>
                {!txt.trim() ? <div className="text-sm text-gray-500 mt-4">Sem imagens.</div> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
