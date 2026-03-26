"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabaseClient";
import InventarioShell from "@/app/inventario/_components/InventarioShell";

type LinhaPlanilha = Record<string, any>;

export default function ImportarPlanilhaPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [arquivoNome, setArquivoNome] = useState("");
  const [linhas, setLinhas] = useState<LinhaPlanilha[]>([]);
  const [loadingArquivo, setLoadingArquivo] = useState(false);
  const [importando, setImportando] = useState(false);

  const [mapa, setMapa] = useState({
    produto_nome: "",
    quantidade_sistema: "",
    codigo_barras: "",
    lote: "",
    validade: "",
    categoria: "",
    apresentacao: "",
  });

  const colunas = useMemo(() => {
    if (!linhas.length) return [];
    return Object.keys(linhas[0] || {});
  }, [linhas]);

  async function handleArquivo(file?: File | null) {
    if (!file) return;

    try {
      setLoadingArquivo(true);
      setArquivoNome(file.name);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const primeiraAba = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<LinhaPlanilha>(primeiraAba, {
        defval: "",
      });

      setLinhas(json);
    } catch (error) {
      console.error(error);
      alert("Não foi possível ler a planilha.");
    } finally {
      setLoadingArquivo(false);
    }
  }

  function inferirCategoria(valor: any) {
    const texto = String(valor || "").toLowerCase().trim();

    if (!texto) return "outro";
    if (texto.includes("control")) return "controlado";
    if (texto.includes("antib")) return "antibiotico";

    return "outro";
  }

  function normalizarValidade(valor: any) {
    if (!valor) return null;

    if (typeof valor === "number") {
      const date = XLSX.SSF.parse_date_code(valor);
      if (!date) return null;

      const yyyy = String(date.y).padStart(4, "0");
      const mm = String(date.m).padStart(2, "0");
      const dd = String(date.d).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    const texto = String(valor).trim();
    if (!texto) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
      const [dd, mm, yyyy] = texto.split("/");
      return `${yyyy}-${mm}-${dd}`;
    }

    const data = new Date(texto);
    if (Number.isNaN(data.getTime())) return null;

    const yyyy = data.getFullYear();
    const mm = String(data.getMonth() + 1).padStart(2, "0");
    const dd = String(data.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  async function importarPlanilha() {
    if (!linhas.length) {
      alert("Nenhuma planilha carregada.");
      return;
    }

    if (!mapa.produto_nome || !mapa.quantidade_sistema) {
      alert("Mapeie pelo menos Produto e Quantidade do sistema.");
      return;
    }

    try {
      setImportando(true);

      const payload = linhas
        .map((row) => {
          const produtoNome = String(row[mapa.produto_nome] || "").trim();
          if (!produtoNome) return null;

          const qtd = Number(
            String(row[mapa.quantidade_sistema] ?? "0")
              .replace(/\./g, "")
              .replace(",", ".")
          );

          return {
            inventario_id: id,
            produto_nome: produtoNome,
            quantidade_sistema: Number.isFinite(qtd) ? qtd : 0,
            codigo_barras: mapa.codigo_barras
              ? String(row[mapa.codigo_barras] || "").trim() || null
              : null,
            lote: mapa.lote ? String(row[mapa.lote] || "").trim() || null : null,
            validade: mapa.validade
              ? normalizarValidade(row[mapa.validade])
              : null,
            categoria: mapa.categoria
              ? inferirCategoria(row[mapa.categoria])
              : "outro",
            apresentacao: mapa.apresentacao
              ? String(row[mapa.apresentacao] || "").trim() || null
              : null,
            status: "pendente",
          };
        })
        .filter(Boolean);

      if (!payload.length) {
        alert("Nenhuma linha válida encontrada para importar.");
        return;
      }

      const { error: insertError } = await supabase
        .from("inventario_itens")
        .insert(payload as any[]);

      if (insertError) throw insertError;

      const extensao = arquivoNome.split(".").pop()?.toLowerCase() || "";

      await supabase.from("inventario_importacoes").insert({
        inventario_id: id,
        nome_arquivo: arquivoNome,
        tipo_arquivo: extensao,
        total_linhas: payload.length,
        status: "processado",
      });

      alert("Planilha importada com sucesso.");
      router.push(`/inventario/${id}`);
    } catch (error) {
      console.error(error);
      alert("Erro ao importar planilha.");
    } finally {
      setImportando(false);
    }
  }

  return (
    <InventarioShell
      title="Importar planilha"
      subtitle="Suba o estoque da loja e mapeie as colunas para montar o inventário"
      right={
        <Link
          href={`/inventario/${id}`}
          className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
        >
          Voltar ao inventário
        </Link>
      }
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Arquivo</h2>

        <div className="mt-4">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => handleArquivo(e.target.files?.[0])}
            className="block w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>

        <div className="mt-3 text-sm text-slate-500">
          {loadingArquivo
            ? "Lendo planilha..."
            : arquivoNome
            ? `Arquivo carregado: ${arquivoNome}`
            : "Nenhum arquivo carregado"}
        </div>
      </div>

      {linhas.length > 0 && (
        <>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Mapeamento de colunas
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Selecione quais colunas da planilha correspondem aos campos do inventário
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <CampoMapa
                label="Produto"
                value={mapa.produto_nome}
                onChange={(v) => setMapa((prev) => ({ ...prev, produto_nome: v }))}
                options={colunas}
              />

              <CampoMapa
                label="Quantidade sistema"
                value={mapa.quantidade_sistema}
                onChange={(v) =>
                  setMapa((prev) => ({ ...prev, quantidade_sistema: v }))
                }
                options={colunas}
              />

              <CampoMapa
                label="EAN / Código de barras"
                value={mapa.codigo_barras}
                onChange={(v) =>
                  setMapa((prev) => ({ ...prev, codigo_barras: v }))
                }
                options={colunas}
              />

              <CampoMapa
                label="Lote"
                value={mapa.lote}
                onChange={(v) => setMapa((prev) => ({ ...prev, lote: v }))}
                options={colunas}
              />

              <CampoMapa
                label="Validade"
                value={mapa.validade}
                onChange={(v) => setMapa((prev) => ({ ...prev, validade: v }))}
                options={colunas}
              />

              <CampoMapa
                label="Categoria"
                value={mapa.categoria}
                onChange={(v) => setMapa((prev) => ({ ...prev, categoria: v }))}
                options={colunas}
              />

              <CampoMapa
                label="Apresentação"
                value={mapa.apresentacao}
                onChange={(v) =>
                  setMapa((prev) => ({ ...prev, apresentacao: v }))
                }
                options={colunas}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={importarPlanilha}
                disabled={importando}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {importando ? "Importando..." : "Importar planilha"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Prévia da planilha</h2>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    {colunas.map((col) => (
                      <th key={col} className="px-3 py-2">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linhas.slice(0, 8).map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                      {colunas.map((col) => (
                        <td key={col} className="px-3 py-2 whitespace-nowrap">
                          {String(row[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </InventarioShell>
  );
}

function CampoMapa({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
      >
        <option value="">Selecione</option>
        {options.map((col) => (
          <option key={col} value={col}>
            {col}
          </option>
        ))}
      </select>
    </div>
  );
}