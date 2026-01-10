"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* =========================
   CONFIG
========================= */
const SENHA_ADMIN = "102030"; // 🔴 troque
const RPC_IMPORT = "df_importar_estoque";

type Mode = "REPLACE" | "ADD" | "SUBTRACT";

type ParsedRow = {
  line: number;
  raw: Record<string, string>;
  ean: string;
  estoque: number | null;
  error?: string | null;
};

type ImportItem = { ean: string; estoque: number };

function normalizeHeader(s: string) {
  return (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^\w]+/g, "_") // tudo que não é letra/numero vira _
    .replace(/^_+|_+$/g, "");
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function detectDelimiter(line: string) {
  const candidates = [",", ";", "\t", "|"];
  let best = { d: ",", score: -1 };
  for (const d of candidates) {
    const score = (line.split(d).length - 1);
    if (score > best.score) best = { d, score };
  }
  return best.d;
}

// CSV split simples com suporte a aspas
function splitCsvLine(line: string, delimiter: string) {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      // "" dentro de aspas vira "
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

function parseNumberFlexible(v: string): number | null {
  const s = (v ?? "").toString().trim();
  if (!s) return null;

  // remove espaços
  let x = s.replace(/\s+/g, "");

  // se for inteiro puro
  if (/^-?\d+$/.test(x)) return Math.max(0, parseInt(x, 10));

  // se tiver decimal com , ou .
  if (/^-?\d+([,.]\d+)$/.test(x)) {
    x = x.replace(",", ".");
    const n = Math.round(Number(x));
    return Number.isFinite(n) ? Math.max(0, n) : null;
  }

  // se vier com separador de milhar (1.234 ou 1.234,00) ou (1,234.00)
  // estratégia: manter só dígitos, ponto, vírgula e sinal
  x = x.replace(/[^\d,.\-]/g, "");

  // tenta formato BR: 1.234,56
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(x)) {
    x = x.replace(/\./g, "").replace(",", ".");
    const n = Math.round(Number(x));
    return Number.isFinite(n) ? Math.max(0, n) : null;
  }

  // tenta formato US: 1,234.56
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(x)) {
    x = x.replace(/,/g, "");
    const n = Math.round(Number(x));
    return Number.isFinite(n) ? Math.max(0, n) : null;
  }

  // fallback: pega primeiro número encontrado
  const m = x.match(/-?\d+([,.]\d+)?/);
  if (!m) return null;
  let y = m[0].replace(",", ".");
  const n = Math.round(Number(y));
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportarEstoquePage() {
  const [authed, setAuthed] = useState(false);
  const [senha, setSenha] = useState("");

  useEffect(() => {
    const ok = typeof window !== "undefined" && localStorage.getItem("df_admin_ok") === "1";
    if (ok) setAuthed(true);
  }, []);

  function login() {
    if (senha === SENHA_ADMIN) {
      localStorage.setItem("df_admin_ok", "1");
      setAuthed(true);
    } else {
      alert("Senha incorreta.");
    }
  }

  function sair() {
    localStorage.removeItem("df_admin_ok");
    setAuthed(false);
    setSenha("");
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border rounded-3xl shadow-sm p-6">
          <div className="text-xl font-extrabold text-gray-900">Admin • Importar estoque (DF)</div>
          <div className="text-sm text-gray-600 mt-1">Digite a senha para acessar.</div>

          <input
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            type="password"
            placeholder="Senha"
            className="mt-4 w-full border rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />

          <button
            onClick={login}
            className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white rounded-2xl py-3 font-extrabold"
          >
            Entrar
          </button>

          <div className="mt-3 text-[11px] text-gray-500">
            Dica: depois de entrar, fica salvo no navegador (localStorage).
          </div>
        </div>
      </div>
    );
  }

  return <ImportarEstoqueInner onSair={sair} />;
}

