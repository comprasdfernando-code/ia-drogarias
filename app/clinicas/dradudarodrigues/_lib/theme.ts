// app/clinicas/dradudarodrigues/_lib/theme.ts
export const DUDA_THEME = {
  // fundo e texto base
  text: "text-slate-100",
  bg: "from-[#120812] via-[#07020a] to-[#050208]",

  // superfícies com contraste alto
  surface: "bg-[#0b0612]/70 border border-[#f2caa2]/15",
  surfaceStrong: "bg-[#0b0612]/85 border border-[#f2caa2]/20",

  // tipografia (maior / legível)
  h1: "text-2xl md:text-3xl font-semibold tracking-tight",
  h2: "text-xl md:text-2xl font-semibold tracking-tight",
  label: "text-sm md:text-base text-slate-200",
  muted: "text-sm md:text-base text-slate-300",
  small: "text-xs md:text-sm text-slate-300",

  // botões
  btnPrimary:
    "rounded-xl bg-gradient-to-r from-[#f2caa2] to-[#d8a06a] px-4 py-2.5 text-sm md:text-base font-semibold text-[#1a0f12] hover:opacity-95 shadow-[0_0_0_1px_rgba(242,202,162,0.25)]",
  btnGhost:
    "rounded-xl border border-[#f2caa2]/25 bg-[#0b0612]/60 px-4 py-2.5 text-sm md:text-base text-slate-100 hover:bg-[#140a18]/60",

  // inputs
  input:
    "w-full rounded-xl border border-[#f2caa2]/20 bg-[#050208]/60 px-3 py-2.5 text-sm md:text-base text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#f2caa2]/30 focus:border-[#f2caa2]/35",

  // badge
  badge:
    "inline-flex items-center rounded-full border border-[#f2caa2]/25 bg-[#0b0612]/70 px-2.5 py-1 text-xs md:text-sm text-[#f2caa2]",

  // tabela
  tableWrap: "overflow-hidden rounded-2xl border border-[#f2caa2]/15",
  tableHead:
    "bg-[#07030b]/70 text-slate-200 text-xs md:text-sm font-semibold",
  tableRow:
    "bg-[#0b0612]/55 hover:bg-[#140a18]/45",
  tableCell: "px-4 py-3 text-sm md:text-base text-slate-100",
  tableCellMuted: "px-4 py-3 text-sm md:text-base text-slate-200",

  // “pílula” status
  pill:
    "inline-flex items-center rounded-full border border-[#f2caa2]/20 bg-[#050208]/50 px-2.5 py-1 text-xs md:text-sm text-slate-100",
};