"use client";

export type CartItem = {
  produto_id: string;
  tipo: "produto" | "servico";
  nome: string;
  ean?: string | null;
  preco: number;
  quantidade: number;
};

export default function ItensTable({
  itens,
  setItens,
}: {
  itens: CartItem[];
  setItens: (fn: (prev: CartItem[]) => CartItem[]) => void;
}) {
  function inc(idx: number) {
    setItens((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], quantidade: copy[idx].quantidade + 1 };
      return copy;
    });
  }

  function dec(idx: number) {
    setItens((prev) => {
      const copy = [...prev];
      const q = copy[idx].quantidade - 1;
      copy[idx] = { ...copy[idx], quantidade: q < 1 ? 1 : q };
      return copy;
    });
  }

  function setQtd(idx: number, qtd: number) {
    setItens((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], quantidade: qtd < 1 ? 1 : qtd };
      return copy;
    });
  }

  function remover(idx: number) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 font-semibold">Itens</div>

      {itens.length === 0 ? (
        <div className="p-4 text-sm text-slate-400">
          Nenhum item ainda. Busque um produto/serviço e adicione.
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {itens.map((it, idx) => {
            const sub = (Number(it.preco) || 0) * (Number(it.quantidade) || 0);
            return (
              <div key={`${it.produto_id}-${idx}`} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{it.nome}</div>
                  <div className="text-xs text-slate-400">
                    {it.tipo.toUpperCase()}
                    {it.ean ? ` · EAN ${it.ean}` : ""}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="bg-slate-800 rounded px-2 py-1" onClick={() => dec(idx)}>-</button>

                  <input
                    type="number"
                    className="w-16 border border-slate-700 bg-slate-950/60 rounded px-2 py-1 text-center outline-none"
                    value={it.quantidade}
                    min={1}
                    onChange={(e) => setQtd(idx, Number(e.target.value))}
                  />

                  <button className="bg-slate-800 rounded px-2 py-1" onClick={() => inc(idx)}>+</button>
                </div>

                <div className="text-right">
                  <div className="text-sm text-slate-300">
                    R$ {Number(it.preco || 0).toFixed(2)}
                  </div>
                  <div className="font-semibold">R$ {sub.toFixed(2)}</div>
                </div>

                <button className="text-red-400 hover:text-red-300" onClick={() => remover(idx)}>
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
