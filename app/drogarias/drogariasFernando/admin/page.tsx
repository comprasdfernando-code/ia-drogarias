"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../../../lib/supabaseClient";

// 🔐 senha simples temporária
const SENHA_ADMIN = "admin123";

// loja associada
const LOJA_SLUG = "drogarias-fernando";

const LIMITE = 80;

type ProdutoLoja = {
  farmacia_slug: string;
  produto_id: string;

  // do catálogo (fv_produtos)
  ean: string;
  nome: string;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;
  imagens: string[] | null;

  // da loja (fv_farmacia_produtos)
  disponivel_farmacia: boolean | null; // ativo
  estoque: number | null;

  preco_venda: number | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  destaque_home: boolean | null;

  // (opcional) base PF/PMC se existir na view (se não existir, fica undefined)
  PF_18?: string | null;
  PMC_18?: string | null;
};

function brl(v: number | null | undefined) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback antigo
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  }
}

export default function AdminDrogariasFernando() {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");

  const [itens, setItens] = useState<ProdutoLoja[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // LOGIN simples
  function autenticar() {
    if (senha === SENHA_ADMIN) {
      setAutenticado(true);
      setSenha("");
    } else {
      alert("Senha incorreta!");
    }
  }

  const categorias = useMemo(() => {
    const set = new Set<string>();
    for (const p of itens) {
      if (p.categoria) set.add(String(p.categoria).trim());
    }
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [itens]);

  // 🔄 carregar produtos (pela view pronta)
  async function carregarProdutos() {
    try {
      setCarregando(true);
      setErr(null);
      setMsg(null);

      let query = supabase
        .from("fv_produtos_loja_view")
        .select(
          "farmacia_slug,produto_id,ean,nome,laboratorio,categoria,apresentacao,imagens,disponivel_farmacia,estoque,preco_venda,em_promocao,preco_promocional,percentual_off,destaque_home,PF_18,PMC_18"
        )
        .eq("farmacia_slug", LOJA_SLUG)
        .order("nome", { ascending: true })
        .limit(LIMITE);

      if (categoria) query = query.eq("categoria", categoria);

      const termo = busca.trim();
      if (termo) {
        const digits = onlyDigits(termo);

        // EAN exato se só números e tamanho típico
        if (digits.length >= 8 && digits.length <= 14 && digits === termo.replace(/\s/g, "")) {
          query = query.eq("ean", digits);
        } else if (digits.length >= 8 && digits.length <= 14) {
          query = query.or(`ean.eq.${digits},nome.ilike.%${termo}%`);
        } else {
          query = query.or(
            `nome.ilike.%${termo}%,laboratorio.ilike.%${termo}%,categoria.ilike.%${termo}%,apresentacao.ilike.%${termo}%`
          );
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      setItens((data || []) as ProdutoLoja[]);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Erro ao carregar produtos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (!autenticado) return;
    const t = setTimeout(carregarProdutos, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, busca, categoria]);

  // 💾 salvar alterações da linha (atualiza APENAS tabela da loja)
  async function salvarAlteracoes(p: ProdutoLoja) {
    try {
      setSalvandoId(p.produto_id);

      const payload: any = {
        preco_venda: p.preco_venda ?? null,
        estoque: Number.isFinite(Number(p.estoque)) ? Number(p.estoque) : 0,
        ativo: !!p.disponivel_farmacia,
        em_promocao: !!p.em_promocao,
        preco_promocional: p.em_promocao ? (p.preco_promocional ?? null) : null,
        percentual_off: p.percentual_off ?? 0,
        destaque_home: !!p.destaque_home,
      };

      const { error } = await supabase
        .from("fv_farmacia_produtos")
        .update(payload)
        .eq("farmacia_slug", LOJA_SLUG)
        .eq("produto_id", p.produto_id);

      if (error) throw error;

      setMsg(`✅ Salvo: ${p.nome}`);
      setTimeout(() => setMsg(null), 2500);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Erro ao salvar.");
      setTimeout(() => setErr(null), 3500);
    } finally {
      setSalvandoId(null);
    }
  }

  if (!autenticado) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-6 rounded-2xl border shadow-sm w-full max-w-sm text-center">
          <h2 className="text-xl font-extrabold text-blue-900">
            Painel Admin — Drogarias Fernando
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Acesso restrito
          </p>

          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite a senha"
            className="mt-5 border w-full rounded-xl px-3 py-3 text-center outline-none focus:ring-2 focus:ring-blue-200"
          />

          <button
            onClick={autenticar}
            className="mt-3 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-xl w-full font-extrabold"
          >
            Entrar
          </button>

          <div className="mt-3 text-[11px] text-gray-500">
            *Senha temporária (trocaremos por login de verdade depois)
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-blue-950">
              Administração — {LOJA_SLUG}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Edita <b>preço/estoque/ativo</b> sem mexer no catálogo geral. Busca por <b>EAN</b> ou nome.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={carregarProdutos}
              className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold"
            >
              Atualizar
            </button>
            <button
              onClick={() => {
                setBusca("");
                setCategoria("");
              }}
              className="px-4 py-2.5 rounded-xl bg-white border hover:bg-gray-50 font-extrabold"
            >
              Limpar
            </button>
          </div>
        </div>

        {(msg || err) && (
          <div className="mt-4 grid gap-2">
            {msg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl">
                {msg}
              </div>
            )}
            {err && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-xl">
                {err}
              </div>
            )}
          </div>
        )}

        {/* Filtros */}
        <div className="mt-5 bg-white border rounded-3xl p-4 md:p-5 shadow-sm">
          <div className="grid md:grid-cols-12 gap-3">
            <div className="md:col-span-7">
              <label className="text-xs font-bold text-gray-700">Buscar (EAN ou nome)</label>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite EAN (só números) ou nome…"
                className="mt-1 w-full bg-gray-50 border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="mt-1 text-[11px] text-gray-500">
                Dica: se digitar só números (8–14), faz <b>EAN exato</b>.
              </div>
            </div>

            <div className="md:col-span-5">
              <label className="text-xs font-bold text-gray-700">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="mt-1 w-full bg-white border rounded-2xl px-3 py-3"
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div className="mt-2 text-sm text-gray-600">
                {carregando ? "Carregando…" : <>Encontrados: <b>{itens.length}</b></>}
              </div>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="mt-6 bg-white border rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-extrabold text-blue-950">Produtos</h2>
              <p className="text-sm text-gray-600">
                Campos editáveis: <b>preço</b>, <b>estoque</b> e <b>ativo</b>. EAN sempre visível.
              </p>
            </div>
            <Link
              href="/fv"
              className="px-4 py-2.5 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-sm"
            >
              Ver FV →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-sm">
              <thead className="bg-gray-50 border-t border-b">
                <tr className="text-left">
                  <Th>Imagem</Th>
                  <Th>EAN</Th>
                  <Th>Nome</Th>
                  <Th>Categoria</Th>
                  <Th>Preço Venda</Th>
                  <Th>Estoque</Th>
                  <Th>Ativo</Th>
                  <Th>Promo</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-gray-600">
                      Carregando…
                    </td>
                  </tr>
                ) : itens.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-gray-600">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : (
                  itens.map((p) => (
                    <Row
                      key={p.produto_id}
                      p={p}
                      setItens={setItens}
                      onSave={() => salvarAlteracoes(p)}
                      saving={salvandoId === p.produto_id}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 md:p-5 text-xs text-gray-500">
            Segurança: este painel altera <b>somente</b> a tabela da loja (<code>fv_farmacia_produtos</code>), não mexe no catálogo geral.
          </div>
        </div>
      </div>
    </main>
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
  p,
  setItens,
  onSave,
  saving,
}: {
  p: ProdutoLoja;
  setItens: React.Dispatch<React.SetStateAction<ProdutoLoja[]>>;
  onSave: () => void;
  saving: boolean;
}) {
  function patch(id: string, patch: Partial<ProdutoLoja>) {
    setItens((prev) => prev.map((x) => (x.produto_id === id ? { ...x, ...patch } : x)));
  }

  return (
    <tr className="border-t">
      <td className="px-4 py-3">
        <div className="w-14 h-14 bg-gray-50 border rounded-xl flex items-center justify-center overflow-hidden">
          <Image
            src={firstImg(p.imagens)}
            alt={p.nome || "Produto"}
            width={56}
            height={56}
            className="object-contain"
          />
        </div>
      </td>

      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span>{p.ean}</span>
          <button
            className="text-[11px] px-2 py-1 rounded-lg border bg-white hover:bg-gray-50 font-bold"
            onClick={async () => {
              await copyToClipboard(p.ean);
            }}
            title="Copiar EAN"
          >
            Copiar
          </button>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="font-bold text-blue-950 line-clamp-2">{p.nome}</div>
        {p.apresentacao ? <div className="text-xs text-gray-500 line-clamp-1">{p.apresentacao}</div> : null}
        <div className="mt-1">
          <Link href={`/fv/produtos/${p.ean}`} className="text-xs text-blue-700 hover:underline">
            Ver no site →
          </Link>
        </div>
      </td>

      <td className="px-4 py-3 text-xs text-gray-600">{p.categoria || "—"}</td>

      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={p.preco_venda ?? ""}
          onChange={(e) => patch(p.produto_id, { preco_venda: Number(e.target.value) })}
          className="w-28 bg-white border rounded-xl px-3 py-2 text-sm text-right"
          placeholder="0,00"
        />
        <div className="text-[11px] text-gray-500 mt-1">{brl(p.preco_venda)}</div>
      </td>

      <td className="px-4 py-3">
        <input
          type="number"
          value={Number.isFinite(Number(p.estoque)) ? Number(p.estoque) : 0}
          onChange={(e) => patch(p.produto_id, { estoque: Number(e.target.value) })}
          className="w-20 bg-white border rounded-xl px-3 py-2 text-sm text-right"
          placeholder="0"
        />
      </td>

      <td className="px-4 py-3">
        <Toggle
          checked={!!p.disponivel_farmacia}
          onChange={(v) => patch(p.produto_id, { disponivel_farmacia: v })}
          label="Ativo"
        />
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Toggle
            checked={!!p.em_promocao}
            onChange={(v) => patch(p.produto_id, { em_promocao: v })}
            label="Promo"
          />
          <input
            type="number"
            step="0.01"
            value={p.preco_promocional ?? ""}
            onChange={(e) => patch(p.produto_id, { preco_promocional: Number(e.target.value) })}
            className={`w-28 bg-white border rounded-xl px-3 py-2 text-sm text-right ${!p.em_promocao ? "opacity-50" : ""}`}
            disabled={!p.em_promocao}
            placeholder="0,00"
          />
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col gap-2">
          <button
            onClick={onSave}
            disabled={saving}
            className="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>

          <button
            className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-xs font-extrabold"
            onClick={async () => {
              const ok = await copyToClipboard(`${location.origin}/fv/produtos/${p.ean}`);
              void ok;
            }}
            title="Copiar link do produto"
          >
            Copiar link
          </button>
        </div>
      </td>
    </tr>
  );
}
