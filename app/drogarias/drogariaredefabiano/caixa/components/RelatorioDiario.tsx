"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LOJA = "drogariaredefabiano";

function fmt(n: number) {
  return Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function RelatorioDiario() {
  const [dataRef, setDataRef] = useState(hojeISO());
  const [registro, setRegistro] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function carregar() {
    setLoading(true);

    const ini = `${dataRef}T00:00:00`;
    const fim = `${dataRef}T23:59:59`;

    const { data } = await supabase
      .from("caixa_diario")
      .select("*")
      .eq("loja", LOJA)
      .gte("data", ini)
      .lte("data", fim)
      .order("data", { ascending: false })
      .limit(1);

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

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
  }, [registro]);

  return (
    <section className="bg-white rounded-lg shadow p-6 mt-8 print-area">
      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print mb-4">
        <h2 className="text-xl font-bold text-blue-700">
          📄 Relatório Diário do Caixa
        </h2>

        <div className="flex gap-3 mt-3">
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
                : "bg-gray-300 text-gray-500"
            }`}
          >
            🖨️ Gerar PDF
          </button>
        </div>
      </div>

      {!registro && !loading && (
        <p className="text-gray-600">Nenhum fechamento encontrado.</p>
      )}

      {registro && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <Card titulo="Venda Total" valor={registro.venda_total} />
            <Card titulo="Entradas" valor={calc?.entradas} green />
            <Card titulo="Saídas" valor={calc?.saidas} red />
            <Card titulo="Saldo do Dia" valor={calc?.saldo} bold />
          </div>

          <div className="mt-6 text-sm text-right">
            Gerado em {new Date().toLocaleString("pt-BR")}
          </div>
        </>
      )}
    </section>
  );
}

function Card({
  titulo,
  valor,
  green,
  red,
  bold,
}: any) {
  return (
    <div className="border rounded p-3">
      <p className="text-xs text-gray-600">{titulo}</p>
      <p
        className={`text-lg ${
          bold ? "font-bold" : "font-semibold"
        } ${green ? "text-green-700" : ""} ${
          red ? "text-red-700" : ""
        }`}
      >
        R$ {fmt(valor)}
      </p>
    </div>
  );
}
