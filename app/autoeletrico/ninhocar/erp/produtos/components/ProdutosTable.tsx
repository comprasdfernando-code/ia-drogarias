"use client";

export default function ProdutosTable({ lista, onEdit, onAjuste }: any) {
  return (
    <div className="bg-white rounded shadow">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Nome</th>
            <th>Tipo</th>
            <th>Preço</th>
            <th>Estoque</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {lista.map((p: any) => (
            <tr key={p.id} className="border-b">
              <td className="p-2">{p.nome}</td>
              <td>{p.tipo}</td>
              <td>R$ {p.preco.toFixed(2)}</td>
              <td>{p.controla_estoque ? p.estoque_atual : "-"}</td>
              <td className="flex gap-2 p-2">
                <button
                  onClick={() => onEdit(p)}
                  className="text-blue-600"
                >
                  Editar
                </button>

                {p.controla_estoque && (
                  <button
                    onClick={() => onAjuste(p)}
                    className="text-green-600"
                  >
                    Ajustar estoque
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
