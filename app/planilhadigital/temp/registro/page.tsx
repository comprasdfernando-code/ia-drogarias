"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLoja } from "../_components/LojaProvider";

type Local = {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
};

type Leitura = {
  id: string;
  local_id: string;

  // Temperatura (aparelho): min / atual / max
  temp_min_c: number | null;
  temp_c: number;
  temp_max_c: number | null;

  // Umidade: SOMENTE atual
  umid_pct: number | null;

  turno: string | null; // manha | tarde
  assinatura: string | null;

  lida_em: string;
  observacao: string | null;
  status: string;
};

function toNum(s: string) {
  const v = Number((s || "").replace(",", "."));
  return Number.isNaN(v) ? null : v;
}

function monthStartISO() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function monthLabelPtBr() {
  const d = new Date();
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default function RegistroTempPage() {
  const { lojaId } = useLoja();

  // ✅ Dados que vão no cabeçalho do PDF (edite aqui)
  const LOJA_NOME = "Drogaria Rede Fabiano";
  const LOJA_CNPJ = "62.157.257/0001-09";
  const LOJA_ENDERECO = "Rua Av Sapopemba , nº 16034, Bairro Jd Rodolfo Pirani, São Paulo - SP";
  const LOJA_TELEFONE = "(11) 9 4834-3725";

  const [locais, setLocais] = useState<Local[]>([]);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [localId, setLocalId] = useState("");

  const [turno, setTurno] = useState<"manha" | "tarde">("manha");
  const [assinatura, setAssinatura] = useState("");

  // Temperatura: min / atual / max
  const [tempMin, setTempMin] = useState("");
  const [tempAtual, setTempAtual] = useState("");
  const [tempMax, setTempMax] = useState("");

  // Umidade: só atual
  const [umidAtual, setUmidAtual] = useState("");

  const [obs, setObs] = useState("");

  const [loadingLocais, setLoadingLocais] = useState(true);
  const [loadingMes, setLoadingMes] = useState(true);
  const [saving, setSaving] = useState(false);

  const mesTitulo = useMemo(() => monthLabelPtBr(), []);

  async function loadLocais() {
    if (!lojaId) return;
    setLoadingLocais(true);

    const { data, error } = await supabase
      .from("temp_locais")
      .select("id,nome,tipo,ativo")
      .eq("loja_id", lojaId)
      .order("nome", { ascending: true });

    if (error) {
      console.error(error);
      setLocais([]);
      setLoadingLocais(false);
      return;
    }

    const arr = (data || []) as Local[];
    const ativos = arr.filter((x) => x.ativo !== false);
    setLocais(ativos);
    if (!localId && ativos.length) setLocalId(ativos[0].id);

    setLoadingLocais(false);
  }

  async function loadMes() {
    if (!lojaId) return;
    setLoadingMes(true);

    const { data, error } = await supabase
      .from("temp_leituras")
      .select("id,local_id,temp_min_c,temp_c,temp_max_c,umid_pct,turno,assinatura,lida_em,observacao,status")
      .eq("loja_id", lojaId)
      .gte("lida_em", monthStartISO())
      .order("lida_em", { ascending: true })
      .limit(5000);

    if (error) {
      console.error(error);
      setLeituras([]);
      setLoadingMes(false);
      return;
    }

    setLeituras((data || []) as any);
    setLoadingMes(false);
  }

  useEffect(() => {
    if (!lojaId) return;

    loadLocais();
    loadMes();

    const ch = supabase
      .channel("rt-temp-leituras")
      .on("postgres_changes", { event: "*", schema: "public", table: "temp_leituras" }, (payload) => {
        const row: any = (payload as any).new || (payload as any).old;
        if (row?.loja_id === lojaId) loadMes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaId]);

  async function salvar() {
    if (!lojaId) return;
    if (!localId) return alert("Selecione um local.");
    if (!assinatura.trim()) return alert("Informe a assinatura (responsável).");

    const tAtual = toNum(tempAtual);
    if (tAtual == null) return alert("Informe a temperatura atual (ex: 5,2).");

    const payload = {
      loja_id: lojaId,
      local_id: localId,

      temp_min_c: tempMin.trim() ? toNum(tempMin) : null,
      temp_c: tAtual,
      temp_max_c: tempMax.trim() ? toNum(tempMax) : null,

      umid_pct: umidAtual.trim() ? toNum(umidAtual) : null,

      turno,
      assinatura: assinatura.trim(),
      observacao: obs.trim() ? obs.trim() : null,
      origem: "manual",
    };

    if (payload.temp_min_c != null && payload.temp_max_c != null && payload.temp_min_c > payload.temp_max_c) {
      return alert("Temp mín não pode ser maior que temp máx.");
    }

    setSaving(true);
    const { error } = await supabase.from("temp_leituras").insert(payload);
    setSaving(false);

    if (error) {
      console.error(error);
      alert("Erro ao salvar: " + error.message);
      return;
    }

    setTempMin("");
    setTempAtual("");
    setTempMax("");
    setUmidAtual("");
    setObs("");

    await loadMes();
    alert("Leitura registrada ✅");
  }

  function gerarPDF() {
    window.print();
  }

  return (
    <div className="p-2">
      {/* Topo da tela (normal) */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between no-print">
        <div>
          <h1 className="text-xl font-semibold">Planilha Digital — Temperatura e Umidade</h1>
          <p className="text-sm opacity-70">Mês/Ano: {mesTitulo}</p>
        </div>

        <button onClick={gerarPDF} className="rounded border px-3 py-2 text-sm hover:bg-black/5">
          Gerar PDF
        </button>
      </div>

      {/* FORM (não aparece no PDF) */}
      <div className="mt-4 rounded border p-4 no-print">
        <label className="block">
          <span className="text-sm">Local</span>
          <select
            className="mt-1 w-full rounded border p-2"
            value={localId}
            onChange={(e) => setLocalId(e.target.value)}
            disabled={loadingLocais}
          >
            {locais.length === 0 ? <option value="">Nenhum local cadastrado</option> : null}
            {locais.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome} ({l.tipo})
              </option>
            ))}
          </select>
        </label>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-sm">Turno</span>
            <select className="mt-1 w-full rounded border p-2" value={turno} onChange={(e) => setTurno(e.target.value as any)}>
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm">Assinatura (responsável)</span>
            <input
              className="mt-1 w-full rounded border p-2"
              value={assinatura}
              onChange={(e) => setAssinatura(e.target.value)}
              placeholder="Ex: Fernando Pereira"
            />
          </label>
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold">Temperatura (°C) — do aparelho</div>
          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="block">
              <span className="text-xs opacity-70">Temp mín</span>
              <input className="mt-1 w-full rounded border p-2" value={tempMin} onChange={(e) => setTempMin(e.target.value)} inputMode="decimal" placeholder="ex: 2,0" />
            </label>
            <label className="block">
              <span className="text-xs opacity-70">Temp atual *</span>
              <input className="mt-1 w-full rounded border p-2" value={tempAtual} onChange={(e) => setTempAtual(e.target.value)} inputMode="decimal" placeholder="ex: 5,2" />
            </label>
            <label className="block">
              <span className="text-xs opacity-70">Temp máx</span>
              <input className="mt-1 w-full rounded border p-2" value={tempMax} onChange={(e) => setTempMax(e.target.value)} inputMode="decimal" placeholder="ex: 8,0" />
            </label>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold">Umidade (%) — do aparelho</div>
          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-xs opacity-70">Umid atual</span>
              <input className="mt-1 w-full rounded border p-2" value={umidAtual} onChange={(e) => setUmidAtual(e.target.value)} inputMode="decimal" placeholder="ex: 55" />
            </label>
            <div className="text-xs opacity-60 self-end pb-2">* Umidade mínima/máxima não é usada.</div>
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-sm">Observação</span>
          <textarea className="mt-1 w-full rounded border p-2" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
        </label>

        <button
          onClick={salvar}
          disabled={saving || locais.length === 0}
          className="mt-4 rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Registrar"}
        </button>
      </div>

      {/* ======================
          BLOCO DO PDF (somente isso imprime)
      ======================= */}
      <div id="print-area" className="print-only">
        <div className="print-header">
          <div className="print-title">{LOJA_NOME}</div>
          <div className="print-sub">
            <div>
              <b>CNPJ:</b> {LOJA_CNPJ}
            </div>
            <div>
              <b>Endereço:</b> {LOJA_ENDERECO}
            </div>
            <div>
              <b>Telefone:</b> {LOJA_TELEFONE}
            </div>
          </div>
          <div className="print-meta">
            <div>
              <b>Planilha de Controle de Temperatura e Umidade</b>
            </div>
            <div>
              <b>Mês/Ano:</b> {mesTitulo}
            </div>
          </div>
        </div>

        <div className="print-table-wrap">
          <table className="print-table">
            <thead>
              <tr>
                <th>Dia</th>
                <th>Turno</th>
                <th>Hora</th>
                <th>Local</th>
                <th>Temp mín</th>
                <th>Temp atual</th>
                <th>Temp máx</th>
                <th>Umid (%)</th>
                <th>Status</th>
                <th>Assinatura</th>
                <th>Obs</th>
              </tr>
            </thead>
            <tbody>
              {leituras.map((r) => {
                const loc = locais.find((l) => l.id === r.local_id);
                const dt = new Date(r.lida_em);
                const dia = pad2(dt.getDate());
                const hora = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                const turnoLabel = (r.turno || "").toLowerCase() === "tarde" ? "Tarde" : "Manhã";

                return (
                  <tr key={r.id}>
                    <td>{dia}</td>
                    <td>{turnoLabel}</td>
                    <td>{hora}</td>
                    <td>{loc?.nome || r.local_id}</td>

                    <td>{r.temp_min_c ?? ""}</td>
                    <td>{r.temp_c ?? ""}</td>
                    <td>{r.temp_max_c ?? ""}</td>

                    <td>{r.umid_pct ?? ""}</td>

                    <td>{r.status || ""}</td>
                    <td>{r.assinatura || ""}</td>
                    <td>{r.observacao || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="print-footer">
            <div>Gerado em: {new Date().toLocaleString("pt-BR")}</div>
          </div>
        </div>
      </div>

      {/* VISUAL DA TABELA NA TELA (normal) */}
      <div className="mt-6 rounded border p-4 no-print">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Planilha do mês</div>
            <div className="text-sm opacity-70">{loadingMes ? "Carregando…" : `${leituras.length} registro(s) no mês`}</div>
          </div>
          <button onClick={gerarPDF} className="rounded border px-3 py-2 text-sm hover:bg-black/5">
            Gerar PDF
          </button>
        </div>

        {loadingMes ? (
          <div className="mt-3 text-sm">Carregando…</div>
        ) : leituras.length === 0 ? (
          <div className="mt-3 text-sm opacity-70">Nenhum registro no mês ainda.</div>
        ) : (
          <div className="mt-3 overflow-auto">
            <table className="min-w-[1100px] w-full border-collapse text-sm">
              <thead>
                <tr className="bg-black/5">
                  <th className="border p-2">Dia</th>
                  <th className="border p-2">Turno</th>
                  <th className="border p-2">Hora</th>
                  <th className="border p-2">Local</th>
                  <th className="border p-2">Temp mín</th>
                  <th className="border p-2">Temp atual</th>
                  <th className="border p-2">Temp máx</th>
                  <th className="border p-2">Umid (%)</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Ass.</th>
                  <th className="border p-2">Obs</th>
                </tr>
              </thead>
              <tbody>
                {leituras.map((r) => {
                  const loc = locais.find((l) => l.id === r.local_id);
                  const dt = new Date(r.lida_em);
                  const dia = pad2(dt.getDate());
                  const hora = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

                  return (
                    <tr key={r.id}>
                      <td className="border p-2">{dia}</td>
                      <td className="border p-2">{(r.turno || "").toLowerCase() === "tarde" ? "Tarde" : "Manhã"}</td>
                      <td className="border p-2">{hora}</td>
                      <td className="border p-2">{loc?.nome || r.local_id}</td>

                      <td className="border p-2">{r.temp_min_c ?? "—"}</td>
                      <td className="border p-2">{r.temp_c}</td>
                      <td className="border p-2">{r.temp_max_c ?? "—"}</td>

                      <td className="border p-2">{r.umid_pct ?? "—"}</td>

                      <td className="border p-2">{r.status}</td>
                      <td className="border p-2">{r.assinatura || "—"}</td>
                      <td className="border p-2">{r.observacao || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================
          CSS de impressão LIMPO
      ======================= */}
      <style jsx global>{`
        .print-only {
          display: none;
        }

        @media print {
          /* some tudo que não é impressão */
          .no-print {
            display: none !important;
          }

          /* mostra só o bloco do PDF */
          .print-only {
            display: block !important;
          }

          /* remove margens feias e deixa branco */
          html,
          body {
            background: #fff !important;
          }

          /* header do PDF */
          .print-header {
            border-bottom: 2px solid #111;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .print-title {
            font-size: 18px;
            font-weight: 800;
            color: #111;
          }
          .print-sub {
            margin-top: 6px;
            font-size: 11px;
            color: #111;
            line-height: 1.35;
          }
          .print-meta {
            margin-top: 10px;
            font-size: 12px;
            color: #111;
            display: flex;
            justify-content: space-between;
            gap: 12px;
          }

          /* tabela do PDF */
          .print-table-wrap {
            width: 100%;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            color: #111;
          }
          .print-table th,
          .print-table td {
            border: 1px solid #111;
            padding: 6px 6px;
            vertical-align: top;
          }
          .print-table th {
            background: #f2f2f2;
            font-weight: 700;
          }

          /* footer */
          .print-footer {
            margin-top: 8px;
            font-size: 10px;
            color: #111;
          }

          /* evita quebrar tabela no meio */
          table,
          tr,
          td,
          th {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}