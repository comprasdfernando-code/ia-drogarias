"use client";

export default function GaugeRisk({ value }: { value: number }) {
  const rotation = (value / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-48 h-24 overflow-hidden">
        <div className="absolute inset-0 rounded-t-full border-[12px] border-slate-800"></div>

        <div
          className="absolute left-1/2 bottom-0 w-1 h-20 bg-emerald-400 origin-bottom rounded-full"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </div>

      <p className="mt-2 text-xl font-semibold text-emerald-400">{value}%</p>
      <p className="text-xs text-slate-400">Risco Consolidado</p>
    </div>
  );
}
