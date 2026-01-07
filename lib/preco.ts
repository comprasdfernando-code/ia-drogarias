export function calcOff(pmc?: number | null, promo?: number | null) {
  const a = Number(pmc || 0);
  const b = Number(promo || 0);
  if (!a || !b || b >= a) return 0;
  return Math.round(((a - b) / a) * 100);
}

export function precoFinal(p: { pmc?: number | null; em_promocao?: boolean | null; preco_promocional?: number | null }) {
  const pmc = Number(p.pmc || 0);
  const promo = Number(p.preco_promocional || 0);
  const emPromo = !!p.em_promocao && promo > 0 && promo < pmc;
  return { emPromo, pmc, promo, final: emPromo ? promo : pmc, off: emPromo ? calcOff(pmc, promo) : 0 };
}

export function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
