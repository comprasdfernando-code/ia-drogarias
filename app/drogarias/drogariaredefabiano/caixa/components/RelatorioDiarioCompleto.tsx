"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export default function RelatorioDiarioCompleto() {
  const [dataRef, setDataRef] = useState<string>(toISODate(new Date()));
  const [registro, setRegistro] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string>("");

  async function carregar() {
    setErro("");
    setLoading(true);

    const ini = `${dataRef}T00:00:00`;
    const fim = `${dataRef}T23:59:59`;

    const { data, error } = await supabase
      .from("caixa_diario")
      .select("*")
      .eq("loja", LOJA)
      .gte("data", ini)
      .lte("data", fim)
      .order("data", { ascending: false })
      .limit(1);

    if (error) {
      setErro("Erro ao buscar fechamento do dia.");
      setRegistro(null);
      setLoading(false);
      return;
    }

    setRegistro(data?.[0] || null);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const calc = useMemo(() => {
    if (!registro) return null;

    const entradas =
      (registro.dinheiro || 0) +
      (registro.pix_cnpj || 0) +
      (registro.pix_qr || 0) +
      (registro.cartoes || 0) +
      (registro.receb_fiado || 0);

    const saidas =
      (registro.sangrias || 0) +
      (registro.despesas || 0) +
      (registro.boletos || 0) +
      (registro.compras || 0);

    return { entradas, saidas, saldo: entradas - saidas };
  }, [registro]);

  return (
    <section className="bg-white rounded-lg shadow p-6 mt-8 print-area">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* CONTROLES */}
      <div className="no-print mb-4">
        <h2 className="text-xl font-bold text-blue-700 mb-3">
          📄 Relatório Diário do Caixa
        </h2>

        <div className="flex gap-3 items-end">
          <input
            type="date"
            value={dataRef}
            onChange={(e) => setDataRef(e.target.value)}
            className="border rounded p-2"
          />

          <button
            onClick={carregar}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Buscar Fechamento
          </button>

          <button
            onClick={() => window.print()}
            disabled={!registro}
            className={`px-4 py-2 rounded ${
              registro
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            🖨️ Gerar PDF
          </button>
        </div>

        {erro && <p className="text-red-600 mt-2">{erro}</p>}
        {loading && <p className="text-gray-500 mt-2">Carregando...</p>}
      </div>

      {!registro ? (
        <p className="text-gray-600">Nenhum fechamento encontrado.</p>
      ) : (
        <>
          {/* TODO O CONTEÚDO VISUAL PERMANECE IGUAL AO SEU */}
          {/* (Resumo, Entradas, Saídas, Rodapé) */}
        </>
      )}
    </section>
  );
}
