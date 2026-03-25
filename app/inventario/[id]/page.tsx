"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import InventarioShell from "../_components/InventarioShell";
import ProgressBar from "../_components/ProgressBar";
import ResumoCards from "../_components/ResumoCards";
import StatusBadge from "../_components/StatusBadge";
import type { Inventario, InventarioItem } from "@/types/inventario";

function isVencido(validade?: string | null) {
  if (!validade) return false;
  return new Date(validade).getTime() < new Date().setHours(0, 0, 0, 0);
}

function isVencendo(validade?: string | null) {
  if (!validade) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const v = new Date(validade);
  const limite = new Date();
  limite.setHours(0, 0, 0, 0);
  limite.setDate(limite.getDate() + 30);

  return v >= hoje && v <= limite;
}

export default function InventarioDetalhePage() {
  const params = useParams();
  const id = String(params.id);

  const [inventario, setInventario] = useState<Inventario | null>(null);
  const [itens, setItens] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");

  const [novoProduto, setNovoProduto] = useState("");
  const [novaApresentacao, setNovaApresentacao] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("controlado");
  const [novoLote, setNovoLote] = useState("");
  const [novaValidade, setNovaValidade] = useState("");
  const [novaQuantidadeSistema, setNovaQuantidadeSistema] = useState("0");

  async function carregar() {
    setLoading(true);

    const { data: inv, error: invError } = await supabase
      .from("inventarios")
      .select("*")
      .eq("id", id)
      .single();

    if (invError) {
      console.error(invError);
      setLoading(false);
      return;
    }

    const { data: itensData, error: itensError } = await supabase
      .from("inventario_itens")
      .select("*")
      .eq("inventario_id", id)
      .order("produto_nome", { ascending: true });

    if (itensError) {
      console.error(itensError);
    }

    setInventario(inv);
    setItens((itensData || []) as InventarioItem[]);
    setLoading(false);

    if (inv?.status === "aberto") {
      await supabase.from("inventarios").update({ status: "em_contagem" }).eq("id", id);
      setInventario({ ...inv, status: "em_contagem" });
    }
  }

  useEffect(() => {
    if (id) carregar();
  }, [id]);

  async function salvarContagem(
    itemId: string,
    quantidadeContada: number | null,
    observacao?: string,
    lote?: string | null,
    validade?: string | null
  ) {
    const itemAtual = itens.find((i) => i.id === itemId);
    if (!itemAtual) return;

    let status: InventarioItem["status"] = "pendente";

    if (quantidadeContada === null || Number.isNaN(quantidadeContada)) {
      status = "pendente";
    } else if (quantidadeContada === 0 && itemAtual.quantidade_sistema > 0) {
      status = "nao_encontrado";
    } else if (Number(quantidadeContada) === Number(itemAtual.quantidade_sistema)) {
      status = "contado";
    } else {
      status = "divergente";
    }

    const payload = {
      quantidade_contada: quantidadeContada,
      observacao: observacao ?? itemAtual.observacao,
      lote: lote ?? itemAtual.lote,
      validade: validade ?? itemAtual.validade,
      status,
      contado_em: new Date().toISOString(),
      contado_por: inventario?.responsavel_nome || "Usuário",
    };

    const { error } = await supabase
      .from("inventario_itens")
      .update(payload)
      .eq("id", itemId);

    if (error) {
      console.error(error);
      alert("Erro ao salvar contagem");
      return;
    }

    setItens((prev) =>
      prev.map((item) => (item.id === itemId ? ({ ...item, ...payload } as InventarioItem) : item))
    );
  }

  async function adicionarNovoItem() {
    if (!novoProduto.trim()) return;

    const payload = {
      inventario_id: id,
      produto_nome: novoProduto.trim(),
      apresentacao: novaApresentacao.trim() || null,
      categoria: novaCategoria,
      lote: novoLote.trim() || null,
      validade: novaValidade || null,
      quantidade_sistema: Number(novaQuantidadeSistema || 0),
      status: "pendente",
    };

    const { data, error } = await supabase
      .from("inventario_itens")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error(error);
      alert("Erro ao adicionar item");
      return;
    }

    setItens((prev) => [...prev, data as InventarioItem]);
    setNovoProduto("");
    setNovaApresentacao("");
    setNovaCategoria("controlado");
    setNovoLote("");
    setNovaValidade("");
    setNovaQuantidadeSistema("0");
  }

  async function excluirItem(itemId: string) {
    const ok = window.confirm("Deseja remover este item do inventário?");
    if (!ok) return;

    const { error } = await supabase.from("inventario_itens").delete().eq("id", itemId);

    if (error) {
      console.error(error);
      alert("Erro ao remover item");
      return;
    }

    setItens((prev) => prev.filter((item) => item.id !== itemId));
  }

  const filtrados = useMemo(() => {
    return itens.filter((item) => {
      const okBusca =
        !busca ||
        item.produto_nome.toLowerCase().includes(busca.toLowerCase()) ||
        (item.lote || "").toLowerCase().includes(busca.toLowerCase());

      const okStatus = filtroStatus === "todos" ? true : item.status === filtroStatus;
      const okCategoria =
        filtroCategoria === "todos" ? true : item.categoria === filtroCategoria;

      return okBusca && okStatus && okCategoria;
    });
  }, [itens, busca, filtroStatus, filtroCategoria]);

  const resumo = useMemo(() => {
    const total = itens.length;
    const contados = itens.filter((i) => i.status !== "pendente").length;
    const divergentes = itens.filter((i) => i.status === "divergente").length;
    const naoEncontrados = itens.filter((i) => i.status === "nao_encontrado").length;
    const vencidos = itens.filter((i) => isVencido(i.validade)).length;

    return { total, contados, divergentes, naoEncontrados, vencidos };
  }, [itens]);

  if (loading) {
    return (
      <InventarioShell title="Inventário" subtitle="Carregando dados...">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          Carregando...
        </div>
      </InventarioShell>
    );
  }

  if (!inventario) {
    return (
      <InventarioShell title="Inventário não encontrado">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          Não foi possível localizar este inventário.
        </div>
      </InventarioShell>
    );
  }

  return (
    <InventarioShell
      title={`Inventário - ${inventario.tipo}`}
      subtitle={`${inventario.local_nome || "Sem local"} • ${
        inventario.responsavel_nome || "Sem responsável"
      }`}
      right={
        <div className="flex items-center gap-2">
          <StatusBadge status={inventario.status} />
          <Link
            href={`/inventario/${inventario.id}/fechamento`}
            className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Fechar inventário
          </Link>
        </div>
      }
    >
      <ResumoCards
        cards={[
          { label: "Itens", value: resumo.total },
          { label: "Conferidos", value: resumo.contados },
          { label: "Divergentes", value: resumo.divergentes },
          { label: "Não encontrados", value: resumo.naoEncontrados },
        ]}
      />

      <ProgressBar value={resumo.contados} total={resumo.total} />

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Filtros</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por produto ou lote"
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
          />

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
          >
            <option value="todos">Todos os status</option>
            <option value="pendente">Pendentes</option>
            <option value="contado">Contados</option>
            <option value="divergente">Divergentes</option>
            <option value="nao_encontrado">Não encontrados</option>
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
          >
            <option value="todos">Todas as categorias</option>
            <option value="controlado">Controlados</option>
            <option value="antibiotico">Antibióticos</option>
            <option value="outro">Outros</option>
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Adicionar item avulso</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input
            value={novoProduto}
            onChange={(e) => setNovoProduto(e.target.value)}
            placeholder="Produto"
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
          />

          <input
            value={novaApresentacao}
            onChange={(e) => setNovaApresentacao(e.target.value)}
            placeholder="Apresentação"
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
          />

          <select
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
          >
            <option value="controlado">Controlado</option>
            <option value="antibiotico">Antibiótico</option>
            <option value="outro">Outro</option>
          </select>

          <input
            value={novoLote}
            onChange={(e) => setNovoLote(e.target.value)}
            placeholder="Lote"
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
          />

          <input
            type="date"
            value={novaValidade}
            onChange={(e) => setNovaValidade(e.target.value)}
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
          />

          <input
            type="number"
            step="0.01"
            value={novaQuantidadeSistema}
            onChange={(e) => setNovaQuantidadeSistema(e.target.value)}
            placeholder="Qtd. sistema"
            className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={adicionarNovoItem}
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700"
          >
            + Adicionar item
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 md:p-5">
          <h2 className="text-lg font-bold text-slate-900">Itens do inventário</h2>
          <p className="text-sm text-slate-500">
            Preencha quantidade contada, lote, validade e observações
          </p>
        </div>

        <div className="space-y-4 p-4 md:p-5">
          {filtrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
              Nenhum item encontrado
            </div>
          ) : (
            filtrados.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onSalvar={salvarContagem}
                onExcluir={excluirItem}
              />
            ))
          )}
        </div>
      </div>
    </InventarioShell>
  );
}

