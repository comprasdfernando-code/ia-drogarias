// app/clinicas/dradudarodrigues/_lib/types.ts
export type Paciente = {
  id: string;
  clinica_slug: string;

  nome: string;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  data_nascimento: string | null; // ISO (YYYY-MM-DD)

  origem: string | null;
  tags: string[] | null;
  observacoes: string | null;

  created_at: string;
  updated_at: string;
};