function ImportarEstoqueInner({ onSair }: { onSair: () => void }) {
  const [mode, setMode] = useState<Mode>("REPLACE");
  const [filename, setFilename] = useState<string | null>(null);

  const [rawText, setRawText] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [items, setItems] = useState<ImportItem[]>([]);

  const [loadingParse, setLoadingParse] = useState(false);
  const [sending, setSending] = useState(false);

  const [result, setResult] = useState<any>(null);

  const eanAliases = useMemo(
    () =>
      new Set([
        "ean",
        "gtin",
        "barcode",
        "codigo_barras",
        "codigo_de_barras",
        "cod_barras",
        "codbarras",
        "codigobarras",
        "codigo",
        "cod",
        "ean_gtin",
        "codigoean",
      ]),
    []
  );

  const stockAliases = useMemo(
    () =>
      new Set([
        "estoque",
        "saldo",
        "saldo_disponivel",
        "disponivel",
        "disponivel_loja",
        "quantidade",
        "qtd",
        "qty",
        "stock",
        "saldo_atual",
        "saldo_positivo",
      ]),
    []
  );

  async function onPickFile(file: File | null) {
    if (!file) return;
    setFilename(file.name);
    setResult(null);

    setLoadingParse(true);
    try {
      const text = await file.text();
      setRawText(text);
      const p = parseCsvToRows(text, eanAliases, stockAliases);
      setParsed(p.rows);
      setItems(p.items);
    } catch (e) {
      console.error(e);
      alert("Erro ao ler/parsear arquivo. Veja console.");
    } finally {
      setLoadingParse(false);
    }
  }

  async function enviar() {
    if (!items.length) {
      alert("Nenhum item válido para importar.");
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const { data, error } = await supabase.rpc(RPC_IMPORT, {
        items,
        mode,
        filename: filename || null,
      });

      if (error) throw error;
      setResult(data);

      // Se quiser: resetar arquivo após sucesso
      // setRawText("");
      // setParsed([]);
      // setItems([]);
    } catch (e: any) {
      console.error("Erro RPC import:", e);
      alert(`Erro ao importar: ${e?.message || "veja o console"}`);
    } finally {
      setSending(false);
    }
  }

  const preview = useMemo(() => parsed.slice(0, 12), [parsed]);

  const counts = useMemo(() => {
    const total = parsed.length;
    const valid = items.length;
    const invalid = parsed.filter((r) => r.error).length;
    return { total, valid, invalid };
  }, [parsed, items]);

  function baixarNaoEncontrados() {
    const arr = (result?.not_found_items || []) as Array<{ ean: string; estoque: number }>;
    const csv = ["ean,estoque", ...arr.map((x) => `${x.ean},${x.estoque}`)].join("\n");
    downloadText(`df_nao_encontrados_${Date.now()}.csv`, csv);
  }

  function baixarInvalidos() {
    const arr = (result?.invalid_items || []) as Array<any>;
    const header = "linha,ean,estoque_raw,erro";
    const lines = arr.map((x) => {
      const linha = x.linha ?? "";
      const ean = x.ean ?? "";
      const estoque_raw = (x.estoque_raw ?? "").toString().replace(/"/g, '""');
      const erro = (x.erro ?? "").toString().replace(/"/g, '""');
      return `${linha},${ean},"${estoque_raw}","${erro}"`;
    });
    downloadText(`df_invalidos_${Date.now()}.csv`, [header, ...lines].join("\n"));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="font-extrabold text-gray-900">Admin • Importar estoque (DF)</div>
          <div className="flex-1" />
          <button
            onClick={onSair}
            className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-sm"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* UPLOAD + CONFIG */}
        <div className="bg-white border rounded-3xl p-4 shadow-sm">
          <div className="font-extrabold text-gray-900">1) Envie o arquivo CSV</div>
          <div className="text-sm text-gray-600 mt-1">
            Aceita <b>;</b>, <b>,</b>, <b>tab</b> e <b>|</b>. Colunas podem ter nomes variados (EAN/GTIN/Código de barras, estoque/saldo/qtd…).
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <div className="text-xs font-bold text-gray-600">Arquivo</div>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => onPickFile(e.target.files?.[0] || null)}
                className="mt-1 w-full rounded-2xl border px-3 py-2 bg-white"
              />
              {filename ? <div className="mt-1 text-xs text-gray-500">Selecionado: {filename}</div> : null}
            </div>

            <div>
              <div className="text-xs font-bold text-gray-600">Modo</div>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                className="mt-1 w-full rounded-2xl border px-3 py-2 bg-white"
              >
                <option value="REPLACE">Substituir (REPLACE)</option>
                <option value="ADD">Somar (ADD)</option>
                <option value="SUBTRACT">Subtrair (SUBTRACT)</option>
              </select>
              <div className="mt-1 text-[11px] text-gray-500">
                Diário normalmente é <b>REPLACE</b>.
              </div>
            </div>
          </div>

          {/* RESUMO PARSE */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <CardMini label="Linhas lidas" value={loadingParse ? "..." : String(counts.total)} />
            <CardMini label="Válidas" value={loadingParse ? "..." : String(counts.valid)} />
            <CardMini label="Inválidas" value={loadingParse ? "..." : String(counts.invalid)} />
          </div>
        </div>

        {/* PREVIEW */}
        <div className="bg-white border rounded-3xl p-4 shadow-sm">
          <div className="font-extrabold text-gray-900">2) Prévia</div>
          <div className="text-sm text-gray-600 mt-1">Mostrando até 12 linhas (já com EAN limpo e estoque convertido).</div>

          {loadingParse ? (
            <div className="mt-4 text-gray-600">Lendo/parseando…</div>
          ) : preview.length === 0 ? (
            <div className="mt-4 text-gray-600">Nenhum dado para mostrar (envie um arquivo).</div>
          ) : (
            <div className="mt-4 overflow-auto border rounded-2xl">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Linha</th>
                    <th className="text-left p-2">EAN</th>
                    <th className="text-left p-2">Estoque</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r) => (
                    <tr key={r.line} className="border-t">
                      <td className="p-2 text-gray-500">{r.line}</td>
                      <td className="p-2 font-mono">{r.ean || "—"}</td>
                      <td className="p-2">{r.estoque ?? "—"}</td>
                      <td className="p-2">
                        {r.error ? (
                          <span className="text-red-700 font-bold">{r.error}</span>
                        ) : (
                          <span className="text-green-700 font-bold">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            onClick={enviar}
            disabled={sending || !items.length}
            className={`mt-4 px-4 py-3 rounded-2xl font-extrabold ${
              sending || !items.length ? "bg-gray-200 text-gray-500" : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {sending ? "Importando…" : "3) Processar importação"}
          </button>

          {!items.length && rawText ? (
            <div className="mt-2 text-[12px] text-red-700 font-bold">
              Nenhuma linha válida encontrada. Confere se tem coluna de EAN e estoque/saldo.
            </div>
          ) : null}
        </div>

        {/* RESULTADO */}
        {result ? (
          <div className="bg-white border rounded-3xl p-4 shadow-sm">
            <div className="font-extrabold text-gray-900">Resultado</div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3">
              <CardMini label="Total" value={String(result.total ?? 0)} />
              <CardMini label="Válidas" value={String(result.valid ?? 0)} />
              <CardMini label="Atualizadas" value={String(result.updated ?? 0)} />
              <CardMini label="Não encontradas" value={String(result.not_found ?? 0)} />
              <CardMini label="Inválidas" value={String(result.invalid ?? 0)} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={baixarNaoEncontrados}
                disabled={!Array.isArray(result?.not_found_items) || result.not_found_items.length === 0}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-sm disabled:opacity-50"
              >
                Baixar “não encontrados” (CSV)
              </button>
              <button
                onClick={baixarInvalidos}
                disabled={!Array.isArray(result?.invalid_items) || result.invalid_items.length === 0}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold text-sm disabled:opacity-50"
              >
                Baixar “inválidos” (CSV)
              </button>
            </div>

            <div className="mt-3 text-[11px] text-gray-500">
              Run ID: <span className="font-mono">{result.run_id}</span> • Mode: <b>{result.mode}</b>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CardMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 border rounded-2xl p-3">
      <div className="text-[11px] text-gray-500 font-bold">{label}</div>
      <div className="font-extrabold text-gray-900 text-lg">{value}</div>
    </div>
  );
}

function parseCsvToRows(
  text: string,
  eanAliases: Set<string>,
  stockAliases: Set<string>
): { rows: ParsedRow[]; items: ImportItem[] } {
  const lines = (text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (!lines.length) return { rows: [], items: [] };

  const delimiter = detectDelimiter(lines[0]);
  const headerCells = splitCsvLine(lines[0], delimiter).map(normalizeHeader);

  // detecta colunas
  const idxEan = findHeaderIndex(headerCells, eanAliases);
  const idxStock = findHeaderIndex(headerCells, stockAliases);

  // se não achou cabeçalho, tenta fallback: primeira coluna = ean, segunda = estoque
  const hasHeader = idxEan !== -1 || idxStock !== -1;

  const start = hasHeader ? 1 : 0;

  const rows: ParsedRow[] = [];
  const itemsMap = new Map<string, number>(); // ean -> estoque (último vence)

  for (let i = start; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter);
    const lineNo = i + 1;

    let eanRaw = "";
    let stockRaw = "";

    if (hasHeader) {
      if (idxEan >= 0) eanRaw = cells[idxEan] ?? "";
      if (idxStock >= 0) stockRaw = cells[idxStock] ?? "";
    } else {
      eanRaw = cells[0] ?? "";
      stockRaw = cells[1] ?? "";
    }

    const ean = onlyDigits(eanRaw);
    const estoque = parseNumberFlexible(stockRaw);

    let error: string | null = null;
    if (!ean || ean.length < 8) error = "EAN inválido";
    else if (estoque === null) error = "Estoque inválido";

    const raw: Record<string, string> = {};
    // só para debug/registro local
    raw["ean"] = eanRaw;
    raw["estoque"] = stockRaw;

    rows.push({ line: lineNo, raw, ean, estoque, error });

    if (!error && estoque !== null) {
      itemsMap.set(ean, estoque);
    }
  }

  const items: ImportItem[] = Array.from(itemsMap.entries()).map(([ean, estoque]) => ({ ean, estoque }));

  return { rows, items };
}

function findHeaderIndex(headers: string[], aliases: Set<string>) {
  // match exato
  for (let i = 0; i < headers.length; i++) {
    if (aliases.has(headers[i])) return i;
  }
  // match parcial (ex: "codigo_de_barras_ean")
  for (let i = 0; i < headers.length; i++) {
    for (const a of aliases) {
      if (headers[i].includes(a)) return i;
    }
  }
  return -1;
}
