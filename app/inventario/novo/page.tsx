"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import InventarioShell from "../_components/InventarioShell";

type Local = {
  id: string;
  nome: string;
};

type ItemNovo = {
  produto_nome: string;
  apresentacao: string | null;
  categoria: string;
  lote: string | null;
  validade: string | null;
  quantidade_sistema: number;
};

export default function NovoInventarioPage() {
  const router = useRouter();

  const [tipo, setTipo] = useState("controlados");
  const [localNome, setLocalNome] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [locais, setLocais] = useState<Local[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [produtoNome, setProdutoNome] = useState("");
  const [apresentacao, setApresentacao] = useState("");
  const [categoria, setCategoria] = useState("controlado");
  const [lote, setLote] = useState("");
  const [validade, setValidade] = useState("");
  const [quantidadeSistema, setQuantidadeSistema] = useState("0");
  const [itens, setItens] = useState<ItemNovo[]>([]);

  async function carregarLocais() {
    const { data, error } = await supabase
      .from("inventario_locais")
      .select("id, nome")
      .eq("loja_slug", "drogariaredefabiano")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setLocais(data || []);
  }

  useEffect(() => {
    carregarLocais();
  }, []);

  function adicionarItem() {
    if (!produtoNome.trim()) return;

    setItens((prev) => [
      ...prev,
      {
        produto_nome: produtoNome.trim(),
        apresentacao: apresentacao.trim() || null,
        categoria,
        lote: lote.trim() || null,
        validade: validade || null,
        quantidade_sistema: Number(quantidadeSistema || 0),
      },
    ]);

    setProdutoNome("");
    setApresentacao("");
    setCategoria(tipo === "antibioticos" ? "antibiotico" : "controlado");
    setLote("");
    setValidade("");
    setQuantidadeSistema("0");
  }

  function removerItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  async function criarInventario() {
    try {
      setSalvando(true);

      const { data: inventario, error } = await supabase
        .from("inventarios")
        .insert({
          loja_slug: "drogariaredefabiano",
          tipo,
          local_nome: localNome || null,
          status: "aberto",
          responsavel_nome: responsavelNome || null,
          observacoes: observacoes || null,
          iniciado_em: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error || !inventario) {
        throw error || new Error("Erro ao criar inventário");
      }

      if (itens.length > 0) {
        const payload = itens.map((item) => ({
          inventario_id: inventario.id,
          produto_nome: item.produto_nome,
          apresentacao: item.apresentacao,
          categoria: item.categoria,
          lote: item.lote,
          validade: item.validade,
          quantidade_sistema: item.quantidade_sistema,
          status: "pendente",
        }));

        const { error: itensError } = await supabase
          .from("inventario_itens")
          .insert(payload);

        if (itensError) throw itensError;
      }

      router.push(`/inventario/${inventario.id}`);
    } catch (error) {
      console.error(error);
      alert("Não foi possível criar o inventário.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <InventarioShell
      title="Novo inventário"
      subtitle="Abra uma contagem por armário, local ou categoria"
    >
      <div className="grid gap-4 xl:grid-cols-[420px,1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Dados do inventário</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              >
                <option value="controlados">Controlados</option>
                <option value="antibioticos">Antibióticos</option>
                <option value="misto">Misto</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Local
              </label>
              <select
                value={localNome}
                onChange={(e) => setLocalNome(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              >
                <option value="">Selecione</option>
                {locais.map((local) => (
                  <option key={local.id} value={local.nome}>
                    {local.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Responsável
              </label>
              <input
                value={responsavelNome}
                onChange={(e) => setResponsavelNome(e.target.value)}
                placeholder="Ex: Fernando"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Observações
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={4}
                placeholder="Observações iniciais"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={criarInventario}
              disabled={salvando}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {salvando ? "Criando..." : "Criar inventário"}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Adicionar itens iniciais</h2>
          <p className="mt-1 text-sm text-slate-500">
            Você pode abrir vazio ou já iniciar com os itens do armário
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <input
              value={produtoNome}
              onChange={(e) => setProdutoNome(e.target.value)}
              placeholder="Produto"
              className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
            />

            <input
              value={apresentacao}
              onChange={(e) => setApresentacao(e.target.value)}
              placeholder="Apresentação"
              className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
            />

            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
            >
              <option value="controlado">Controlado</option>
              <option value="antibiotico">Antibiótico</option>
              <option value="outro">Outro</option>
            </select>

            <input
              value={lote}
              onChange={(e) => setLote(e.target.value)}
              placeholder="Lote"
              className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
            />

            <input
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
            />

            <input
              type="number"
              step="0.01"
              value={quantidadeSistema}
              onChange={(e) => setQuantidadeSistema(e.target.value)}
              placeholder="Qtd. sistema"
              className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={adicionarItem}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              + Adicionar item
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-3 pr-4">Produto</th>
                  <th className="py-3 pr-4">Apresentação</th>
                  <th className="py-3 pr-4">Categoria</th>
                  <th className="py-3 pr-4">Lote</th>
                  <th className="py-3 pr-4">Validade</th>
                  <th className="py-3 pr-4">Sistema</th>
                  <th className="py-3 pr-4">Ação</th>
                </tr>
              </thead>
              <tbody>
                {itens.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      Nenhum item adicionado ainda
                    </td>
                  </tr>
                ) : (
                  itens.map((item, index) => (
                    <tr key={index} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4">{item.produto_nome}</td>
                      <td className="py-3 pr-4">{item.apresentacao || "-"}</td>
                      <td className="py-3 pr-4">{item.categoria}</td>
                      <td className="py-3 pr-4">{item.lote || "-"}</td>
                      <td className="py-3 pr-4">{item.validade || "-"}</td>
                      <td className="py-3 pr-4">{item.quantidade_sistema}</td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => removerItem(index)}
                          className="font-medium text-rose-600"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </InventarioShell>
  );
}