"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import CadastroProdutoModal from "../../_components/CadastroProdutoModal";

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
  return (s || "").replace(/\D/g, "");
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

// ✅ contagens: head:true para não baixar linhas
async function countHead(builder: any) {
  const { count, error } = await builder.select("id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

function copyToClipboard(text: string) {
  if (typeof navigator === "undefined") return;
  navigator.clipboard?.writeText(text);
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

  // ✅ modal cadastrar produto
  const [openCad, setOpenCad] = useState(false);
  const [cadDefaults, setCadDefaults] = useState<any>(null);

  // ✅ seleção em lote (por ID)
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);
  const selectedCount = selectedIds.length;

  // ✅ "modelo" pra clonar promo
  const [promoTemplate, setPromoTemplate] = useState<FVProduto | null>(null);

  // ✅ sempre comece com .select() para liberar eq/or/not corretamente
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
    if (precoZerado === "nao") qb = qb.not("pmc", "is", null).neq("pmc", 0);

    return qb;
  }

  function applySearch(qb: any) {
    const t = q.trim();
    if (!t) return qb;

    const digits = onlyDigits(t);

    // EAN exato quando só número e tamanho típico
    const tNoSpace = t.replace(/\s/g, "");
    if (digits && digits.length >= 8 && digits.length <= 14 && digits === tNoSpace) {
      return qb.eq("ean", digits);
    }

    // números misturado: OR (ean eq digits) + nome ilike
    if (digits.length >= 8 && digits.length <= 14) {
      return qb.or(`ean.eq.${digits},nome.ilike.%${t}%`);
    }

    return qb.ilike("nome", `%${t}%`);
  }

  async function loadOptions() {
    try {
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

      setRows((data || []) as FVProduto[]);
      setTotalFound(count || 0);

      // ✅ limpa seleção das linhas que não estão na página
      setSelected((prev) => {
        const keep = new Set((data || []).map((r: any) => r.id));
        const next: Record<string, boolean> = {};
        Object.keys(prev).forEach((id) => {
          if (keep.has(id) && prev[id]) next[id] = true;
        });
        return next;
      });
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

  // reload quando filtros mudarem
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadTable();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, ativo, promo, home, precoZerado, categoria, laboratorio, pageSize]);

  useEffect(() => {
    loadTable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(totalFound / pageSize));
  const isSearching = !!q.trim();
  const digitsSearch = onlyDigits(q.trim());

  const pageRowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelectedOnPage = useMemo(() => {
    if (!rows.length) return false;
    return rows.every((r) => !!selected[r.id]);
  }, [rows, selected]);

  function toggleSelectAllOnPage() {
    setSelected((prev) => {
      const next = { ...prev };
      const turnOn = !allSelectedOnPage;
      rows.forEach((r) => (next[r.id] = turnOn));
      return next;
    });
  }

  function limpar() {
    setQ("");
    setAtivo("todos");
    setPromo("todos");
    setHome("todos");
    setPrecoZerado("todos");
    setCategoria("");
    setLaboratorio("");
    setPage(1);
  }

  async function applyBulkUpdate(patch: Partial<FVProduto>) {
    if (selectedIds.length === 0) return;

    const ok = confirm(`Aplicar alteração em lote em ${selectedIds.length} itens?`);
    if (!ok) return;

    try {
      const { error } = await supabase.from("fv_produtos").update(patch).in("id", selectedIds);
      if (error) throw error;

      await loadKpis();
      await loadTable();
      alert("Alterações aplicadas ✅");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro no lote.");
    }
  }

  async function clonarPromoEmLote() {
    if (!promoTemplate) {
      alert("Escolha 1 produto como modelo (Clonar promo) primeiro.");
      return;
    }
    if (selectedIds.length === 0) {
      alert("Selecione pelo menos 1 item.");
      return;
    }

    const pr = precos(promoTemplate);

    const ok = confirm(
      `Clonar promoção do modelo:\n${promoTemplate.nome}\n\nAplicar em ${selectedIds.length} itens selecionados?`
    );
    if (!ok) return;

    try {
      const payload: any = {
        em_promocao: pr.emPromo,
        preco_promocional: pr.emPromo ? (promoTemplate.preco_promocional || null) : null,
        percentual_off: pr.emPromo ? pr.off : 0,
      };

      const { error } = await supabase.from("fv_produtos").update(payload).in("id", selectedIds);
      if (error) throw error;

      await loadKpis();
      await loadTable();
      alert("Promo clonada ✅");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao clonar promo.");
    }
  }

  // ✅ se buscou EAN exato e não encontrou, oferece cadastrar
  const showCadastrarEan =
    isSearching && digitsSearch.length >= 8 && digitsSearch.length <= 14 && !loading && totalFound === 0;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-blue-950">Admin FV — Produtos</h1>
            <p className="text-sm text-gray-600 mt-1">
              Busca por <b>EAN (exato)</b> ou nome • filtros • seleção em lote • promo rápida • imagens
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setCadDefaults(null);
                setOpenCad(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold"
            >
              + Produto
            </button>

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
              onClick={limpar}
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
                {selectedCount ? (
                  <>
                    {" "}
                    • selecionados: <b>{selectedCount}</b>
                  </>
                ) : null}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
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

            {showCadastrarEan ? (
              <div className="md:col-span-12">
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-sm text-yellow-900">
                    Não encontrei o EAN <b className="font-mono">{digitsSearch}</b>. Quer cadastrar agora?
                  </div>
                  <button
                    onClick={() => {
                      setCadDefaults({ ean: digitsSearch, ativo: true });
                      setOpenCad(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-extrabold"
                  >
                    Cadastrar EAN
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Ações em lote */}
        <div className="mt-4 bg-white border rounded-3xl p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="font-extrabold text-blue-950">Ações em lote</div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={toggleSelectAllOnPage}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-sm"
              >
                {allSelectedOnPage ? "Desmarcar página" : "Selecionar página"}
              </button>

              <button
                disabled={!selectedCount}
                onClick={() => applyBulkUpdate({ ativo: true })}
                className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm disabled:opacity-50"
              >
                Ativar
              </button>

              <button
                disabled={!selectedCount}
                onClick={() => applyBulkUpdate({ ativo: false })}
                className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm disabled:opacity-50"
              >
                Desativar
              </button>

              <button
                disabled={!selectedCount}
                onClick={() => applyBulkUpdate({ destaque_home: true })}
                className="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-sm disabled:opacity-50"
              >
                Home ON
              </button>

              <button
                disabled={!selectedCount}
                onClick={() => applyBulkUpdate({ destaque_home: false })}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-sm disabled:opacity-50"
              >
                Home OFF
              </button>

              <button
                disabled={!selectedCount}
                onClick={clonarPromoEmLote}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm disabled:opacity-50"
              >
                Clonar promo
              </button>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Selecione itens na tabela (checkbox). “Clonar promo” usa o produto marcado como <b>Modelo</b>.
          </div>

          {promoTemplate ? (
            <div className="mt-3 text-sm bg-purple-50 border border-purple-200 text-purple-900 px-3 py-2 rounded-2xl">
              Modelo de promo: <b>{promoTemplate.nome}</b> • EAN <span className="font-mono">{promoTemplate.ean}</span>
            </div>
          ) : null}
        </div>

        {/* tabela */}
        <div className="mt-6 bg-white border rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-extrabold text-blue-950">Produtos</h2>
              <p className="text-sm text-gray-600">
                Edite preço, status e imagens direto aqui. EAN sempre visível.
              </p>
            </div>

            {err ? (
              <div className="text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl">{err}</div>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full text-sm">
              <thead className="bg-gray-50 border-t border-b">
                <tr className="text-left">
                  <Th>
                    <input
                      type="checkbox"
                      checked={allSelectedOnPage}
                      onChange={toggleSelectAllOnPage}
                      title="Selecionar todos da página"
                    />
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
                  rows.map((r) => (
                    <Row
                      key={r.id}
                      r={r}
                      selected={!!selected[r.id]}
                      onToggleSelected={(v) => setSelected((prev) => ({ ...prev, [r.id]: v }))}
                      onSaved={async () => {
                        await loadTable();
                        await loadKpis();
                      }}
                      onSetPromoTemplate={() => setPromoTemplate(r)}
                      onQuickCadFromRow={() => {
                        setCadDefaults({
                          ean: r.ean,
                          nome: r.nome,
                          laboratorio: r.laboratorio || "",
                          categoria: r.categoria || "",
                          apresentacao: r.apresentacao || "",
                          pmc: r.pmc,
                          ativo: r.ativo ?? true,
                        });
                        setOpenCad(true);
                      }}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 md:p-5 text-xs text-gray-500">
            Dica: use <b>Categoria</b> e <b>Laboratório</b> para organizar rapidamente a home.
          </div>
        </div>
      </div>

      {/* ✅ Modal Cadastrar */}
      <CadastroProdutoModal
        open={openCad}
        onClose={() => setOpenCad(false)}
        defaults={cadDefaults || undefined}
        onSaved={() => {
          loadKpis();
          loadTable();
        }}
      />
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

function Row({
  r,
  selected,
  onToggleSelected,
  onSaved,
  onSetPromoTemplate,
}: {
  r: FVProduto;
  selected: boolean;
  onToggleSelected: (v: boolean) => void;
  onSaved: () => void;
  onSetPromoTemplate: () => void;
  onQuickCadFromRow: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const [pmc, setPmc] = useState<number>(Number(r.pmc || 0));
  const [emPromo, setEmPromo] = useState<boolean>(!!r.em_promocao);
  const [precoPromo, setPrecoPromo] = useState<number>(Number(r.preco_promocional || 0));
  const [ativo, setAtivo] = useState<boolean>(!!r.ativo);
  const [home, setHome] = useState<boolean>(!!r.destaque_home);
  const [imagens, setImagens] = useState<string[]>(Array.isArray(r.imagens) ? r.imagens : []);

  const pr = useMemo(() => {
    const mock: FVProduto = {
      ...r,
      pmc,
      em_promocao: emPromo,
      preco_promocional: precoPromo,
      ativo,
      destaque_home: home,
      imagens,
    };
    return precos(mock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pmc, emPromo, precoPromo, ativo, home, imagens]);

  async function salvar() {
    setSaving(true);
    try {
      const payload: any = {
        pmc: Number.isFinite(pmc) ? pmc : null,
        em_promocao: !!emPromo,
        preco_promocional: emPromo ? (Number.isFinite(precoPromo) ? precoPromo : null) : null,
        ativo: !!ativo,
        destaque_home: !!home,
        imagens: imagens?.length ? imagens : null,
        percentual_off: pr.emPromo && pr.off > 0 ? pr.off : 0,
      };

      const { error } = await supabase.from("fv_produtos").update(payload).eq("id", r.id);
      if (error) throw error;

      onSaved();
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const productLink = `/fv/produtos/${r.ean}`;

  return (
    <tr className="border-t align-top">
      <td className="px-4 py-4">
        <input type="checkbox" checked={selected} onChange={(e) => onToggleSelected(e.target.checked)} />
      </td>

      <td className="px-4 py-4">
        <div className="w-14 h-14 bg-gray-50 border rounded-xl flex items-center justify-center overflow-hidden">
          <Image src={firstImg(imagens)} alt={r.nome || "Produto"} width={56} height={56} className="object-contain" />
        </div>
      </td>

      <td className="px-4 py-4 font-mono text-xs whitespace-nowrap">{r.ean}</td>

      <td className="px-4 py-4">
        <div className="font-bold text-blue-950 line-clamp-2">{r.nome}</div>
        {r.apresentacao ? <div className="text-xs text-gray-500 line-clamp-1">{r.apresentacao}</div> : null}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Link href={productLink} className="text-xs text-blue-700 hover:underline">
            Ver no site →
          </Link>
          <button
            onClick={() => copyToClipboard(typeof window !== "undefined" ? `${window.location.origin}${productLink}` : productLink)}
            className="text-xs px-2 py-1 rounded-lg border bg-white hover:bg-gray-50 font-extrabold"
            title="Copiar link do produto"
          >
            Copiar link
          </button>
        </div>
      </td>

      <td className="px-4 py-4 text-xs text-gray-600">{r.laboratorio || "—"}</td>
      <td className="px-4 py-4 text-xs text-gray-600">{r.categoria || "—"}</td>

      <td className="px-4 py-4">
        <input
          type="number"
          value={Number.isFinite(pmc) ? pmc : 0}
          onChange={(e) => setPmc(Number(e.target.value))}
          className="w-28 bg-white border rounded-xl px-3 py-2 text-sm"
        />
        <div className="text-[11px] text-gray-500 mt-1">{brl(pmc)}</div>
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Toggle checked={emPromo} onChange={setEmPromo} label="Promo" />
          <input
            type="number"
            value={Number.isFinite(precoPromo) ? precoPromo : 0}
            onChange={(e) => setPrecoPromo(Number(e.target.value))}
            className={`w-28 bg-white border rounded-xl px-3 py-2 text-sm ${!emPromo ? "opacity-50" : ""}`}
            disabled={!emPromo}
          />
        </div>
        <div className="text-[11px] text-gray-500 mt-1">{emPromo ? `Por ${brl(precoPromo)}` : "—"}</div>
      </td>

      <td className="px-4 py-4">
        {pr.emPromo && pr.off > 0 ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-600 text-white text-xs font-extrabold">
            {pr.off}% OFF
          </span>
        ) : (
          <span className="text-xs text-gray-500">—</span>
        )}
      </td>

      <td className="px-4 py-4">
        <Toggle checked={ativo} onChange={setAtivo} label="Ativo" />
      </td>

      <td className="px-4 py-4">
        <Toggle checked={home} onChange={setHome} label="Home" />
      </td>

      <td className="px-4 py-4">
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

      <td className="px-4 py-4">
        <div className="flex flex-col gap-2">
          <button
            onClick={salvar}
            disabled={saving}
            className="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>

          <ImagesEditor imagens={imagens} setImagens={setImagens} />

          <button
            onClick={onSetPromoTemplate}
            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold"
            title="Define este produto como modelo para 'Clonar promo'"
          >
            Modelo (promo)
          </button>

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
                  Depois clique em <b>Salvar</b> na linha do produto.
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
