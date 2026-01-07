"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOJA = "drogariaredefabiano";

function fmt(n: any) {
  return Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * ✅ Correções aplicadas:
 * - Buscar fechamento automaticamente quando muda a data (useEffect com dataRef)
 * - Evitar "2 caixas no mesmo dia": usa sempre o mais recente (order desc + limit 1) e avisa se houver duplicados
 * - Normaliza range de data: fim do dia com milissegundos e ISO completo
 * - Pequenas proteções contra data vazia
 */
export default function RelatorioDiarioCaixaPage() {
  const [dataRef, setDataRef] = useState<string>(toISODate(new Date()));
  const [registro, setRegistro] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string>("");
  const [avisoDuplicado, setAvisoDuplicado] = useState<string>("");

  async function carregar(dataEscolhida?: string) {
    const dt = (dataEscolhida ?? dataRef)?.trim();
    if (!dt) {
      setRegistro(null);
      setErro("Selecione uma data válida.");
      return;
    }

    setErro("");
    setAvisoDuplicado("");
    setLoading(true);

    // pega do começo ao fim do dia (inclui milissegundos)
    const ini = `${dt}T00:00:00.000`;
    const fim = `${dt}T23:59:59.999`;

    const { data, error } = await supabase
      .from("caixa_diario")
      .select("*")
      .eq("loja", LOJA)
      .gte("data", ini)
      .lte("data", fim)
      .order("data", { ascending: false })
      .limit(5); // pega alguns pra detectar duplicado

    if (error) {
      console.error(error);
      setErro("Erro ao buscar fechamento do dia.");
      setRegistro(null);
      setLoading(false);
      return;
    }

    const primeiro = data?.[0] || null;
    setRegistro(primeiro);

    if (data && data.length > 1) {
      setAvisoDuplicado(
        `⚠️ Existem ${data.length} fechamentos nessa data. Mostrando o MAIS RECENTE automaticamente.`
      );
    }

    setLoading(false);
  }

  // ✅ carrega ao abrir e sempre que mudar a data
  useEffect(() => {
    carregar(dataRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataRef]);

  const calc = useMemo(() => {
    if (!registro) return null;

    const entradas =
      Number(registro.dinheiro || 0) +
      Number(registro.pix_cnpj || 0) +
      Number(registro.pix_qr || 0) +
      Number(registro.cartoes || 0) +
      Number(registro.receb_fiado || 0);

    const saidas =
      Number(registro.sangrias || 0) +
      Number(registro.despesas || 0) +
      Number(registro.boletos || 0) +
      Number(registro.compras || 0);

    const saldo = entradas - saidas;

    return { entradas, saidas, saldo };
  }, [registro]);

  function gerarPDF() {
    window.print();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      {/* CSS impressão */}
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* CONTROLES */}
      <div className="no-print max-w-4xl mx-auto bg-white rounded-lg shadow p-4 mb-4">
        <h1 className="text-xl font-bold text-blue-700 mb-3">
          📄 Relatório Diário (PDF) — Caixa
        </h1>

        <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Data</label>
            <input
              type="date"
              value={dataRef}
              onChange={(e) => setDataRef(e.target.value)}
              className="border rounded p-2"
            />
          </div>

          <button
            onClick={() => carregar(dataRef)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
          >
            Buscar Fechamento
          </button>

          <button
            onClick={gerarPDF}
            disabled={!registro}
            className={`px-4 py-2 rounded font-semibold ${
              registro
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            🖨️ Gerar PDF (Imprimir)
          </button>
        </div>

        {avisoDuplicado && (
          <p className="text-amber-700 mt-3 font-semibold">{avisoDuplicado}</p>
        )}
        {erro && <p className="text-red-600 mt-3">{erro}</p>}
        {loading && <p className="text-gray-600 mt-3">Carregando...</p>}
        {!loading && !erro && !registro && (
          <p className="text-gray-600 mt-3">
            Nenhum fechamento encontrado nessa data.
          </p>
        )}
      </div>

      {/* ÁREA DE IMPRESSÃO */}
      <div className="print-area max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-800">
              Drogaria Rede Fabiano
            </h2>
            <p className="text-sm text-gray-600">
              Relatório Diário do Caixa (Fechamento)
            </p>
            <p className="text-sm text-gray-600">
              Data: <span className="font-semibold">{dataRef}</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-600">Loja</p>
            <p className="font-semibold">{LOJA}</p>
          </div>
        </div>

        {!registro ? (
          <div className="py-10 text-center text-gray-600">
            Selecione a data e clique em <b>Buscar Fechamento</b>.
          </div>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="border rounded p-3">
                <p className="text-xs text-gray-600">Venda Total</p>
                <p className="text-lg font-bold">
                  R$ {fmt(registro.venda_total)}
                </p>
              </div>
              <div className="border rounded p-3">
                <p className="text-xs text-gray-600">Entradas</p>
                <p className="text-lg font-bold text-green-700">
                  R$ {fmt(calc?.entradas)}
                </p>
              </div>
              <div className="border rounded p-3">
                <p className="text-xs text-gray-600">Saídas</p>
                <p className="text-lg font-bold text-red-700">
                  R$ {fmt(calc?.saidas)}
                </p>
              </div>
              <div className="border rounded p-3">
                <p className="text-xs text-gray-600">Saldo do Dia</p>
                <p
                  className={`text-lg font-bold ${
                    (calc?.saldo || 0) >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  R$ {fmt(calc?.saldo)}
                </p>
              </div>
            </div>

            {/* Detalhamento Entradas */}
            <div className="mt-6">
              <h3 className="font-bold text-blue-700 mb-2">Entradas</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Item label="Dinheiro" value={registro.dinheiro} />
                <Item label="Pix CNPJ" value={registro.pix_cnpj} />
                <Item label="Pix QR" value={registro.pix_qr} />
                <Item label="Cartões" value={registro.cartoes} />
                <Item
                  label="Receb. Fiado"
                  value={registro.receb_fiado}
                  strong
                />
                <Item
                  label="Venda Fiado (registro)"
                  value={registro.venda_fiado}
                  accent
                />
              </div>
            </div>

            {/* Detalhamento Saídas */}
            <div className="mt-6">
              <h3 className="font-bold text-blue-700 mb-2">Saídas</h3>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                <ItemDesc
                  label="Sangrias"
                  value={registro.sangrias}
                  desc={registro.desc_sangrias}
                />
                <ItemDesc
                  label="Despesas"
                  value={registro.despesas}
                  desc={registro.desc_despesas}
                />
                <ItemDesc
                  label="Boletos"
                  value={registro.boletos}
                  desc={registro.desc_boletos}
                />
                <ItemDesc
                  label="Compras"
                  value={registro.compras}
                  desc={registro.desc_compras}
                />
              </div>
            </div>

            {/* Rodapé */}
            <div className="mt-8 pt-4 border-t flex items-end justify-between">
              <div className="text-xs text-gray-500">
                Gerado em: {new Date().toLocaleString("pt-BR")}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  Fernando dos Santos Pereira
                </p>
                <p className="text-xs text-gray-500">Responsável</p>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Item({ label, value, strong, accent }: any) {
  const v = Number(value || 0);
  return (
    <div className="border rounded p-3">
      <p className="text-xs text-gray-600">{label}</p>
      <p
        className={[
          "text-base font-bold",
          strong ? "text-green-700" : "",
          accent ? "text-orange-700" : "",
        ].join(" ")}
      >
        R$ {v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

function ItemDesc({ label, value, desc }: any) {
  const v = Number(value || 0);
  return (
    <div className="border rounded p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-600">{label}</p>
          <p className="text-base font-bold text-red-700">
            R$ {v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="text-right text-xs text-gray-500 max-w-[60%]">
          {desc ? desc : "—"}
        </div>
      </div>
    </div>
  );
}
