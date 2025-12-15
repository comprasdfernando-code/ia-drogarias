import Image from "next/image";

export default function ProdutoCard({ produto, onAdd }: any) {
  return (
    <div className="bg-white rounded-xl shadow p-3 flex flex-col">
      <Image
        src={produto.foto}
        alt={produto.nome}
        width={400}
        height={300}
        className="rounded-lg"
      />

      <h2 className="font-bold mt-2">{produto.nome}</h2>
      <p className="text-sm text-gray-600">{produto.descricao}</p>

      <div className="mt-auto flex items-center justify-between">
        <span className="font-bold text-red-600">
          R$ {produto.preco.toFixed(2)}
        </span>
        <button
          onClick={() => onAdd(produto)}
          className="bg-red-600 text-white px-3 py-1 rounded"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
