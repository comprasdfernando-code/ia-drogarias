"use client";

export default function ResumoVenda({
  subtotal,
  desconto,
  acrescimo,
  total,
  setDesconto,
  setAcrescimo,
  onEnviar,
  sending,
}: {
  subtotal: number;
  desconto: number;
  acrescimo: number;
  total: number;
  setDesconto: (v: number) => void;
  setAcrescimo: (v: number) => void;
  onEnviar: () => void;
  sending: boolean;
}) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="text-sm text-slate-400">Subtotal</div>
        <div className="text-lg font-semibold">R$ {subtotal.toFixed(2)}</div>
      </div>

      <div className="flex gap-2 items-end">
        <div>
          <div className="text-xs text-slate-400">Desconto</div>
          <input
            type="number"
            className="w-28 border border-slate-700 bg-slate-950/60 rounded px-2 py-2 outline-none"
            value={desconto}
            onChange={(e) => setDesconto(Number(e.target.value) || 0)}
          />
        </div>

        <div>
          <div className="text-xs text-slate-400">Acréscimo</div>
          <input
            type="number"
            className="w-28 border border-slate-700 bg-slate-950/60 rounded px-2 py-2 outline-none"
            value={acrescimo}
            onChange={(e) => setAcrescimo(Number(e.target.value) || 0)}
          />
        </div>

        <div className="ml-2">
          <div className="text-xs text-slate-400">Total</div>
          <div className="text-xl font-bold">R$ {total.toFixed(2)}</div>
        </div>
      </div>

      <button
        onClick={onEnviar}
        disabled={sending}
        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded px-4 py-3 font-semibold"
      >
        {sending ? "Enviando…" : "Enviar pro Caixa"}
      </button>
    </div>
  );
}
