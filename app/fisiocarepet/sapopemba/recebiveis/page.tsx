"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Prof = { id: string; nome: string; ativo: boolean };

type Rec = {
  id: string;
  data: string;
  servico: string | null;
  paciente: string | null;
  tutor: string | null;

  profissional_id: string;
  forma_pagamento: string;
  valor_bruto: number;

  taxa_cartao_valor: number;
  imposto_valor: number;
  base_pos_descontos: number;
  comissao_valor: number;
  valor_liquido_clinica: number;

  status: string; // aberto | pago_profissional | cancelado
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
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

export default function RecebiveisPage() {
  const [loading, setLoading] = useState(true);
  const [profs, setProfs] = useState<Prof[]>([]);
  const [rows, setRows] = useState<Rec[]>([]);

  // filtros período
  const [from, setFrom] = useState(primeiroDiaMesISO());
  const [to, setTo] = useState(hojeISO());
  const [profId, setProfId] = useState<string>("");

  // form
  const [data, setData] = useState(hojeISO());
  const [profissional, setProfissional] = useState("");
  const [servico, setServico] = useState("");
  const [paciente, setPaciente] = useState("");
  const [tutor, setTutor] = useState("");
  const [forma, setForma] = useState("PIX");
  const [valor, setValor] = useState("");

  async function loadProfs() {
    const { data, error } = await supabase
      .from("fisio_profissionais")
      .select("id,nome,ativo")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (!error) setProfs((data || []) as Prof[]);
  }

  async function loadRows() {
    setLoading(true);

    let q = supabase
      .from("fisio_recebiveis")
      .select("*")
      .gte("data", from)
      .lte("data", to)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });

    if (profId) q = q.eq("profissional_id", profId);

    const { data, error } = await q;
    if (!error) setRows((data || []) as Rec[]);
    setLoading(false);
  }

  useEffect(() => {
    loadProfs();
  }, []);

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, profId]);

  function nomeProf(id: string) {
    return profs.find((p) => p.id === id)?.nome || "—";
  }

  // ✅ fechamento do período: ignora cancelados
  const resumoPorProf = useMemo(() => {
    const map = new Map<
      string,
      { bruto: number; comissao: number; clinica: number; qtd: number; cancelados: number }
    >();

    for (const r of rows) {
      const k = r.profissional_id;
      const cur = map.get(k) || { bruto: 0, comissao: 0, clinica: 0, qtd: 0, cancelados: 0 };

      if (r.status === "cancelado") {
        cur.cancelados += 1;
        map.set(k, cur);
        continue;
      }

      cur.bruto += Number(r.valor_bruto) || 0;
      cur.comissao += Number(r.comissao_valor) || 0; // ✅ valor a pagar p/ vet
      cur.clinica += Number(r.valor_liquido_clinica) || 0;
      cur.qtd += 1;

      map.set(k, cur);
    }

    return map;
  }, [rows]);

  // ✅ totais gerais (ignorando cancelados)
  const totais = useMemo(() => {
    let bruto = 0;
    let comissao = 0;
    let clinica = 0;
    let cancelados = 0;

    for (const r of rows) {
      if (r.status === "cancelado") {
        cancelados += 1;
        continue;
      }
      bruto += Number(r.valor_bruto) || 0;
      comissao += Number(r.comissao_valor) || 0;
      clinica += Number(r.valor_liquido_clinica) || 0;
    }

    return { bruto, comissao, clinica, cancelados };
  }, [rows]);

  async function addRecebivel() {
    if (!profissional) return alert("Selecione a veterinária.");
    if (!valor.trim()) return alert("Preencha o valor.");

    // aceita "120,00" ou "120.00"
    const bruto = Number(valor.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(bruto) || bruto <= 0) return alert("Valor inválido.");

    const { error } = await supabase.from("fisio_recebiveis").insert([
      {
        data,
        profissional_id: profissional,
        servico: servico.trim() || null,
        paciente: paciente.trim() || null,
        tutor: tutor.trim() || null,
        forma_pagamento: forma,
        valor_bruto: bruto,

        // ✅ 6% em tudo + 28% comissão + 2,79% cartão (trigger decide se aplica)
        imposto_rate: 0.06,
        comissao_rate: 0.28,
        taxa_cartao_rate: 0.0279,

        status: "aberto",
      },
    ]);

    if (error) return alert(error.message);

    setServico("");
    setPaciente("");
    setTutor("");
    setValor("");
    setForma("PIX");
    loadRows();
  }

  async function markPagoProf(id: string) {
    const { error } = await supabase
      .from("fisio_recebiveis")
      .update({ status: "pago_profissional" })
      .eq("id", id);

    if (error) return alert(error.message);

    // atualiza estado local
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "pago_profissional" } : r)));
  }

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("fisio_recebiveis").update({ status }).eq("id", id);
    if (error) return alert(error.message);

    // Não recalculo aqui, pq o trigger recalcula no banco.
    // Recarrega pra trazer comissao zerada quando cancelado.
    await loadRows();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Recebíveis • Comissão Automática
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Cartão: -2,79% → imposto -6% (em tudo) → comissão 28% (a pagar). Cancelado = comissão zerada.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/fisiocarepet/sapopemba"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              ← Voltar
            </Link>
            <Link
              href="/fisiocarepet/sapopemba/profissionais"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Veterinárias
            </Link>
          </div>
        </div>

        {/* Cards totais */}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">Bruto (sem cancelados)</div>
            <div className="mt-1 text-xl font-extrabold text-slate-900">{brl(totais.bruto)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">A pagar (comissão 28%)</div>
            <div className="mt-1 text-xl font-extrabold text-slate-900">{brl(totais.comissao)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">Líquido Clínica</div>
            <div className="mt-1 text-xl font-extrabold text-slate-900">{brl(totais.clinica)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">Cancelados</div>
            <div className="mt-1 text-xl font-extrabold text-slate-900">{totais.cancelados}</div>
          </div>
        </div>

        {/* Form */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Novo recebível</div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
            <div>
              <label className="text-xs font-semibold text-slate-600">Data</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Veterinária</label>
              <select
                value={profissional}
                onChange={(e) => setProfissional(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Selecione</option>
                {profs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Serviço</label>
              <input
                value={servico}
                onChange={(e) => setServico(e.target.value)}
                placeholder="Ex: Consulta, Fisio, Banho..."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Forma</label>
              <select
                value={forma}
                onChange={(e) => setForma(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option>PIX</option>
                <option>Cartão</option>
                <option>Dinheiro</option>
                <option>Transferência</option>
                <option>Outro</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Valor bruto</label>
              <input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex: 120,00"
                inputMode="decimal"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Paciente</label>
              <input
                value={paciente}
                onChange={(e) => setPaciente(e.target.value)}
                placeholder="Nome do pet"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Tutor</label>
              <input
                value={tutor}
                onChange={(e) => setTutor(e.target.value)}
                placeholder="Responsável"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={addRecebivel}
              className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800"
            >
              Salvar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">De</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Até</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Veterinária (filtro)</label>
            <select
              value={profId}
              onChange={(e) => setProfId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {profs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fechamento por veterinária */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">
            Fechamento ({toBRDate(from)} → {toBRDate(to)}) — cancelados não entram
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Veterinária</th>
                  <th className="px-4 py-3 text-right">Qtd</th>
                  <th className="px-4 py-3 text-right">Bruto</th>
                  <th className="px-4 py-3 text-right">A pagar (comissão)</th>
                  <th className="px-4 py-3 text-right">Líquido Clínica</th>
                  <th className="px-4 py-3 text-right">Cancelados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {Array.from(resumoPorProf.entries()).map(([pid, s]) => (
                  <tr key={pid}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{nomeProf(pid)}</td>
                    <td className="px-4 py-3 text-right">{s.qtd}</td>
                    <td className="px-4 py-3 text-right">{brl(s.bruto)}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                      {brl(s.comissao)}
                    </td>
                    <td className="px-4 py-3 text-right">{brl(s.clinica)}</td>
                    <td className="px-4 py-3 text-right">{s.cancelados}</td>
                  </tr>
                ))}

                {!loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      Nenhum recebível no período.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lançamentos */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="text-sm font-semibold">
              Lançamentos {loading ? "(carregando…)" : `(${rows.length})`}
            </div>
            <div className="text-xs text-slate-500">Comissão zera automaticamente no cancelado.</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Veterinária</th>
                  <th className="px-4 py-3">Serviço</th>
                  <th className="px-4 py-3">Forma</th>
                  <th className="px-4 py-3 text-right">Bruto</th>
                  <th className="px-4 py-3 text-right">Taxa cartão</th>
                  <th className="px-4 py-3 text-right">Imposto</th>
                  <th className="px-4 py-3 text-right">Comissão (pagar)</th>
                  <th className="px-4 py-3 text-right">Líquido Clínica</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {rows.map((r) => (
                  <tr key={r.id} className={r.status === "cancelado" ? "opacity-60" : ""}>
                    <td className="px-4 py-3 font-semibold">{toBRDate(r.data)}</td>
                    <td className="px-4 py-3">{nomeProf(r.profissional_id)}</td>
                    <td className="px-4 py-3">{r.servico || "-"}</td>
                    <td className="px-4 py-3">{r.forma_pagamento}</td>

                    <td className="px-4 py-3 text-right font-semibold">{brl(r.valor_bruto)}</td>
                    <td className="px-4 py-3 text-right">{brl(r.taxa_cartao_valor)}</td>
                    <td className="px-4 py-3 text-right">{brl(r.imposto_valor)}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                      {brl(r.comissao_valor)}
                    </td>
                    <td className="px-4 py-3 text-right">{brl(r.valor_liquido_clinica)}</td>

                    <td className="px-4 py-3">
                      <select
                        value={r.status}
                        onChange={(e) => setStatus(r.id, e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold"
                      >
                        <option value="aberto">aberto</option>
                        <option value="pago_profissional">pago_profissional</option>
                        <option value="cancelado">cancelado</option>
                      </select>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {r.status === "aberto" ? (
                        <button
                          onClick={() => markPagoProf(r.id)}
                          className="rounded-xl bg-green-600 px-3 py-1 text-xs font-bold text-white hover:bg-green-700"
                        >
                          Marcar pago
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {!loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                      Nenhum lançamento no período.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
