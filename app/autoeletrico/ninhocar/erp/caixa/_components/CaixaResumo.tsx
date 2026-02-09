"use client";

function brl(v: any) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CaixaResumo({ comanda }: any) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
      <div>
        <div className="text-sm text-slate-300">
          Comanda <b className="text-slate-100">#{comanda.numero}</b>
        </div>
        <div className="text-xs text-slate-400">Status: {comanda.status}</div>
      </div>

      <div className="text-right">
        <div className="text-xs text-slate-400">Total</div>
        <div className="text-xl font-bold text-slate-100">{brl(comanda.total)}</div>
      </div>
    </div>
  );
}
