"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* =========================
   CONFIG
========================= */
const SENHA_ADMIN = "102030"; // 🔴 troque
const TABLE = "df_produtos";
const RPC_APPLY = "df_apply_stock_import";

type Mode = "REPLACE" | "ADD" | "SUBTRACT";

type ParsedRow = {
  line: number;            // linha do arquivo (1-based)
  raw: Record<string, any>;
  ean_raw: string;
  estoque_raw: string;
};

type RowFixed = {
  line: number;
  ean: string;             // já limpo (apenas dígitos)
  estoque: number;         // inteiro >= 0
  status: "OK" | "ERRO";
  errors: string[];
  produto_nome?: string | null;
  exists?: boolean;
};

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function toIntEstoque(v: any): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\./g, "")     // 1.234 -> 1234
    .replace(",", ".");     // 12,0 -> 12.0
  if (!s) return null;

  // se vier "12.0" etc.
  const n = Number(s);
  if (!Number.isFinite(n)) return null;

  // arredonda pra inteiro (estoque não pode quebrar)
  const i = Math.round(n);
  return i < 0 ? 0 : i;
}

function looksLikeScientific(v: string) {
  const s = String(v || "").toLowerCase();
  return s.includes("e+") || s.includes("e-");
}

/**
 * Parser CSV/TSV simples:
 * - detecta delimitador
 * - suporta aspas "..."
 * - não depende de lib externa
 */
function detectDelimiter(text: string): string {
  const sample = text.split(/\r?\n/).slice(0, 20).join("\n");
  const candidates = [",", ";", "\t", "|"];
  const scores = candidates.map((d) => ({
    d,
    count: (sample.match(new RegExp(`\\${d}`, "g")) || []).length,
  }));
  scores.sort((a, b) => b.count - a.count);
  return scores[0].count > 0 ? scores[0].d : ",";
}

function parseDelimited(text: string, delimiter: string) {
  const lines = text.replace(/\uFEFF/g, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return { headers: [] as string[], rows: [] as Record<string, string>[] };

  const headers = splitLine(lines[0], delimiter).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i], delimiter);
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = (cols[c] ?? "").trim();
    }
    rows.push(obj);
  }

  return { headers, rows };
}

function splitLine(line: string, delimiter: string) {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      // aspas duplas dentro: ""
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
  return out;
}

