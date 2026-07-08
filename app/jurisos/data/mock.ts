// app/jurisos/data/mock.ts

export const clientes = [
  {
    id: 1,
    nome: "Carlos Almeida",
    telefone: "(11) 99999-0001",
    email: "carlos@email.com",
    status: "Ativo",
  },
  {
    id: 2,
    nome: "Maria Souza",
    telefone: "(11) 99999-0002",
    email: "maria@email.com",
    status: "Aguardando documentos",
  },
];

export const processos = [
  {
    id: 1,
    numero: "1002458-33.2024.8.26.0001",
    cliente: "Carlos Almeida",
    area: "Cível",
    status: "Em andamento",
    prazo: "Hoje às 18h",
  },
  {
    id: 2,
    numero: "0007894-22.2023.8.26.0002",
    cliente: "Maria Souza",
    area: "Trabalhista",
    status: "Audiência marcada",
    prazo: "Amanhã às 14h",
  },
];

export const financeiro = [
  {
    id: 1,
    cliente: "Carlos Almeida",
    descricao: "Honorários iniciais",
    valor: 3500,
    status: "Pago",
  },
  {
    id: 2,
    cliente: "Maria Souza",
    descricao: "Parcela 2/5",
    valor: 1200,
    status: "Pendente",
  },
];

export const agenda = [
  {
    id: 1,
    titulo: "Audiência trabalhista",
    data: "Amanhã",
    hora: "14:00",
    cliente: "Maria Souza",
  },
  {
    id: 2,
    titulo: "Reunião com cliente",
    data: "Hoje",
    hora: "16:30",
    cliente: "Carlos Almeida",
  },
];