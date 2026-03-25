export type InventarioStatus =
  | "aberto"
  | "em_contagem"
  | "finalizado"
  | "cancelado";

export type InventarioTipo =
  | "controlados"
  | "antibioticos"
  | "misto";

export type InventarioItemStatus =
  | "pendente"
  | "contado"
  | "divergente"
  | "nao_encontrado";

export type Inventario = {
  id: string;
  created_at: string;
  loja_slug: string;
  tipo: InventarioTipo;
  local_nome: string | null;
  status: InventarioStatus;
  responsavel_nome: string | null;
  iniciado_em: string | null;
  finalizado_em: string | null;
  observacoes: string | null;
};

export type InventarioItem = {
  id: string;
  created_at: string;
  inventario_id: string;
  produto_id: string | null;
  codigo_barras: string | null;
  produto_nome: string;
  apresentacao: string | null;
  categoria: "controlado" | "antibiotico" | "outro";
  lote: string | null;
  validade: string | null;
  quantidade_sistema: number;
  quantidade_contada: number | null;
  diferenca: number;
  status: InventarioItemStatus;
  observacao: string | null;
  contado_por: string | null;
  contado_em: string | null;
};