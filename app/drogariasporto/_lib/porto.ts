export const PORTO_LOJA_SLUG = "drogariasporto-loja2";
export const PORTO_CART_KEY = "PORTO_LOJA2_CART_V1";
export const PORTO_ENDERECO_KEY = "PORTO_LOJA2_ENDERECO_V1";
export const PORTO_VIEW_LOJA = "fv_farmacia_produtos_view";
export const PORTO_TAXA_ENTREGA = 10;

export type PortoProduto = {
  produto_id: string;
  farmacia_slug: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;
  imagens: string[] | null;
  pmc: number | null;
  estoque: number | null;
  preco_venda: number | null;
  disponivel_farmacia: boolean | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
};

export type PortoCartItem = PortoProduto & { qtd: number };

export function brl(v: number | null | undefined) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function precoPorto(p: PortoProduto | PortoCartItem) {
  const precoLoja = Number(p.preco_venda || 0);
  if (precoLoja > 0) return precoLoja;
  if (p.em_promocao && Number(p.preco_promocional || 0) > 0) {
    return Number(p.preco_promocional || 0);
  }
  return Number(p.pmc || 0);
}

export function lerCarrinho(): PortoCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PORTO_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function salvarCarrinho(cart: PortoCartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PORTO_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("porto-cart-updated"));
}
