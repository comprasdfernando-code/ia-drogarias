"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Entrada = {
  id: number;
  fornecedor: string;
  data: string;
  numero_nota: string | null;
  codigo?: string; // adicionando o campo código (caso exista)
};

export default function EntradasDF() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);

  async function carregar() {
    const { data } = await supabase
      .from("df_entradas")
      .select("*")
      .order("id", { ascending: false });

    if (data) setEntradas(data);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Entradas — DF Distribuidora</h1>

      <table className="w-full border rounded">
        <thead className="bg-blue-600 text-white">
          <tr>
            <th className="p-2">ID</th>
            <th>Código</th>
            <th>Fornecedor</th>
            <th>Data</th>
            <th>Nota</th>
          </tr>
        </thead>

        <tbody>
          {entradas.map((e) => (
            <tr key={e.id} className="border-b">
              <td className="p-2">{e.id}</td>
              <td>{e.codigo ?? "-"}</td>
              <td>{e.fornecedor}</td>
              <td>{e.data}</td>
              <td>{e.numero_nota ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Botão flutuante */}
      <Link
        href="/dfdistribuidora/entradas/nova"
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-5 py-3 rounded-full shadow-xl text-lg"
      >
        + Nova Entrada
      </Link>
    </div>
  );
}
