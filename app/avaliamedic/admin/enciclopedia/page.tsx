export const dynamic = "force-static";

"use client";

import { useEffect, useState } from "react";

export default function EnciclopediaPainel() {
  const [conteudos, setConteudos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    const res = await fetch("/avaliamedic/api/enciclopedia/listar");
    const json = await res.json();
    setConteudos(json);
    setLoading(false);
  }

  async function deletar(id: string, arquivo_url: string) {
    if (!confirm("Tem certeza que deseja apagar este conteúdo?")) return;

    const res = await fetch("/avaliamedic/api/enciclopedia/deletar", {
      method: "POST",
      body: JSON.stringify({ id, arquivo_url }),
    });

    const json = await res.json();

    if (json.sucesso) {
      alert("Arquivo removido!");
      carregar();
    } else {
      alert("Erro ao remover: " + json.error);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-4xl mx-auto bg-white border shadow-xl rounded-2xl p-10">

        <h1 className="text-3xl font-bold text-emerald-700">
          Enciclopédia Clínica — Admin
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie bulas, protocolos, diluições e conteúdos internos.
        </p>

        {loading ? (
          <p className="text-gray-600 mt-10 text-center">Carregando…</p>
        ) : (
          <table className="w-full mt-10 border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">Título</th>
                <th className="p-3 border">Categoria</th>
                <th className="p-3 border">Ações</th>
              </tr>
            </thead>

            <tbody>
              {conteudos.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">{c.titulo}</td>
                  <td className="p-3 border">{c.categoria}</td>
                  <td className="p-3 border flex gap-4">

                    {/* Visualizar */}
                    <a
                      href={c.arquivo_url}
                      target="_blank"
                      className="text-emerald-700 hover:underline"
                    >
                      Visualizar
                    </a>

                    {/* Deletar */}
                    <button
                      onClick={() => deletar(c.id, c.arquivo_url)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Excluir
                    </button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
