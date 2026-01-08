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

    // ❗️"não" = pmc não é null E pmc != 0
    // O jeito mais estável é aplicar duas condições:
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
      const { data, error } = await supabase
        .from("fv_produtos")
        .select("categoria,laboratorio")
        .limit(8000);

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

  // ✅ contagens: use head:true para não baixar linhas
  async function countHead(builder: any) {
    const { count, error } = await builder.select("id", { count: "exact", head: true });
    if (error) throw error;
    return count || 0;
  }

  async function loadKpis() {
    try {
      // Total do banco (sem filtros)
      const total = await countHead(supabase.from("fv_produtos"));

      // Contagens respeitando filtros atuais de categoria/lab/busca? (aqui não, é KPI de visão geral com filtros de categoria/lab/preço etc.)
      // Se você quiser KPI com busca também, é só aplicar applySearch.
      const base = buildQueryBaseSelect();

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

      // (opcional) você pode usar `base` depois, se quiser KPI "Encontrados"
      void base;
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

      const { data, count, error } = await qb
        .order("nome", { ascending: true })
        .range(from, to);

      if (error) throw error;

      setRows((data || []) as FVProduto[]);
      setTotalFound(count || 0);
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

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-blue-950">
              Admin FV — Produtos
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Busca por <b>EAN (exato)</b> ou nome • filtros • toggles • edição rápida • imagens
            </p>
          </div>

          <div className="flex items-center gap-2">
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
                Dica: se digitar só números (8–14 dígitos), o sistema busca <b>EAN exato</b>.
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
              <div className="text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl">
                {err}
              </div>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-gray-50 border-t border-b">
                <tr className="text-left">
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
                    <td colSpan={12} className="p-6 text-gray-600">
                      Carregando…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-6 text-gray-600">
                      Nenhum produto encontrado com esses filtros.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => <Row key={r.id} r={r} onSaved={loadTable} />)
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 md:p-5 text-xs text-gray-500">
            Dica: use o filtro de <b>Categoria</b> e <b>Laboratório</b> para organizar rapidamente a home.
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

function Row({ r, onSaved }: { r: FVProduto; onSaved: () => void }) {
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

  return (
    <tr className="border-t">
      <td className="px-4 py-3">
        <div className="w-14 h-14 bg-gray-50 border rounded-xl flex items-center justify-center overflow-hidden">
          <Image src={firstImg(imagens)} alt={r.nome || "Produto"} width={56} height={56} className="object-contain" />
        </div>
      </td>

      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{r.ean}</td>

      <td className="px-4 py-3">
        <div className="font-bold text-blue-950 line-clamp-2">{r.nome}</div>
        {r.apresentacao ? <div className="text-xs text-gray-500 line-clamp-1">{r.apresentacao}</div> : null}
        <Link href={`/fv/produtos/${r.ean}`} className="text-xs text-blue-700 hover:underline">
          Ver no site →
        </Link>
      </td>

      <td className="px-4 py-3 text-xs text-gray-600">{r.laboratorio || "—"}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{r.categoria || "—"}</td>

      <td className="px-4 py-3">
        <input
          type="number"
          value={Number.isFinite(pmc) ? pmc : 0}
          onChange={(e) => setPmc(Number(e.target.value))}
          className="w-28 bg-white border rounded-xl px-3 py-2 text-sm"
        />
        <div className="text-[11px] text-gray-500 mt-1">{brl(pmc)}</div>
      </td>

      <td className="px-4 py-3">
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
        <Toggle checked={ativo} onChange={setAtivo} label="Ativo" />
      </td>

      <td className="px-4 py-3">
        <Toggle checked={home} onChange={setHome} label="Home" />
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
            onClick={salvar}
            disabled={saving}
            className="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>

          <ImagesEditor imagens={imagens} setImagens={setImagens} />

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