function normalizeHeader(h: string) {
  return (h || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tira acento
    .replace(/[^a-z0-9]/g, "");
}

function guessEanColumn(headers: string[]) {
  const keys = headers.map((h) => ({ h, n: normalizeHeader(h) }));
  const candidates = [
    "ean",
    "gtin",
    "codigobarras",
    "codigodebarras",
    "barcode",
    "codigo",
    "cod",
    "codbarras",
  ];
  for (const c of candidates) {
    const found = keys.find((x) => x.n === c);
    if (found) return found.h;
  }
  // fallback: qualquer header que tenha "ean" ou "gtin"
  const fuzzy = keys.find((x) => x.n.includes("ean") || x.n.includes("gtin") || x.n.includes("barras"));
  return fuzzy?.h ?? "";
}

function guessStockColumn(headers: string[]) {
  const keys = headers.map((h) => ({ h, n: normalizeHeader(h) }));
  const candidates = [
    "estoque",
    "saldo",
    "qtd",
    "quantidade",
    "disponivel",
    "disponivelestoque",
    "stock",
  ];
  for (const c of candidates) {
    const found = keys.find((x) => x.n === c);
    if (found) return found.h;
  }
  const fuzzy = keys.find((x) => x.n.includes("estoque") || x.n.includes("saldo") || x.n.includes("quant"));
  return fuzzy?.h ?? "";
}

async function fetchExistingByEan(eans: string[]) {
  // busca em chunks pra não estourar URL/limites
  const uniq = Array.from(new Set(eans.filter(Boolean)));
  const chunkSize = 400;
  const map = new Map<string, { nome: string | null }>();

  for (let i = 0; i < uniq.length; i += chunkSize) {
    const chunk = uniq.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from(TABLE)
      .select("ean,nome")
      .in("ean", chunk);

    if (error) throw error;

    for (const row of data || []) {
      map.set(row.ean, { nome: row.nome ?? null });
    }
  }

  return map;
}

/* =========================
   PAGE
========================= */
export default function AdminImportarEstoqueDF() {
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

  return <ImportInner onSair={sair} />;
}

function ImportInner({ onSair }: { onSair: () => void }) {
  const [mode, setMode] = useState<Mode>("REPLACE");
  const [createMissing, setCreateMissing] = useState(false);

  const [headers, setHeaders] = useState<string[]>([]);
  const [rowsParsed, setRowsParsed] = useState<ParsedRow[]>([]);
  const [colEan, setColEan] = useState("");
  const [colStock, setColStock] = useState("");

  const [fixed, setFixed] = useState<RowFixed[]>([]);
  const [loadingParse, setLoadingParse] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [processing, setProcessing] = useState(false);

  const validRows = useMemo(() => fixed.filter((r) => r.status === "OK"), [fixed]);
  const invalidRows = useMemo(() => fixed.filter((r) => r.status === "ERRO"), [fixed]);

  const preview = useMemo(() => fixed.slice(0, 12), [fixed]);

  async function handleFile(file: File) {
    setLoadingParse(true);
    try {
      const text = await file.text();
      const delimiter = detectDelimiter(text);
      const parsed = parseDelimited(text, delimiter);

      setHeaders(parsed.headers);

      const guessedEan = guessEanColumn(parsed.headers);
      const guessedStock = guessStockColumn(parsed.headers);

      setColEan(guessedEan);
      setColStock(guessedStock);

      const parsedRows: ParsedRow[] = parsed.rows.map((r, idx) => {
        const eanRaw = String(r[guessedEan] ?? "").trim();
        const stockRaw = String(r[guessedStock] ?? "").trim();
        return {
          line: idx + 2, // linha 1 é header
          raw: r,
          ean_raw: eanRaw,
          estoque_raw: stockRaw,
        };
      });

      setRowsParsed(parsedRows);

      // valida já com o guess
      await revalidate(parsedRows, guessedEan, guessedStock);
    } catch (e) {
      console.error(e);
      alert("Erro ao ler arquivo. Veja o console.");
    } finally {
      setLoadingParse(false);
    }
  }

  async function revalidate(baseRows = rowsParsed, eanCol = colEan, stockCol = colStock) {
    if (!baseRows.length) {
      setFixed([]);
      return;
    }
    if (!eanCol || !stockCol) {
      setFixed(
        baseRows.slice(0, 5000).map((r) => ({
          line: r.line,
          ean: "",
          estoque: 0,
          status: "ERRO",
          errors: ["Selecione as colunas de EAN e Estoque."],
        }))
      );
      return;
    }

    setLoadingCheck(true);
    try {
      // monta e corrige + valida base
      const temp: RowFixed[] = baseRows.map((r) => {
        const eanRaw = String((r.raw as any)[eanCol] ?? r.ean_raw ?? "").trim();
        const stockRaw = String((r.raw as any)[stockCol] ?? r.estoque_raw ?? "").trim();

        const errors: string[] = [];

        // EAN
        if (!eanRaw) errors.push("EAN vazio");
        if (looksLikeScientific(eanRaw)) errors.push("EAN em notação científica (corrija na planilha ou edite aqui)");
        const ean = onlyDigits(eanRaw);

        if (!ean) errors.push("EAN sem dígitos");
        if (ean && ![8, 12, 13, 14].includes(ean.length)) {
          errors.push(`EAN inválido (tamanho ${ean.length})`);
        }

        // Estoque
        const estoque = toIntEstoque(stockRaw);
        if (estoque === null) errors.push("Estoque inválido/vazio");

        return {
          line: r.line,
          ean,
          estoque: estoque ?? 0,
          status: errors.length ? "ERRO" : "OK",
          errors,
          produto_nome: null,
          exists: false,
        };
      });

      // remove duplicados: se mesmo EAN aparecer muitas vezes, soma estoque? ou mantém último?
      // Pra não gerar confusão e manter 0 erro: marcamos como erro e você decide.
      const seen = new Map<string, number>();
      for (const row of temp) {
        if (row.status === "OK") {
          const c = (seen.get(row.ean) ?? 0) + 1;
          seen.set(row.ean, c);
        }
      }
      for (const row of temp) {
        if (row.status === "OK" && (seen.get(row.ean) ?? 0) > 1) {
          row.status = "ERRO";
          row.errors.push("EAN duplicado no arquivo (una as linhas ou deixe apenas uma)");
        }
      }

      // valida existência no banco (somente linhas que ainda estão OK)
      const eansOK = temp.filter((r) => r.status === "OK").map((r) => r.ean);
      const existsMap = await fetchExistingByEan(eansOK);

      for (const row of temp) {
        if (row.status !== "OK") continue;
        const found = existsMap.get(row.ean);
        row.exists = !!found;
        row.produto_nome = found?.nome ?? null;

        if (!found && !createMissing) {
          row.status = "ERRO";
          row.errors.push("EAN não cadastrado no DF (cadastre o produto ou marque 'criar automaticamente')");
        }
      }

      setFixed(temp);
    } catch (e) {
      console.error(e);
      alert("Erro ao validar. Veja o console.");
    } finally {
      setLoadingCheck(false);
    }
  }

  function updateInvalid(idx: number, patch: Partial<RowFixed>) {
    setFixed((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }

  async function applyImport() {
    if (invalidRows.length > 0) {
      alert("Ainda existem erros. Corrija tudo para ficar 0 inválidas antes de processar.");
      return;
    }
    if (!validRows.length) {
      alert("Nenhuma linha válida para importar.");
      return;
    }

    setProcessing(true);
    try {
      // payload só com ean + estoque
      const payload = validRows.map((r) => ({ ean: r.ean, estoque: r.estoque }));

      const { data, error } = await supabase.rpc(RPC_APPLY, {
        rows: payload,
        mode,
        create_missing: createMissing,
      });

      if (error) throw error;

      alert(`Importação OK ✅\nLinhas aplicadas: ${payload.length}\nModo: ${mode}`);
    } catch (e: any) {
      console.error(e);
      alert(`Erro ao processar importação.\n${e?.message || "Veja o console."}`);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
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

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 1) Upload */}
        <div className="bg-white border rounded-3xl p-5 shadow-sm">
          <div className="font-extrabold text-gray-900">1) Envie o arquivo CSV</div>
          <div className="text-sm text-gray-600 mt-1">
            Aceita <b>,</b> <b>;</b> <b>tab</b> e <b>|</b>. Colunas podem ter nomes variados (EAN/GTIN/Código de barras, estoque/saldo/qtd...).
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="w-full rounded-2xl border px-4 py-3 bg-white"
              />
            </div>

            <div>
              <div className="text-xs font-bold text-gray-600">Modo</div>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                className="mt-1 w-full rounded-2xl border px-4 py-3 bg-white outline-none focus:ring-4 focus:ring-blue-100"
              >
                <option value="REPLACE">Substituir (REPLACE)</option>
                <option value="ADD">Somar (ADD)</option>
                <option value="SUBTRACT">Subtrair (SUBTRACT)</option>
              </select>
              <div className="text-[11px] text-gray-500 mt-1">
                Diário normalmente é <b>REPLACE</b>.
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              id="createMissing"
              type="checkbox"
              checked={createMissing}
              onChange={(e) => setCreateMissing(e.target.checked)}
            />
            <label htmlFor="createMissing" className="text-sm text-gray-700">
              Criar produto automaticamente se não existir (nome vira “PRODUTO {`{ean}` }”)
            </label>
          </div>

          {!!headers.length && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-bold text-gray-600">Coluna EAN</div>
                <select
                  value={colEan}
                  onChange={(e) => setColEan(e.target.value)}
                  className="mt-1 w-full rounded-2xl border px-4 py-3 bg-white outline-none focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Selecione…</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-600">Coluna Estoque</div>
                <select
                  value={colStock}
                  onChange={(e) => setColStock(e.target.value)}
                  className="mt-1 w-full rounded-2xl border px-4 py-3 bg-white outline-none focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Selecione…</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => revalidate(rowsParsed, colEan, colStock)}
                disabled={loadingParse || loadingCheck || !rowsParsed.length}
                className={`md:col-span-2 mt-1 px-4 py-3 rounded-2xl font-extrabold ${
                  loadingParse || loadingCheck || !rowsParsed.length
                    ? "bg-gray-200 text-gray-500"
                    : "bg-blue-700 hover:bg-blue-800 text-white"
                }`}
              >
                {loadingCheck ? "Revalidando..." : "Revalidar (aplicar correções e checar banco)"}
              </button>
            </div>
          )}
        </div>

        {/* RESUMO */}
        {!!fixed.length && (
          <div className="bg-white border rounded-3xl p-5 shadow-sm">
            <div className="font-extrabold text-gray-900">Resumo</div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Stat title="Linhas lidas" value={fixed.length} />
              <Stat title="Válidas" value={validRows.length} ok />
              <Stat title="Inválidas" value={invalidRows.length} bad />
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Para dar <b>0 erro</b>, corrija as inválidas abaixo (editando EAN/Estoque) e clique <b>Revalidar</b>.
              O botão de processar só libera quando <b>Inválidas = 0</b>.
            </div>
          </div>
        )}

        {/* 2) Prévia */}
        {!!fixed.length && (
          <div className="bg-white border rounded-3xl p-5 shadow-sm overflow-hidden">
            <div className="font-extrabold text-gray-900">2) Prévia</div>
            <div className="text-sm text-gray-600 mt-1">
              Mostrando até 12 linhas (já com EAN limpo e estoque convertido).
            </div>

            <div className="mt-4 overflow-auto">
              <table className="min-w-[760px] w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="py-2 pr-3">Linha</th>
                    <th className="py-2 pr-3">EAN</th>
                    <th className="py-2 pr-3">Estoque</th>
                    <th className="py-2 pr-3">Produto</th>
                    <th className="py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r) => (
                    <tr key={r.line} className="border-t">
                      <td className="py-2 pr-3">{r.line}</td>
                      <td className="py-2 pr-3 font-mono">{r.ean || "—"}</td>
                      <td className="py-2 pr-3 font-extrabold">{r.estoque}</td>
                      <td className="py-2 pr-3 text-gray-600">{r.produto_nome || (r.exists ? "—" : "")}</td>
                      <td className="py-2 pr-3">
                        {r.status === "OK" ? (
                          <span className="text-green-700 font-extrabold">OK</span>
                        ) : (
                          <span className="text-red-600 font-extrabold">ERRO</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {invalidRows.length === 0 && validRows.length > 0 ? (
              <div className="mt-5">
                <button
                  onClick={applyImport}
                  disabled={processing}
                  className={`w-full px-4 py-4 rounded-2xl font-extrabold ${
                    processing ? "bg-gray-200 text-gray-500" : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {processing ? "Processando..." : "3) Processar importação (0 erros ✅)"}
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* 3) Correção de erros */}
        {invalidRows.length > 0 && (
          <div className="bg-white border rounded-3xl p-5 shadow-sm overflow-hidden">
            <div className="font-extrabold text-gray-900">Corrigir erros (obrigatório)</div>
            <div className="text-sm text-gray-600 mt-1">
              Edite EAN/Estoque nas linhas com problema. Depois clique <b>Revalidar</b>.
            </div>

            <div className="mt-4 overflow-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="py-2 pr-3">Linha</th>
                    <th className="py-2 pr-3">EAN (editar)</th>
                    <th className="py-2 pr-3">Estoque (editar)</th>
                    <th className="py-2 pr-3">Erros</th>
                  </tr>
                </thead>
                <tbody>
                  {fixed.map((r, idx) => {
                    if (r.status !== "ERRO") return null;

                    return (
                      <tr key={r.line} className="border-t">
                        <td className="py-2 pr-3">{r.line}</td>

                        <td className="py-2 pr-3">
                          <input
                            value={r.ean}
                            onChange={(e) => updateInvalid(idx, { ean: onlyDigits(e.target.value) })}
                            className="w-full rounded-xl border px-3 py-2 font-mono outline-none focus:ring-4 focus:ring-blue-100"
                            placeholder="Somente dígitos"
                          />
                          <div className="text-[11px] text-gray-500 mt-1">
                            Dica: EAN válido = 8, 12, 13 ou 14 dígitos.
                          </div>
                        </td>

                        <td className="py-2 pr-3">
                          <input
                            value={String(r.estoque)}
                            onChange={(e) => {
                              const v = toIntEstoque(e.target.value);
                              updateInvalid(idx, { estoque: v ?? 0 });
                            }}
                            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"
                            placeholder="inteiro"
                          />
                          <div className="text-[11px] text-gray-500 mt-1">Sempre inteiro ≥ 0.</div>
                        </td>

                        <td className="py-2 pr-3">
                          <ul className="text-red-600 font-semibold list-disc pl-5">
                            {r.errors.map((er, i) => (
                              <li key={i}>{er}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => revalidate(rowsParsed, colEan, colStock)}
              disabled={loadingCheck}
              className={`mt-5 w-full px-4 py-4 rounded-2xl font-extrabold ${
                loadingCheck ? "bg-gray-200 text-gray-500" : "bg-blue-700 hover:bg-blue-800 text-white"
              }`}
            >
              {loadingCheck ? "Revalidando..." : "Revalidar e tentar zerar erros"}
            </button>
          </div>
        )}

        {/* Aviso Excel */}
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5">
          <div className="font-extrabold text-blue-900">Importante (Excel)</div>
          <div className="text-sm text-blue-900/80 mt-1">
            Se o EAN vier como <b>notação científica</b> (ex: 7,8912E+12), ele fica impossível de recuperar automaticamente.
            O certo é importar o CSV pelo Excel como <b>Texto</b> (Dados → De Texto/CSV → coluna EAN = Texto).
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value, ok, bad }: { title: string; value: number; ok?: boolean; bad?: boolean }) {
  return (
    <div className={`border rounded-2xl p-4 ${ok ? "bg-green-50 border-green-200" : bad ? "bg-red-50 border-red-200" : "bg-gray-50"}`}>
      <div className="text-[11px] text-gray-600 font-bold">{title}</div>
      <div className={`text-2xl font-extrabold ${ok ? "text-green-700" : bad ? "text-red-600" : "text-gray-900"}`}>
        {value}
      </div>
    </div>
  );
}
