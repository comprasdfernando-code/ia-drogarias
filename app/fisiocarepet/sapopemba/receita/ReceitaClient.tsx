"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Receita = {
  id: string;
  created_at: string;
  data: string; // yyyy-mm-dd
  paciente: string | null;
  tutor: string | null;
  servico: string | null;
  tipo: string | null;
  forma_pagamento: string | null;
  valor: number;
  status: string; // recebido | pendente | estornado
  observacao: string | null;
};

function brl(v: any) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function hojeISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function primeiroDiaMesISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

function toBRDate(iso: string) {
  // iso: yyyy-mm-dd
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

export default function ReceitaClient() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Receita[]>([]);

  // filtros
  const [from, setFrom] = useState<string>(() => primeiroDiaMesISO());
  const [to, setTo] = useState<string>(() => hojeISO());
  const [q, setQ] = useState("");

  // form
  const [data, setData] = useState<string>(() => hojeISO());
  const [paciente, setPaciente] = useState("");
  const [tutor, setTutor] = useState("");
  const [servico, setServico] = useState("");
  const [tipo, setTipo] = useState("Atendimento");
  const [forma, setForma] = useState("PIX");
  const [valor, setValor] = useState<string>("");
  const [status, setStatus] = useState("recebido");
  const [obs, setObs] = useState("");

  async function load() {
    setLoading(true);
    try {
      let query = supabase
        .from("fisio_receitas")
        .select("*")
        .gte("data", from)
        .lte("data", to)
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });

      if (q.trim()) {
        const s = q.trim().replaceAll(",", " ");
        query = query.or(
          `paciente.ilike.%${s}%,tutor.ilike.%${s}%,servico.ilike.%${s}%,tipo.ilike.%${s}%,forma_pagamento.ilike.%${s}%,status.ilike.%${s}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      setRows((data || []) as Receita[]);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao carregar receitas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const blob = [
        r.data,
        r.paciente,
        r.tutor,
        r.servico,
        r.tipo,
        r.forma_pagamento,
        r.status,
        r.observacao,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(s);
    });
  }, [rows, q]);

  const totais = useMemo(() => {
    let recebido = 0;
    let pendente = 0;
    let estornado = 0;

    for (const r of filtered) {
      const v = Number(r.valor) || 0;
      if (r.status === "recebido") recebido += v;
      else if (r.status === "pendente") pendente += v;
      else if (r.status === "estornado") estornado += v;
    }

    return { recebido, pendente, estornado, liquido: recebido - estornado };
  }, [filtered]);

  async function addReceita() {
    const raw = (valor || "").trim().replace(".", "").replace(",", ".");
    const v = Number(raw);

    if (!data) return toast.warn("Preencha a data.");
    if (!servico.trim()) return toast.warn("Preencha o serviço.");
    if (!Number.isFinite(v) || v <= 0) return toast.warn("Valor precisa ser maior que zero.");

    try {
      const payload = {
        data,
        paciente: paciente.trim() ? paciente.trim() : null,
        tutor: tutor.trim() ? tutor.trim() : null,
        servico: servico.trim() ? servico.trim() : null,
        tipo: tipo || null,
        forma_pagamento: forma || null,
        valor: v,
        status,
        observacao: obs.trim() ? obs.trim() : null,
      };

      const { error } = await supabase.from("fisio_receitas").insert(payload);
      if (error) throw error;

      toast.success("Receita registrada!");
      setPaciente("");
      setTutor("");
      setServico("");
      setValor("");
      setObs("");
      setStatus("recebido");
      setForma("PIX");
      setTipo("Atendimento");

      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao salvar");
    }
  }

  async function setStatusRow(id: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from("fisio_receitas")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;

      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao atualizar status");
    }
  }

  async function delRow(id: string) {
    if (!confirm("Excluir essa receita?")) return;
    try {
      const { error } = await supabase.from("fisio_receitas").delete().eq("id", id);
      if (error) throw error;

      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Excluído.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao excluir");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Receitas • Financeiro</h1>
          <p className="mt-1 text-sm text-slate-600">
            Registro de entradas com data (igual sua planilha). Filtre por período e acompanhe totais.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/fisiocarepet/sapopemba"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            ← Voltar
          </Link>
          <Link
            href="/fisiocarepet/sapopemba/implantacao"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Implantação
          </Link>
        </div>
      </div>

      {/* Form de lançamento */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">Novo lançamento</div>
          <div className="text-xs text-slate-500">Campos principais: Data, Serviço, Valor</div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
          <div>
            <label className="text-xs font-semibold text-slate-600">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Serviço</label>
            <input
              value={servico}
              onChange={(e) => setServico(e.target.value)}
              placeholder="Ex: Fisioterapia, consulta, banho..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Valor (R$)</label>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ex: 120,00"
              inputMode="decimal"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Forma</label>
            <select
              value={forma}
              onChange={(e) => setForma(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            >
              <option>PIX</option>
              <option>Cartão</option>
              <option>Dinheiro</option>
              <option>Boleto</option>
              <option>Transferência</option>
              <option>Outro</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            >
              <option value="recebido">recebido</option>
              <option value="pendente">pendente</option>
              <option value="estornado">estornado</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Paciente</label>
            <input
              value={paciente}
              onChange={(e) => setPaciente(e.target.value)}
              placeholder="Nome do pet"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Tutor</label>
            <input
              value={tutor}
              onChange={(e) => setTutor(e.target.value)}
              placeholder="Nome do responsável"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Tipo</label>
            <input
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Ex: Atendimento"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs font-semibold text-slate-600">Observação</label>
            <input
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Ex: retorno, pacote, desconto..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={addReceita}
            className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800"
          >
            Salvar receita
          </button>
        </div>
      </div>

      {/* Filtros + Totais */}
      <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">De</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Até</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Buscar</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Paciente, tutor, serviço, forma..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-semibold text-slate-600">Totais do período</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-white p-3">
              <div className="text-xs text-slate-500">Recebido</div>
              <div className="font-extrabold text-slate-900">{brl(totais.recebido)}</div>
            </div>
            <div className="rounded-xl bg-white p-3">
              <div className="text-xs text-slate-500">Pendente</div>
              <div className="font-extrabold text-slate-900">{brl(totais.pendente)}</div>
            </div>
            <div className="rounded-xl bg-white p-3">
              <div className="text-xs text-slate-500">Estornado</div>
              <div className="font-extrabold text-slate-900">{brl(totais.estornado)}</div>
            </div>
            <div className="rounded-xl bg-white p-3">
              <div className="text-xs text-slate-500">Líquido</div>
              <div className="font-extrabold text-slate-900">{brl(totais.liquido)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela / Planilha */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">
            Lançamentos ({filtered.length})
          </div>
          {loading ? (
            <div className="text-xs text-slate-500">Carregando…</div>
          ) : (
            <div className="text-xs text-slate-500">
              Período: {toBRDate(from)} → {toBRDate(to)}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3">Tutor</th>
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Forma</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-900">
                    {toBRDate(r.data)}
                  </td>

                  <td className="px-4 py-3">{r.paciente || "-"}</td>
                  <td className="px-4 py-3">{r.tutor || "-"}</td>
                  <td className="px-4 py-3">{r.servico || "-"}</td>
                  <td className="px-4 py-3">{r.tipo || "-"}</td>
                  <td className="px-4 py-3">{r.forma_pagamento || "-"}</td>

                  <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                    {brl(r.valor)}
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => setStatusRow(r.id, e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold"
                    >
                      <option value="recebido">recebido</option>
                      <option value="pendente">pendente</option>
                      <option value="estornado">estornado</option>
                    </select>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => delRow(r.id)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                    Nenhuma receita encontrada nesse período.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-xs text-slate-500">
        Dica: se quiser “fechamento mensal” automático e exportação CSV, eu adiciono em 5 min.
      </div>
    </div>
  );
}
