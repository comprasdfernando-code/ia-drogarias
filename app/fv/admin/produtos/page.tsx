"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  updated_at?: string | null;
};

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

function calcOff(pmc?: number | null, promo?: number | null) {
  const a = Number(pmc || 0);
  const b = Number(promo || 0);
  if (!a || !b || b >= a) return 0;
  return Math.round(((a - b) / a) * 100);
}

type SortKey = "nome" | "ean" | "pmc" | "preco_promocional" | "off" | "updated_at";
type SortDir = "asc" | "desc";

export default function AdminProdutosPage() {
  // filtros / busca
  const [q, setQ] = useState("");
  const [ativo, setAtivo] = useState<"" | "sim" | "nao">("");
  const [promo, setPromo] = useState<"" | "sim" | "nao">("");
  const [home, setHome] = useState<"" | "sim" | "nao">("");
  const [categoria, setCategoria] = useState("");
  const [laboratorio, setLaboratorio] = useState("");

  // combos
  const [categorias, setCategorias] = useState<string[]>([]);
  const [laboratorios, setLaboratorios] = useState<string[]>([]);

  // listagem
  const [rows, setRows] = useState<FVProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // paginação
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  // ordenação
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // contadores rápidos
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    promo: 0,
    home: 0,
    zerados: 0,
  });

  // edição inline
  const [draft, setDraft] = useState<Record<string, { pmc?: string; preco_promocional?: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const qDigits = useMemo(() => q.replace(/\D/g, ""), [q]);

  function resetPage() {
    setPage(1);
  }

  function clearFilters() {
    setQ("");
    setAtivo("");
    setPromo("");
    setHome("");
    setCategoria("");
    setLaboratorio("");
    setSortKey("updated_at");
    setSortDir("desc");
    setPage(1);
  }

  async function loadCombos() {
    // categorias
    const { data: catData } = await supabase
      .from("fv_produtos")
      .select("categoria")
      .not("categoria", "is", null)
      .limit(5000);

    const catSet = new Set<string>();
    (catData || []).forEach((x: any) => {
      const v = String(x.categoria || "").trim();
      if (v) catSet.add(v);
    });
    setCategorias(Array.from(catSet).sort((a, b) => a.localeCompare(b)));

    // laboratorios
    const { data: labData } = await supabase
      .from("fv_produtos")
      .select("laboratorio")
      .not("laboratorio", "is", null)
      .limit(5000);

    const labSet = new Set<string>();
    (labData || []).forEach((x: any) => {
      const v = String(x.laboratorio || "").trim();
      if (v) labSet.add(v);
    });
    setLaboratorios(Array.from(labSet).sort((a, b) => a.localeCompare(b)));
  }

  async function loadStats() {
    // Observação: Supabase não faz COUNT com filtros diferentes em uma única query.
    // Aqui fazemos 5 contagens simples. É admin; vale a pena.
    const base = supabase.from("fv_produtos").select("id", { count: "exact", head: true });

    const [{ count: totalC }, { count: ativosC }, { count: promoC }, { count: homeC }, { count: zeradosC }] =
      await Promise.all([
        base,
        supabase.from("fv_produtos").select("id", { count: "exact", head: true }).eq("ativo", true),
        supabase.from("fv_produtos").select("id", { count: "exact", head: true }).eq("em_promocao", true).eq("ativo", true),
        supabase.from("fv_produtos").select("id", { count: "exact", head: true }).eq("destaque_home", true).eq("ativo", true),
        supabase.from("fv_produtos").select("id", { count: "exact", head: true }).or("pmc.is.null,pmc.eq.0").eq("ativo", true),
      ]);

    setStats({
      total: totalC || 0,
      ativos: ativosC || 0,
      promo: promoC || 0,
      home: homeC || 0,
      zerados: zeradosC || 0,
    });
  }

  function buildQuery() {
    let query = supabase
      .from("fv_produtos")
      .select(
        "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens,updated_at",
        { count: "exact" }
      );

    // filtros
    if (ativo === "sim") query = query.eq("ativo", true);
    if (ativo === "nao") query = query.eq("ativo", false);

    if (promo === "sim") query = query.eq("em_promocao", true);
    if (promo === "nao") query = query.or("em_promocao.is.null,em_promocao.eq.false");

    if (home === "sim") query = query.eq("destaque_home", true);
    if (home === "nao") query = query.or("destaque_home.is.null,destaque_home.eq.false");

    if (categoria) query = query.eq("categoria", categoria);
    if (laboratorio) query = query.eq("laboratorio", laboratorio);

    // busca (EAN é indispensável)
    const t = q.trim();
    if (t) {
      // Se tiver cara de EAN (8-14 dígitos) -> EAN exato OU nome
      if (qDigits.length >= 8 && qDigits.length <= 14) {
        // EAN sempre exato (indispensável)
        // e mantém fallback por nome
        query = query.or(`ean.eq.${qDigits},nome.ilike.%${t}%`);
      } else {
        query = query.ilike("nome", `%${t}%`);
      }
    }

    // ordenação (OFF é calculado; usamos percentual_off como proxy quando existe)
    if (sortKey === "off") {
      query = query.order("percentual_off", { ascending: sortDir === "asc", nullsFirst: sortDir === "desc" });
      // fallback secundário
      query = query.order("updated_at", { ascending: false });
    } else {
      query = query.order(sortKey, { ascending: sortDir === "asc" });
    }

    return query;
  }

  async function loadList() {
    setLoading(true);
    setErro(null);

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const query = buildQuery().range(from, to);
      const { data, error, count } = await query;

      if (error) throw error;

      setRows((data || []) as FVProduto[]);
      setTotal(count || 0);
    } catch (e: any) {
      console.error(e);
      setErro(e?.message || "Erro ao carregar.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCombos();
    loadStats();
  }, []);

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortKey, sortDir, ativo, promo, home, categoria, laboratorio]);

  // debounce busca
  useEffect(() => {
    const timer = setTimeout(() => {
      resetPage();
      loadList();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function toggleSort(k: SortKey) {
    if (sortKey !== k) {
      setSortKey(k);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }

  function getOff(p: FVProduto) {
    const offDb = Number(p.percentual_off || 0);
    if (offDb > 0) return offDb;
    if (p.em_promocao && p.preco_promocional) return calcOff(p.pmc, p.preco_promocional);
    return 0;
  }

  async function quickToggle(id: string, field: "ativo" | "destaque_home" | "em_promocao", current: boolean | null) {
    const next = !Boolean(current);
    // regra: se desligar promoção, zera preço promo (opcional, mas evita sujeira)
    const patch: any = { [field]: next };
    if (field === "em_promocao" && !next) patch.preco_promocional = null;

    await supabase.from("fv_produtos").update(patch).eq("id", id);

    // refresh leve
    await Promise.all([loadList(), loadStats()]);
  }

  function setDraftField(id: string, field: "pmc" | "preco_promocional", value: string) {
    setDraft((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  }

  function getDraftValue(id: string, field: "pmc" | "preco_promocional", fallback: number | null) {
    const v = draft?.[id]?.[field];
    if (v !== undefined) return v;
    return fallback === null || fallback === undefined ? "" : String(fallback);
  }

  async function saveRow(p: FVProduto) {
    try {
      setSavingId(p.id);

      const d = draft[p.id] || {};
      const pmcStr = d.pmc ?? (p.pmc ?? "").toString();
      const promoStr = d.preco_promocional ?? (p.preco_promocional ?? "").toString();

      const pmc = pmcStr === "" ? null : Number(pmcStr);
      const preco_promocional = promoStr === "" ? null : Number(promoStr);

      // validações simples
      if (pmc !== null && Number.isNaN(pmc)) throw new Error("PMC inválido.");
      if (preco_promocional !== null && Number.isNaN(preco_promocional)) throw new Error("Preço promo inválido.");

      // se tem preço promo, marca em promoção automaticamente (padrão “admin rápido”)
      const em_promocao =
        preco_promocional !== null && preco_promocional > 0 && (pmc === null || preco_promocional < pmc)
          ? true
          : Boolean(p.em_promocao);

      // calcula %off e grava (mantém consistente pro front)
      const percentual_off =
        em_promocao && preco_promocional && pmc && preco_promocional < pmc ? calcOff(pmc, preco_promocional) : 0;

      const patch = {
        pmc,
        preco_promocional,
        em_promocao,
        percentual_off,
      };

      const { error } = await supabase.from("fv_produtos").update(patch).eq("id", p.id);
      if (error) throw error;

      // limpa draft dessa linha
      setDraft((prev) => {
        const copy = { ...prev };
        delete copy[p.id];
        return copy;
      });

      await Promise.all([loadList(), loadStats()]);
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar.");
    } finally {
      setSavingId(null);
    }
  }

  const headerSortIcon = (k: SortKey) => {
    if (sortKey !== k) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Topo */}
        <div className="bg-white border rounded-3xl p-4 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-blue-900">Admin FV — Produtos</h1>
              <p className="text-sm text-gray-600 mt-1">
                Busca por <b>EAN</b> (exato) ou nome • filtros • toggles • edição rápida
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  loadList();
                  loadStats();
                }}
                className="px-4 py-2 rounded-2xl border bg-white hover:bg-gray-50 font-semibold"
              >
                Atualizar
              </button>

              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-2xl border bg-white hover:bg-gray-50 font-semibold"
              >
                Limpar filtros
              </button>
            </div>
          </div>

          {/* Cards stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Ativos" value={stats.ativos} />
            <StatCard label="Em promo" value={stats.promo} />
            <StatCard label="Home" value={stats.home} />
            <StatCard label="Preço zerado" value={stats.zerados} />
          </div>

          {/* Busca + filtros */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5">
              <label className="text-xs font-bold text-gray-700">Buscar (EAN ou nome)</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ex: 789... (EAN) ou 'cimegripe'..."
                className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="text-[11px] text-gray-500 mt-1">
                Dica: se digitar só números (8–14 dígitos), o sistema busca <b>EAN exato</b>.
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-700">Ativo</label>
              <select
                value={ativo}
                onChange={(e) => {
                  setAtivo(e.target.value as any);
                  resetPage();
                }}
                className="mt-1 w-full bg-white border rounded-2xl px-3 py-3"
              >
                <option value="">Todos</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-700">Promoção</label>
              <select
                value={promo}
                onChange={(e) => {
                  setPromo(e.target.value as any);
                  resetPage();
                }}
                className="mt-1 w-full bg-white border rounded-2xl px-3 py-3"
              >
                <option value="">Todas</option>
                <option value="sim">Só em promo</option>
                <option value="nao">Sem promo</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-bold text-gray-700">Destaque Home</label>
              <select
                value={home}
                onChange={(e) => {
                  setHome(e.target.value as any);
                  resetPage();
                }}
                className="mt-1 w-full bg-white border rounded-2xl px-3 py-3"
              >
                <option value="">Todos</option>
                <option value="sim">Só Home</option>
                <option value="nao">Fora da Home</option>
              </select>
            </div>

            <div className="md:col-span-6">
              <label className="text-xs font-bold text-gray-700">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => {
                  setCategoria(e.target.value);
                  resetPage();
                }}
                className="mt-1 w-full bg-white border rounded-2xl px-3 py-3"
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-6">
              <label className="text-xs font-bold text-gray-700">Laboratório</label>
              <select
                value={laboratorio}
                onChange={(e) => {
                  setLaboratorio(e.target.value);
                  resetPage();
                }}
                className="mt-1 w-full bg-white border rounded-2xl px-3 py-3"
              >
                <option value="">Todos</option>
                {laboratorios.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paginação topo */}
          <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-gray-600">
              Mostrando <b>{rows.length}</b> de <b>{total}</b>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Itens/página</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border rounded-xl px-2 py-2 bg-white"
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
                className="px-3 py-2 rounded-xl border bg-white disabled:opacity-50"
              >
                ←
              </button>

              <div className="px-3 py-2 rounded-xl border bg-white text-sm">
                Página <b>{page}</b> / <b>{totalPages}</b>
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-2 rounded-xl border bg-white disabled:opacity-50"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="mt-5 bg-white border rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 border-b flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Produtos</h2>
              <p className="text-xs text-gray-600">Edite preços e status direto aqui. EAN sempre visível.</p>
            </div>

            <div className="text-xs text-gray-500">
              {loading ? "Carregando…" : erro ? `Erro: ${erro}` : " "}
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <Th>Imagem</Th>
                  <ThBtn onClick={() => toggleSort("ean")}>EAN {headerSortIcon("ean")}</ThBtn>
                  <ThBtn onClick={() => toggleSort("nome")}>Nome {headerSortIcon("nome")}</ThBtn>
                  <Th>Lab</Th>
                  <Th>Categoria</Th>
                  <ThBtn onClick={() => toggleSort("pmc")}>PMC {headerSortIcon("pmc")}</ThBtn>
                  <ThBtn onClick={() => toggleSort("preco_promocional")}>Promo {headerSortIcon("preco_promocional")}</ThBtn>
                  <ThBtn onClick={() => toggleSort("off")}>%OFF {headerSortIcon("off")}</ThBtn>
                  <ThBtn onClick={() => toggleSort("updated_at")}>Atualizado {headerSortIcon("updated_at")}</ThBtn>
                  <Th className="text-center">Ativo</Th>
                  <Th className="text-center">Home</Th>
                  <Th className="text-center">Promo</Th>
                  <Th className="text-center">Ações</Th>
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
                  rows.map((p) => {
                    const off = getOff(p);
                    const isSaving = savingId === p.id;

                    return (
                      <tr key={p.id} className="border-t hover:bg-gray-50/60">
                        <td className="p-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border flex items-center justify-center">
                            <Image
                              src={firstImg(p.imagens)}
                              alt={p.nome || "Produto"}
                              width={64}
                              height={64}
                              className="object-contain w-12 h-12"
                            />
                          </div>
                        </td>

                        <td className="p-3 font-mono text-xs">{p.ean}</td>

                        <td className="p-3">
                          <div className="font-semibold text-gray-900 line-clamp-1">{p.nome}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">{p.apresentacao || "—"}</div>
                        </td>

                        <td className="p-3 text-xs text-gray-700">{p.laboratorio || "—"}</td>
                        <td className="p-3 text-xs text-gray-700">{p.categoria || "—"}</td>

                        <td className="p-3">
                          <input
                            value={getDraftValue(p.id, "pmc", p.pmc)}
                            onChange={(e) => setDraftField(p.id, "pmc", e.target.value)}
                            className="w-28 border rounded-xl px-2 py-2 bg-white"
                            inputMode="decimal"
                          />
                          <div className="text-[11px] text-gray-500 mt-1">{brl(p.pmc)}</div>
                        </td>

                        <td className="p-3">
                          <input
                            value={getDraftValue(p.id, "preco_promocional", p.preco_promocional)}
                            onChange={(e) => setDraftField(p.id, "preco_promocional", e.target.value)}
                            className="w-28 border rounded-xl px-2 py-2 bg-white"
                            inputMode="decimal"
                          />
                          <div className="text-[11px] text-gray-500 mt-1">{brl(p.preco_promocional)}</div>
                        </td>

                        <td className="p-3">
                          {off > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-50 text-red-700 font-extrabold text-xs">
                              {off}% OFF
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">—</span>
                          )}
                        </td>

                        <td className="p-3 text-xs text-gray-600">
                          {p.updated_at ? new Date(p.updated_at).toLocaleString("pt-BR") : "—"}
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() => quickToggle(p.id, "ativo", p.ativo)}
                            className={`px-3 py-2 rounded-xl font-extrabold text-xs border ${
                              p.ativo ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"
                            }`}
                          >
                            {p.ativo ? "SIM" : "NÃO"}
                          </button>
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() => quickToggle(p.id, "destaque_home", p.destaque_home)}
                            className={`px-3 py-2 rounded-xl font-extrabold text-xs border ${
                              p.destaque_home ? "bg-yellow-50 text-yellow-800 border-yellow-200" : "bg-gray-50 text-gray-600 border-gray-200"
                            }`}
                          >
                            {p.destaque_home ? "HOME" : "—"}
                          </button>
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() => quickToggle(p.id, "em_promocao", p.em_promocao)}
                            className={`px-3 py-2 rounded-xl font-extrabold text-xs border ${
                              p.em_promocao ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50 text-gray-600 border-gray-200"
                            }`}
                          >
                            {p.em_promocao ? "ON" : "OFF"}
                          </button>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              disabled={isSaving}
                              onClick={() => saveRow(p)}
                              className="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs disabled:opacity-60"
                            >
                              {isSaving ? "Salvando…" : "Salvar"}
                            </button>

                            <Link
                              href={`/fv/admin/produtos/${p.id}`}
                              className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-xs"
                            >
                              Editar
                            </Link>

                            <Link
                              href={`/fv/produtos/${p.ean}`}
                              className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-xs"
                            >
                              Ver
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação footer */}
          <div className="p-4 md:p-5 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total: <b>{total}</b>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-2 rounded-xl border bg-white disabled:opacity-50"
              >
                ← Anterior
              </button>

              <div className="px-3 py-2 rounded-xl border bg-white text-sm">
                Página <b>{page}</b> / <b>{totalPages}</b>
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-2 rounded-xl border bg-white disabled:opacity-50"
              >
                Próxima →
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 border rounded-2xl p-3">
      <div className="text-[11px] font-bold text-gray-600">{label}</div>
      <div className="text-xl font-extrabold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function Th({ children, className = "" }: any) {
  return <th className={`text-left p-3 text-xs font-extrabold ${className}`}>{children}</th>;
}

function ThBtn({ children, onClick }: any) {
  return (
    <th className="text-left p-3 text-xs font-extrabold">
      <button onClick={onClick} className="hover:underline">
        {children}
      </button>
    </th>
  );
}
