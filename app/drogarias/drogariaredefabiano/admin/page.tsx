"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FARMACIA_SLUG = "drogariaredefabiano";
const SENHA_ADMIN = "102030";

const VIEW = "fv_produtos_loja_view";
const WRITE_TABLE = "fv_farmacia_produtos";

// ✅ 50 itens por tela (paginação)
const PAGE_SIZE = 50;

type ViewRow = {
  farmacia_slug: string;
  produto_id: string;

  ean: string | null;
  nome: string | null;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;

  imagens: any | null;
  disponivel_farmacia: boolean | null;

  estoque: number | null;
  preco_venda: number | null;

  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  destaque_home: boolean | null;
};

type RowUI = ViewRow & {
  _dirty?: boolean;
  _saving?: boolean;
  _error?: string | null;
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizeImgs(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {}
  }
  return [];
}

function firstImg(v: any) {
  const arr = normalizeImgs(v);
  return arr.length > 0 ? arr[0] : "/produtos/caixa-padrao.png";
}

function stockBadge(n: number) {
  if (n <= 0) return "text-red-700 bg-red-50 border-red-200";
  if (n <= 5) return "text-amber-800 bg-amber-50 border-amber-200";
  return "text-emerald-800 bg-emerald-50 border-emerald-200";
}

export default function AdminPageFabiano() {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ✅ agora a tela carrega SÓ a página atual
  const [rows, setRows] = useState<RowUI[]>([]);
  const rowsRef = useRef<RowUI[]>([]);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // filtros
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [somenteAtivos, setSomenteAtivos] = useState(false);
  const [somenteZerados, setSomenteZerados] = useState(false);

  // paginação
  const [page, setPage] = useState(1); // 1..N
  const [totalCount, setTotalCount] = useState<number>(0);

  // seleção + massa (aplica só na página atual selecionada)
  const [selecionados, setSelecionados] = useState<Record<string, boolean>>({});
  const selecionadosIds = useMemo(
    () => Object.entries(selecionados).filter(([, v]) => v).map(([k]) => k),
    [selecionados]
  );

  const [massEstoque, setMassEstoque] = useState("");
  const [massPreco, setMassPreco] = useState("");
  const [massAtivar, setMassAtivar] = useState<"nao" | "sim" | "">("");

  // autosave debounce por produto
  const timersRef = useRef<Record<string, any>>({});

  function toast(s: string) {
    setToastMsg(s);
    window.clearTimeout((toast as any)._t);
    (toast as any)._t = window.setTimeout(() => setToastMsg(null), 2200);
  }

  function autenticar() {
    if (senha === SENHA_ADMIN) {
      setAutenticado(true);
      setSenha("");
    } else {
      alert("Senha incorreta!");
    }
  }

  const totalPages = useMemo(() => {
    const n = Math.ceil((totalCount || 0) / PAGE_SIZE);
    return Math.max(1, n || 1);
  }, [totalCount]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  // ==========================
  // ✅ FETCH SERVER-SIDE (paginação + filtros)
  // ==========================
  async function carregar(p = page) {
    try {
      setCarregando(true);

      const termo = busca.trim();
      const digits = onlyDigits(termo);

      const from = (p - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let q = supabase
        .from(VIEW)
        .select(
          `
          farmacia_slug,
          produto_id,
          ean,
          nome,
          laboratorio,
          categoria,
          apresentacao,
          imagens,
          disponivel_farmacia,
          estoque,
          preco_venda,
          em_promocao,
          preco_promocional,
          percentual_off,
          destaque_home
        `,
          { count: "exact" }
        )
        .eq("farmacia_slug", FARMACIA_SLUG);

      if (categoria) q = q.eq("categoria", categoria);
      if (somenteAtivos) q = q.eq("disponivel_farmacia", true);
      if (somenteZerados) q = q.lte("estoque", 0);

      // busca: se número (6+) -> EAN; senão -> nome/lab/apresentacao
      if (termo) {
        if (digits.length >= 6 && digits === termo.replace(/\s/g, "")) {
          q = q.ilike("ean", `%${digits}%`);
        } else {
          // OR robusto
          const safe = termo.replace(/,/g, " ").trim();
          q = q.or(
            `nome.ilike.%${safe}%,laboratorio.ilike.%${safe}%,apresentacao.ilike.%${safe}%,ean.ilike.%${safe}%`
          );
        }
      }

      // ordenação e paginação real
      q = q.order("nome", { ascending: true }).range(from, to);

      const { data, error, count } = await q;
      if (error) throw error;

      setTotalCount(Number(count || 0));

      const list = (data || []).map((r: any) => ({
        ...r,
        _dirty: false,
        _saving: false,
        _error: null,
      })) as RowUI[];

      setRows(list);

      // limpa seleção ao mudar página/filtro (pra não aplicar massa no item errado)
      setSelecionados({});
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao carregar.");
    } finally {
      setCarregando(false);
    }
  }

  // ✅ quando autentica, carrega página 1
  useEffect(() => {
    if (!autenticado) return;
    setPage(1);
    // carrega com page=1
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    carregar(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado]);

  // ✅ debounce de filtros -> volta pra página 1 e recarrega
  useEffect(() => {
    if (!autenticado) return;
    const t = setTimeout(() => {
      setPage(1);
      carregar(1);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, categoria, somenteAtivos, somenteZerados, autenticado]);

  // ✅ quando muda página manualmente
  useEffect(() => {
    if (!autenticado) return;
    carregar(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // categorias: pra não baixar 17k só pra montar o select,
  // vamos extrair categorias da página atual + deixar opção livre.
  const categorias = useMemo(() => {
    const set = new Set(rows.map((r) => r.categoria).filter(Boolean) as string[]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  // ==========================
  // EDIÇÃO LOCAL + AUTOSAVE
  // ==========================
  function setField(produto_id: string, patch: Partial<RowUI>, autosave = true) {
    setRows((prev) =>
      prev.map((x) =>
        x.produto_id === produto_id ? { ...x, ...patch, _dirty: true, _error: null } : x
      )
    );
    if (autosave) agendarSalvar(produto_id);
  }

  function agendarSalvar(produto_id: string, ms = 650) {
    if (timersRef.current[produto_id]) clearTimeout(timersRef.current[produto_id]);
    timersRef.current[produto_id] = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      salvarAgora(produto_id);
      timersRef.current[produto_id] = null;
    }, ms);
  }

  async function salvarAgora(produto_id: string) {
    const row = rowsRef.current.find((r) => r.produto_id === produto_id);
    if (!row) return;

    const payload = {
      farmacia_slug: FARMACIA_SLUG,
      produto_id: row.produto_id,
      ativo: !!row.disponivel_farmacia,
      estoque: Math.max(0, Number(row.estoque || 0)),
      preco_venda: row.preco_venda == null ? null : Number(row.preco_venda),
      em_promocao: !!row.em_promocao,
      preco_promocional: row.preco_promocional == null ? null : Number(row.preco_promocional),
      percentual_off: row.percentual_off == null ? null : Number(row.percentual_off),
      destaque_home: !!row.destaque_home,
    };

    setRows((prev) =>
      prev.map((x) => (x.produto_id === produto_id ? { ...x, _saving: true, _error: null } : x))
    );

    try {
      const { error } = await supabase
        .from(WRITE_TABLE)
        .upsert(payload, { onConflict: "farmacia_slug,produto_id" });

      if (error) throw error;

      setRows((prev) =>
        prev.map((x) =>
          x.produto_id === produto_id ? { ...x, _saving: false, _dirty: false, _error: null } : x
        )
      );
      toast("✅ Salvo");
    } catch (e: any) {
      console.error(e);
      setRows((prev) =>
        prev.map((x) =>
          x.produto_id === produto_id
            ? { ...x, _saving: false, _error: e?.message || "Erro ao salvar" }
            : x
        )
      );
      toast("⚠️ Erro ao salvar");
    }
  }

  function toggleAll(checked: boolean) {
    const map: Record<string, boolean> = {};
    rows.forEach((r) => (map[r.produto_id] = checked));
    setSelecionados(map);
  }

  async function aplicarEmMassa() {
    if (selecionadosIds.length === 0) return alert("Selecione itens.");

    const estoqueVal = massEstoque.trim() === "" ? null : Number(massEstoque);
    const precoVal = massPreco.trim() === "" ? null : Number(massPreco);
    const ativarVal = massAtivar === "" ? null : massAtivar === "sim";

    setRows((prev) =>
      prev.map((x) => {
        if (!selecionados[x.produto_id]) return x;
        const patch: Partial<RowUI> = {};
        if (estoqueVal != null && !Number.isNaN(estoqueVal)) patch.estoque = Math.max(0, estoqueVal);
        if (precoVal != null && !Number.isNaN(precoVal)) patch.preco_venda = precoVal;
        if (ativarVal != null) patch.disponivel_farmacia = ativarVal;
        return { ...x, ...patch, _dirty: true, _error: null };
      })
    );

    // salva apenas os selecionados da página atual
    for (const id of selecionadosIds) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await salvarAgora(id);
    }

    toast("✅ Massa aplicada");
  }

  // ==========================
  // UI
  // ==========================
  if (!autenticado) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-sm text-center border">
          <h2 className="text-xl font-bold mb-1 text-blue-700">Admin — Drogaria Rede Fabiano</h2>
          <p className="text-sm text-gray-600 mb-4">Controle de estoque / preço / ativo</p>

          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite a senha"
            className="border w-full rounded-xl px-3 py-2 mb-3 text-center"
          />

          <button
            onClick={autenticar}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl w-full font-semibold"
          >
            Entrar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">Administração — {FARMACIA_SLUG}</h1>
            <p className="text-sm text-gray-600">
              50 itens por página. Pesquise para achar no catálogo (17k+). Salva automático e também manual.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => carregar(page)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
            >
              Atualizar
            </button>
            <button
              onClick={() => {
                setBusca("");
                setCategoria("");
                setSomenteAtivos(false);
                setSomenteZerados(false);
                setMassAtivar("");
                setMassEstoque("");
                setMassPreco("");
                setPage(1);
              }}
              className="bg-white hover:bg-gray-100 border px-4 py-2 rounded-xl font-semibold"
            >
              Limpar
            </button>
          </div>
        </div>

        {toastMsg && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl">
            {toastMsg}
          </div>
        )}

        {/* filtros */}
        <div className="mt-5 bg-white border rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-3">
              <label className="text-xs text-gray-600 font-semibold">Buscar</label>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="EAN (só números) ou nome/lab/apresentação..."
                className="w-full border rounded-xl px-3 py-2"
              />
              <div className="text-[11px] text-gray-500 mt-1">
                Se digitar só números (6+), filtra por EAN. Senão busca em nome/lab/apresentação.
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="text-xs text-gray-600 font-semibold">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full border rounded-xl px-3 py-2"
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-gray-500 mt-1">Dica: pesquise e depois selecione.</div>
            </div>

            <div className="md:col-span-2 flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={somenteAtivos} onChange={(e) => setSomenteAtivos(e.target.checked)} />
                Somente ativos
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={somenteZerados} onChange={(e) => setSomenteZerados(e.target.checked)} />
                Só zerados
              </label>
            </div>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-sm text-gray-700">
              Total encontrados: <b>{totalCount}</b> • Página <b>{page}</b> / <b>{totalPages}</b>
            </div>

            <div className="flex gap-2">
              <button
                disabled={!canPrev || carregando}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`px-3 py-2 rounded-xl border text-sm font-semibold ${
                  !canPrev || carregando ? "bg-gray-50 text-gray-400" : "bg-white hover:bg-gray-50"
                }`}
              >
                ◀ Anterior
              </button>

              <button
                disabled={!canNext || carregando}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={`px-3 py-2 rounded-xl border text-sm font-semibold ${
                  !canNext || carregando ? "bg-gray-50 text-gray-400" : "bg-white hover:bg-gray-50"
                }`}
              >
                Próxima ▶
              </button>
            </div>
          </div>
        </div>

        {/* massa */}
        <div className="mt-4 bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700">
                Selecionados (página): <span className="text-blue-700">{selecionadosIds.length}</span>
              </label>
              <button
                onClick={() => toggleAll(true)}
                className="text-sm px-3 py-1 rounded-xl border bg-white hover:bg-gray-50"
              >
                Marcar todos (página)
              </button>
              <button
                onClick={() => toggleAll(false)}
                className="text-sm px-3 py-1 rounded-xl border bg-white hover:bg-gray-50"
              >
                Desmarcar
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                value={massEstoque}
                onChange={(e) => setMassEstoque(e.target.value)}
                placeholder="Estoque (massa)"
                className="border rounded-xl px-3 py-2 w-full sm:w-44"
                type="number"
                min={0}
              />
              <input
                value={massPreco}
                onChange={(e) => setMassPreco(e.target.value)}
                placeholder="Preço venda (massa)"
                className="border rounded-xl px-3 py-2 w-full sm:w-52"
                type="number"
                step="0.01"
              />
              <select
                value={massAtivar}
                onChange={(e) => setMassAtivar(e.target.value as any)}
                className="border rounded-xl px-3 py-2 w-full sm:w-44"
              >
                <option value="">Ativo (massa)</option>
                <option value="sim">Ativar</option>
                <option value="nao">Inativar</option>
              </select>

              <button
                onClick={aplicarEmMassa}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>

        {/* tabela */}
        <div className="mt-4 bg-white border rounded-2xl shadow-sm overflow-x-auto">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="bg-blue-50 border-b text-gray-700">
              <tr>
                <th className="p-3 text-left">Sel</th>
                <th className="p-3 text-left">Produto</th>
                <th className="p-3 text-left">EAN</th>
                <th className="p-3 text-left">Categoria</th>
                <th className="p-3 text-center">Ativo</th>
                <th className="p-3 text-center">Destaque</th>
                <th className="p-3 text-center">Estoque</th>
                <th className="p-3 text-right">Preço</th>
                <th className="p-3 text-center">Promo</th>
                <th className="p-3 text-right">Preço Promo</th>
                <th className="p-3 text-right">% Off</th>
                <th className="p-3 text-center">Salvar</th>
              </tr>
            </thead>

            <tbody>
              {carregando && (
                <tr>
                  <td colSpan={12} className="p-6 text-center text-gray-600">
                    Carregando...
                  </td>
                </tr>
              )}

              {!carregando && rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-6 text-center text-gray-600">
                    Nada encontrado.
                  </td>
                </tr>
              )}

              {!carregando &&
                rows.map((r) => {
                  const est = Math.max(0, Number(r.estoque || 0));
                  const ativo = !!r.disponivel_farmacia;

                  return (
                    <tr key={r.produto_id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={!!selecionados[r.produto_id]}
                          onChange={(e) =>
                            setSelecionados((prev) => ({
                              ...prev,
                              [r.produto_id]: e.target.checked,
                            }))
                          }
                        />
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border">
                            <Image
                              src={firstImg(r.imagens)}
                              alt={r.nome || "Produto"}
                              width={48}
                              height={48}
                              className="object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate max-w-[340px]">{r.nome || "—"}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[340px]">
                              {r.laboratorio || "—"}
                              {r.apresentacao ? ` • ${r.apresentacao}` : ""}
                            </div>
                            {r._error && <div className="text-xs text-red-600 mt-1">{r._error}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-gray-700">{r.ean || "—"}</td>
                      <td className="p-3 text-gray-700">{r.categoria || "—"}</td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={ativo}
                          onChange={(e) => setField(r.produto_id, { disponivel_farmacia: e.target.checked })}
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!r.destaque_home}
                          onChange={(e) => setField(r.produto_id, { destaque_home: e.target.checked })}
                        />
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={est}
                            onChange={(e) => setField(r.produto_id, { estoque: Number(e.target.value || 0) })}
                            className="border rounded-xl px-2 py-1 w-24 text-center"
                          />
                          <span className={`text-xs px-2 py-1 rounded-full border ${stockBadge(est)}`}>
                            {est <= 0 ? "ZERADO" : est <= 5 ? "BAIXO" : "OK"}
                          </span>
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={r.preco_venda ?? ""}
                          onChange={(e) =>
                            setField(r.produto_id, { preco_venda: e.target.value === "" ? null : Number(e.target.value) })
                          }
                          className="border rounded-xl px-2 py-1 w-32 text-right"
                          placeholder="R$"
                        />
                        <div className="text-[11px] text-gray-500 mt-1">
                          {r.preco_venda != null ? brl(Number(r.preco_venda)) : "—"}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!r.em_promocao}
                          onChange={(e) => setField(r.produto_id, { em_promocao: e.target.checked })}
                        />
                      </td>

                      <td className="p-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={r.preco_promocional ?? ""}
                          onChange={(e) =>
                            setField(r.produto_id, {
                              preco_promocional: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          className="border rounded-xl px-2 py-1 w-32 text-right"
                          placeholder="R$"
                        />
                      </td>

                      <td className="p-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={r.percentual_off ?? ""}
                          onChange={(e) =>
                            setField(r.produto_id, { percentual_off: e.target.value === "" ? null : Number(e.target.value) })
                          }
                          className="border rounded-xl px-2 py-1 w-24 text-right"
                          placeholder="%"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => salvarAgora(r.produto_id)}
                          disabled={!!r._saving}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                            r._saving
                              ? "bg-gray-100 text-gray-500"
                              : r._dirty
                              ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          }`}
                          title={r._dirty ? "Tem alterações pendentes" : "Tudo salvo"}
                        >
                          {r._saving ? "Salvando..." : r._dirty ? "Salvar" : "OK"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          <div className="p-4 border-t text-xs text-gray-600">
            ✅ 50 itens por página • busca server-side • sem travar navegador • autosave com debounce + botão manual por linha.
          </div>
        </div>
      </div>
    </main>
  );
}
