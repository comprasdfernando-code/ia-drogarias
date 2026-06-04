export type Categoria = {
  slug: string;
  nome: string;
  icone: string;
  cor: string;
};

export type Empresa = {
  slug: string;
  nome: string;
  categoria: string;
  bairroSlug: string;
  bairro: string;
  descricao: string;
  endereco: string;
  telefone: string;
  whatsapp: string;
  avaliacao: number;
  totalAvaliacoes: number;
  plano: 'gratuito' | 'destaque' | 'patrocinado' | 'premium';
  status: string;
  tags: string[];
  imagem: string;
};

export const categorias: Categoria[] = [
  { slug: 'todos', nome: 'Todos', icone: '🏪', cor: 'bg-red-500' },
  { slug: 'saude', nome: 'Saúde', icone: '✚', cor: 'bg-green-500' },
  { slug: 'alimentacao', nome: 'Alimentação', icone: '🍽️', cor: 'bg-orange-500' },
  { slug: 'automoveis', nome: 'Automóveis', icone: '🚗', cor: 'bg-blue-500' },
  { slug: 'pet-shop', nome: 'Pet Shop', icone: '🐾', cor: 'bg-purple-500' },
  { slug: 'mercado', nome: 'Mercado', icone: '🛒', cor: 'bg-yellow-500' },
  { slug: 'beleza', nome: 'Beleza', icone: '✂️', cor: 'bg-pink-500' },
  { slug: 'servicos', nome: 'Serviços', icone: '🔧', cor: 'bg-sky-600' },
];

export const bairros = [
  { slug: 'jd-rodolfo-pirani', nome: 'Jd. Rodolfo Pirani', cidade: 'São Paulo', estado: 'SP' },
  { slug: 'sao-mateus', nome: 'São Mateus', cidade: 'São Paulo', estado: 'SP' },
  { slug: 'sapopemba', nome: 'Sapopemba', cidade: 'São Paulo', estado: 'SP' },
];

export const empresas: Empresa[] = [
  {
    slug: 'drogaria-rede-fabiano',
    nome: 'Drogaria Rede Fabiano',
    categoria: 'saude',
    bairroSlug: 'jd-rodolfo-pirani',
    bairro: 'Jd. Rodolfo Pirani',
    descricao: 'Farmácia com atendimento pelo WhatsApp, entrega e promoções no bairro.',
    endereco: 'Av. Ragueb Chohfi, 1925 - Jd. Rodolfo Pirani',
    telefone: '(11) 99999-9999',
    whatsapp: '5511999999999',
    avaliacao: 4.9,
    totalAvaliacoes: 128,
    plano: 'destaque',
    status: 'Aberto agora até 22:00',
    tags: ['Entrega', 'Convênios', 'Descontos'],
    imagem: '/temaquinobairro/placeholder-farmacia.png',
  },
  {
    slug: 'pizzaria-do-chef',
    nome: 'Pizzaria do Chef',
    categoria: 'alimentacao',
    bairroSlug: 'jd-rodolfo-pirani',
    bairro: 'Jd. Rodolfo Pirani',
    descricao: 'Pizzas, esfihas e promoções para retirada ou delivery.',
    endereco: 'Rua Arlindo de Moraes, 123 - Jd. Rodolfo Pirani',
    telefone: '(11) 99888-8888',
    whatsapp: '5511998888888',
    avaliacao: 4.7,
    totalAvaliacoes: 96,
    plano: 'patrocinado',
    status: 'Aberto agora até 23:00',
    tags: ['Delivery', 'Retirada', 'Promoções'],
    imagem: '/temaquinobairro/placeholder-pizzaria.png',
  },
  {
    slug: 'auto-mecanica-pirani',
    nome: 'Auto Mecânica Pirani',
    categoria: 'automoveis',
    bairroSlug: 'jd-rodolfo-pirani',
    bairro: 'Jd. Rodolfo Pirani',
    descricao: 'Mecânica geral, injeção eletrônica, freios e troca de óleo.',
    endereco: 'Rua Cásper Líbero, 456 - Jd. Rodolfo Pirani',
    telefone: '(11) 97777-7777',
    whatsapp: '5511977777777',
    avaliacao: 4.8,
    totalAvaliacoes: 78,
    plano: 'destaque',
    status: 'Aberto agora até 18:00',
    tags: ['Mecânica Geral', 'Injeção Eletrônica', 'Freios'],
    imagem: '/temaquinobairro/placeholder-auto.png',
  },
  {
    slug: 'pet-shop-mundo-animal',
    nome: 'Pet Shop Mundo Animal',
    categoria: 'pet-shop',
    bairroSlug: 'jd-rodolfo-pirani',
    bairro: 'Jd. Rodolfo Pirani',
    descricao: 'Banho e tosa, rações, acessórios e cuidados para seu pet.',
    endereco: 'Av. Ragueb Chohfi, 2100 - Jd. Rodolfo Pirani',
    telefone: '(11) 96666-6666',
    whatsapp: '5511966666666',
    avaliacao: 4.9,
    totalAvaliacoes: 112,
    plano: 'premium',
    status: 'Aberto agora até 20:00',
    tags: ['Banho e Tosa', 'Rações', 'Acessórios'],
    imagem: '/temaquinobairro/placeholder-pet.png',
  },
];

export const promocoes = [
  { titulo: 'Desconto exclusivo', texto: 'Até 20% em medicamentos genéricos e similares', empresa: 'Drogaria Rede Fabiano' },
  { titulo: 'Pizza grande', texto: 'A partir de R$ 39,90', empresa: 'Pizzaria do Chef' },
  { titulo: 'Troca de óleo', texto: 'A partir de R$ 99,90', empresa: 'Auto Mecânica Pirani' },
  { titulo: 'Banho e tosa', texto: '10% OFF para moradores do bairro', empresa: 'Pet Shop Mundo Animal' },
];