function ItemCard({
  item,
  onSalvar,
  onExcluir,
}: {
  item: InventarioItem;
  onSalvar: (
    itemId: string,
    quantidadeContada: number | null,
    observacao?: string,
    lote?: string | null,
    validade?: string | null
  ) => Promise<void>;
  onExcluir: (itemId: string) => Promise<void>;
}) {
  const [quantidade, setQuantidade] = useState(
    item.quantidade_contada !== null ? String(item.quantidade_contada) : ""
  );
  const [observacao, setObservacao] = useState(item.observacao || "");
  const [lote, setLote] = useState(item.lote || "");
  const [validade, setValidade] = useState(item.validade || "");
  const [salvando, setSalvando] = useState(false);

  const vencido = isVencido(validade);
  const vencendo = isVencendo(validade);

  async function handleSalvar() {
    try {
      setSalvando(true);
      const qtd = quantidade === "" ? null : Number(quantidade);
      await onSalvar(item.id, qtd, observacao, lote || null, validade || null);
    } finally {
      setSalvando(false);
    }
  }

  const diferenca =
    quantidade === "" ? "-" : Number(quantidade || 0) - Number(item.quantidade_sistema || 0);

  return (
    <div
      className={`rounded-3xl border p-4 shadow-sm ${
        item.status === "divergente"
          ? "border-rose-200 bg-rose-50/50"
          : item.status === "contado"
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">{item.produto_nome}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{item.apresentacao || "Sem apresentação"}</span>
            <span>•</span>
            <span>{item.categoria}</span>
            <span>•</span>
            <span>Sistema: {Number(item.quantidade_sistema)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {vencido ? (
            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
              Vencido
            </span>
          ) : vencendo ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              Vencendo
            </span>
          ) : null}

          <StatusBadge status={item.status} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Qtd. contada
          </label>
          <input
            type="number"
            step="0.01"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Lote
          </label>
          <input
            value={lote}
            onChange={(e) => setLote(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Validade
          </label>
          <input
            type="date"
            value={validade}
            onChange={(e) => setValidade(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Diferença
          </label>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700">
            {diferenca}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Observação
        </label>
        <textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={2}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Última conferência:{" "}
          {item.contado_em ? new Date(item.contado_em).toLocaleString("pt-BR") : "—"}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSalvar(item.id, 0, observacao, lote || null, validade || null)}
            className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700"
          >
            Não encontrado
          </button>

          <button
            onClick={() => onExcluir(item.id)}
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
          >
            Excluir
          </button>

          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar contagem"}
          </button>
        </div>
      </div>
    </div>
  );
}