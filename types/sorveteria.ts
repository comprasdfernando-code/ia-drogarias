// types/sorveteria.ts
export type SorveteProduto = {
  id: string;
  nome: string;
  linha: string;          // ex.: "Linha Sensa", "Linha Zero", "Tradicionais"
  categoria: string;      // ex.: "Picolé", "Pote 2L", "Açaí", "Sundae"
  sabor?: string | null;
  preco: number;          // em BRL
  peso_gramas?: number | null;
  volume_ml?: number | null;
  imagem_url?: string | null;
  ativo: boolean;
  ordem?: number | null;  // para controlar ordenação na vitrine
  created_at?: string;
};