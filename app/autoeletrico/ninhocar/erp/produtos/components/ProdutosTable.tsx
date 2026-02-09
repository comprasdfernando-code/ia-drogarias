"use client";

function brl(v: any) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProdutosTable({ lista, onEdit, onAjuste }: any) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="font-semibold text-slate-100">Lista</div>
        <div className="text-xs text-slate-400">{lista?.length || 0} item(ns)</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-950/40">
            <tr className="border-b border-slate-800 text-slate-300">
              <th className="p-3 text-left font-medium">Nome</th>
              <th className="p-3 text-left font-medium">Tipo</th>
              <th className="p-3 text-left font-medium">Preço</th>
              <th className="p-3 text-left font-medium">Estoque</th>
              <th className="p-3 text-right font-medium">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {(!lista || lista.length === 0) && (
              <tr>
                <td colSpan={5} className="p-4 text-slate-400">
                  Nenhum produto/serviço cadastrado.
                </td>
              </tr>
            )}

            {lista?.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-800/40">
                <td className="p-3">
                  <div className="font-medium text-slate-100">{p.nome}</div>
                  <div className="text-xs text-slate-400">
                    {p.sku ? `SKU ${p.sku}` : ""}
                    {p.ean ? ` · EAN ${p.ean}` : ""}
                    {!p.ativo ? " · INATIVO" : ""}
                  </div>
                </td>

                <td className="p-3 text-slate-200">{String(p.tipo || "").toUpperCase()}</td>

                <td className="p-3 text-slate-200">{brl(p.preco)}</td>

                <td className="p-3">
                  {p.controla_estoque ? (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs border ${
                        Number(p.estoque_atual || 0) <= 0
                          ? "bg-red-950/30 text-red-200 border-red-900"
                          : "bg-emerald-950/30 text-emerald-200 border-emerald-900"
                      }`}
                    >
                      {Number(p.estoque_atual || 0)}
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>

                <td className="p-3 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      onClick={() => onEdit(p)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100"
                    >
                      Editar
                    </button>

                    {p.controla_estoque && (
                      <button
                        onClick={() => onAjuste(p)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100"
                      >
                        Ajustar estoque
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
