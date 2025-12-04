"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function CorretoresPainel() {
  const [meusImoveis] = useState([
    {
      id: 1,
      titulo: "Casa à venda em São Mateus",
      preco: "350.000",
      imagem: "/imoveisrapido/casa1.jpg",
      leads: 12,
      status: "Publicado",
    },
    {
      id: 2,
      titulo: "Apartamento no Jardim Marabá",
      preco: "280.000",
      imagem: "/imoveisrapido/casa1.jpg",
      leads: 7,
      status: "Publicado",
    },
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* TÍTULO */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Painel do Corretor
      </h1>

      {/* BOTÃO CRIAR ANÚNCIO */}
      <div className="mb-8">
        <Link
          href="#"
          className="bg-blue-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800"
        >
          + Criar novo anúncio
        </Link>
      </div>

      {/* TABELA DE IMÓVEIS */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse shadow-lg rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-blue-700 text-white text-left">
              <th className="p-4">Imóvel</th>
              <th className="p-4">Preço</th>
              <th className="p-4">Leads</th>
              <th className="p-4">Status</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>

          <tbody>
            {meusImoveis.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-100">
                <td className="p-4 flex items-center gap-3">
                  <Image
                    src={item.imagem}
                    alt="thumb"
                    width={70}
                    height={70}
                    className="rounded-lg"
                  />
                  {item.titulo}
                </td>

                <td className="p-4 font-bold text-blue-700">
                  R$ {item.preco}
                </td>

                <td className="p-4 font-bold text-green-700">
                  {item.leads}
                </td>

                <td className="p-4">
                  <span className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm">
                    {item.status}
                  </span>
                </td>

                <td className="p-4 flex gap-3">
                  <Link
                    href={`/imoveisrapido/imovel/${item.id}`}
                    className="text-blue-700 font-bold hover:underline"
                  >
                    Ver
                  </Link>

                  <Link
                    href="#"
                    className="text-orange-600 font-bold hover:underline"
                  >
                    Editar
                  </Link>

                  <Link
                    href="#"
                    className="text-red-600 font-bold hover:underline"
                  >
                    Excluir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
