"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Venda = {
  id: string;
  data: string;
  itens: any[];
  total: number;
  pagamento: string;
};

export default function VendasAdmin() {
  const hoje = new Date().toISOString().split("T")[0];

  const [dataFiltro, setDataFiltro] = useState(hoje);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [carregando, setCarregando] = useState(false);

  async function carregarVendas() {
    setCarregando(true);

    const inicio = dataFiltro + " 00:00:00";
    const fim = dataFiltro + " 23:59:59";

    const { data, error } = await supabase
      .from("gigante_vendas")
      .select("*")
      .gte("data", inicio)
      .lte("data", fim)
      .order("data", { ascending: false });

    if (!error && data) setVendas(data);

    setCarregando(false);
  }

  useEffect(() => {
    carregarVendas();
  }, [dataFiltro]);

  const totalDoDia = vendas.reduce((soma, v) => soma + Number(v.total), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📊 Vendas do Dia</h1>

      {/* FILTRO */}
      <div className="bg-white p-4 shadow rounded mb-6">
        <label className="font-semibold">Selecione a data:</label>
        <input
          type="date"
          className="border p-2 ml-3 rounded"
          value={dataFiltro}
          onChange={(e) => setDataFiltro(e.target.value)}
        />
      </div>

      {/* TOTAL */}
      <div className="bg-yellow-200 p-4 rounded shadow mb-6">
        <h2 className="text-xl font-bold">
          Faturamento do dia:{" "}
          <span className="text-green-700">
            R$ {totalDoDia.toFixed(2).replace(".", ",")}
          </span>
        </h2>
      </div>

      {/* LISTA DE VENDAS */}
      {carregando ? (
        <p>Carregando vendas...</p>
      ) : vendas.length === 0 ? (
        <p>Nenhuma venda registrada nesta data.</p>
      ) : (
        vendas.map((v) => (
          <div key={v.id} className="bg-white p-4 rounded shadow mb-4">
            <p className="font-semibold">
              🕒 {new Date(v.data).toLocaleTimeString("pt-BR")}
            </p>

            <p className="mt-2">
              💳 <strong>Pagamento:</strong> {v.pagamento}
            </p>

            <p className="mt-2">
              💰 <strong>Total:</strong>{" "}
              R$ {Number(v.total).toFixed(2).replace(".", ",")}
            </p>

            <details className="mt-3">
              <summary className="cursor-pointer text-blue-600 font-semibold">
                Ver itens
              </summary>

              <ul className="mt-2 list-disc ml-6">
                {v.itens.map((item: any, i: number) => (
                  <li key={i}>
                    {item.nome} — {item.qtd}x —{" "}
                    R$ {item.total.toFixed(2).replace(".", ",")}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ))
      )}
    </div>
  );
}
