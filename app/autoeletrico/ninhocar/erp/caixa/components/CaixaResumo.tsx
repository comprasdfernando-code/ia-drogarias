"use client";

export default function CaixaResumo({ comanda }: any) {
  return (
    <div className="bg-slate-900 text-white p-4 rounded flex justify-between">
      <div>
        <div>Comanda #{comanda.numero}</div>
        <div>Status: {comanda.status}</div>
      </div>

      <div className="text-xl font-bold">
        Total: R$ {comanda.total.toFixed(2)}
      </div>
    </div>
  );
}
