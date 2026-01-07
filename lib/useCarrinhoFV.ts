"use client";

import { useEffect, useState } from "react";
import type { ItemCarrinho, FVProdutoMini } from "@/components/fv/CarrinhoModal";

const KEY = "fv_carrinho_v1";

export function useCarrinhoFV() {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  // carregar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItens(JSON.parse(raw));
    } catch {}
  }, []);

  // salvar
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(itens));
    } catch {}
  }, [itens]);

  function add(prod: FVProdutoMini) {
    setItens((prev) => {
      const existe = prev.find((i) => i.ean === prod.ean);
      if (existe) {
        return prev.map((i) =>
          i.ean === prod.ean ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, { ...prod, quantidade: 1 }];
    });
  }

  return { itens, setItens, add };
}
