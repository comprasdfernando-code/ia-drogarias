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

  // valores do aparelho
  temp_min_c: number | null;
  temp_c: number;
  temp_max_c: number | null;

  umid_min_pct: number | null;
  umid_pct: number | null;
  umid_max_pct: number | null;

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

export default function RegistroTempPage() {
  const { lojaId } = useLoja();

  const [locais, setLocais] = useState<Local[]>([]);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [localId, setLocalId] = useState("");

  const [turno, setTurno] = useState<"manha" | "tarde">("manha");
  const [assinatura, setAssinatura] = useState("");

  // Temperatura (aparelho): min / atual / max
  const [tempMin, setTempMin] = useState("");
  const [tempAtual, setTempAtual] = useState("");
  const [tempMax, setTempMax] = useState("");

  // Umidade (aparelho): min / atual / max
  const [umidMin, setUmidMin] = useState("");
  const [umidAtual, setUmidAtual] = useState("");
  const [umidMax, setUmidMax] = useState("");

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
      .select(
        "id,local_id,temp_min_c,temp_c,temp_max_c,umid_min_pct,umid_pct,umid_max_pct,turno,assinatura,lida_em,observacao,status"
      )
      .eq("loja_id", lojaId)
      .gte("lida_em", monthStartISO())
      .order("lida_em", { ascending: true }) // para ficar “dia a dia”
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

      umid_min_pct: umidMin.trim() ? toNum(umidMin) : null,
      umid_pct: umidAtual.trim() ? toNum(umidAtual) : null,
      umid_max_pct: umidMax.trim() ? toNum(umidMax) : null,

      turno,
      assinatura: assinatura.trim(),
      observacao: obs.trim() ? obs.trim() : null,
      origem: "manual",
    };

    // validações básicas
    if (payload.temp_min_c != null && payload.temp_max_c != null && payload.temp_min_c > payload.temp_max_c) {
      return alert("Temp mín não pode ser maior que temp máx.");
    }
    if (payload.umid_min_pct != null && payload.umid_max_pct != null && payload.umid_min_pct > payload.umid_max_pct) {
      return alert("Umid mín não pode ser maior que umid máx.");
    }

    setSaving(true);

    const { error } = await supabase.from("temp_leituras").insert(payload);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Erro ao salvar: " + error.message);
      return;
    }

    // limpar campos
    setTempMin("");
    setTempAtual("");
    setTempMax("");
    setUmidMin("");
    setUmidAtual("");
    setUmidMax("");
    setObs("");

    await loadMes();
    alert("Leitura registrada ✅");
  }

  function gerarPDF() {
    window.print();
  }

  return (
    <div className="p-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Planilha Digital — Temperatura e Umidade</h1>
          <p className="text-sm opacity-70">Mês/Ano: {mesTitulo}</p>
        </div>

        <button onClick={gerarPDF} className="rounded border px-3 py-2 text-sm hover:bg-black/5">
          Gerar PDF
        </button>
      </div>

      {/* FORM (igual planilha física) */}
      <div className="mt-4 rounded border p-4">
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

        {/* Temperatura: min / atual / max */}
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

        {/* Umidade: min / atual / max */}
        <div className="mt-4">
          <div className="text-sm font-semibold">Umidade (%) — do aparelho</div>
          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="block">
              <span className="text-xs opacity-70">Umid mín</span>
              <input className="mt-1 w-full rounded border p-2" value={umidMin} onChange={(e) => setUmidMin(e.target.value)} inputMode="decimal" placeholder="ex: 40" />
            </label>
            <label className="block">
              <span className="text-xs opacity-70">Umid atual</span>
              <input className="mt-1 w-full rounded border p-2" value={umidAtual} onChange={(e) => setUmidAtual(e.target.value)} inputMode="decimal" placeholder="ex: 55" />
            </label>
            <label className="block">
              <span className="text-xs opacity-70">Umid máx</span>
              <input className="mt-1 w-full rounded border p-2" value={umidMax} onChange={(e) => setUmidMax(e.target.value)} inputMode="decimal" placeholder="ex: 70" />
            </label>
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

      {/* PLANILHA DO MÊS — parecido com a física */}
      <div className="mt-6 rounded border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Planilha do mês</div>
            <div className="text-sm opacity-70">{loadingMes ? "Carregando…" : `${leituras.length} registro(s) no mês`}</div>
          </div>
        </div>

        {loadingMes ? (
          <div className="mt-3 text-sm">Carregando…</div>
        ) : leituras.length === 0 ? (
          <div className="mt-3 text-sm opacity-70">Nenhum registro no mês ainda.</div>
        ) : (
          <div className="mt-3 overflow-auto">
            <table className="min-w-[1400px] w-full border-collapse text-sm">
              <thead>
                <tr className="bg-black/5">
                  <th className="border p-2">Dia</th>
                  <th className="border p-2">Turno</th>
                  <th className="border p-2">Hora</th>
                  <th className="border p-2">Local</th>

                  <th className="border p-2">Temp mín</th>
                  <th className="border p-2">Temp atual</th>
                  <th className="border p-2">Temp máx</th>

                  <th className="border p-2">Umid mín</th>
                  <th className="border p-2">Umid atual</th>
                  <th className="border p-2">Umid máx</th>

                  <th className="border p-2">Status</th>
                  <th className="border p-2">Ass.</th>
                  <th className="border p-2">Obs</th>
                </tr>
              </thead>
              <tbody>
                {leituras.map((r) => {
                  const loc = locais.find((l) => l.id === r.local_id);
                  const dt = new Date(r.lida_em);
                  const dia = dt.getDate().toString().padStart(2, "0");
                  const hora = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                  const ok = (r.status || "").toLowerCase() === "ok";

                  return (
                    <tr key={r.id} className={!ok ? "bg-red-50" : ""}>
                      <td className="border p-2">{dia}</td>
                      <td className="border p-2">{(r.turno || "").toLowerCase() === "tarde" ? "Tarde" : "Manhã"}</td>
                      <td className="border p-2">{hora}</td>
                      <td className="border p-2">{loc?.nome || r.local_id}</td>

                      <td className="border p-2">{r.temp_min_c ?? "—"}</td>
                      <td className="border p-2">{r.temp_c}</td>
                      <td className="border p-2">{r.temp_max_c ?? "—"}</td>

                      <td className="border p-2">{r.umid_min_pct ?? "—"}</td>
                      <td className="border p-2">{r.umid_pct ?? "—"}</td>
                      <td className="border p-2">{r.umid_max_pct ?? "—"}</td>

                      <td className="border p-2 font-semibold" style={{ color: ok ? "#0a7" : "#c00" }}>
                        {r.status}
                      </td>
                      <td className="border p-2">{r.assinatura || "—"}</td>
                      <td className="border p-2">{r.observacao || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-2 text-xs opacity-60">
              * Linha em vermelho quando o status não for OK (o trigger do banco continua classificando).
            </div>
          </div>
        )}
      </div>

      {/* impressão mais limpa */}
      <style jsx global>{`
        @media print {
          header,
          nav,
          aside,
          button,
          a {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
          table {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}