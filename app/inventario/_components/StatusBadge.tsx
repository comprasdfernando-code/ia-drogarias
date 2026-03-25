"use client";

export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    aberto: "border-blue-200 bg-blue-100 text-blue-700",
    em_contagem: "border-amber-200 bg-amber-100 text-amber-700",
    finalizado: "border-emerald-200 bg-emerald-100 text-emerald-700",
    cancelado: "border-slate-200 bg-slate-100 text-slate-700",

    pendente: "border-slate-200 bg-slate-100 text-slate-700",
    contado: "border-emerald-200 bg-emerald-100 text-emerald-700",
    divergente: "border-rose-200 bg-rose-100 text-rose-700",
    nao_encontrado: "border-orange-200 bg-orange-100 text-orange-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        map[status] || "border-slate-200 bg-slate-100 text-slate-700"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}