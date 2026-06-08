export const bairros = [
  { nome: 'Jd. Rodolfo Pirani', slug: 'jd-rodolfo-pirani', cidade: 'São Mateus - SP' },
  { nome: 'São Mateus', slug: 'sao-mateus', cidade: 'São Paulo - SP' },
]

export const categorias = [
  { nome: 'Todos', icon: '▦', cor: 'bg-red-600' },
  { nome: 'Saúde', icon: '+', cor: 'bg-green-600' },
  { nome: 'Alimentação', icon: '🍴', cor: 'bg-orange-500' },
  { nome: 'Automóveis', icon: '🚗', cor: 'bg-blue-600' },
  { nome: 'Pet Shop', icon: '🐾', cor: 'bg-purple-600' },
  { nome: 'Mercado', icon: '🛒', cor: 'bg-yellow-500' },
  { nome: 'Beleza', icon: '✂', cor: 'bg-pink-500' },
  { nome: 'Serviços', icon: '🔧', cor: 'bg-sky-600' },
]

export const empresas = [
  {
    nome: 'Drogaria Rede Fabiano', slug: 'drogaria-rede-fabiano', categoria: 'Farmácia', bairro: 'Jd. Rodolfo Pirani',
    endereco: 'Av. Ragueb Chohfi, 1925 - Jd. Rodolfo Pirani', telefone: '(11) 99999-9999', whatsapp: '11999999999',
    nota: '4,9', avaliacoes: 128, status: 'Aberto agora até 22:00', plano: 'Destaque', logo: 'REDE\nFABIANO',
    tags: ['Entrega', 'Convênios', 'Descontos', 'Perfumes'], promo: 'Até 20% em medicamentos genéricos e similares'
  },
  {
    nome: 'Pizzaria do Chef', slug: 'pizzaria-do-chef', categoria: 'Pizzaria', bairro: 'Jd. Rodolfo Pirani',
    endereco: 'Rua Arlindo de Moraes, 123 - Jd. Rodolfo Pirani', telefone: '(11) 99888-8888', whatsapp: '11998888888',
    nota: '4,7', avaliacoes: 96, status: 'Aberto agora até 23:00', plano: 'Patrocinado', logo: 'PIZZARIA\nDO CHEF',
    tags: ['Delivery', 'Retirada', 'Promoções', 'Rodízio'], promo: 'Rodízio completo por apenas R$ 39,90'
  },
  {
    nome: 'Auto Mecânica Pirani', slug: 'auto-mecanica-pirani', categoria: 'Mecânica', bairro: 'Jd. Rodolfo Pirani',
    endereco: 'Rua Cásper Líbero, 456 - Jd. Rodolfo Pirani', telefone: '(11) 97777-7777', whatsapp: '11977777777',
    nota: '4,8', avaliacoes: 78, status: 'Aberto agora até 18:00', plano: 'Destaque', logo: 'AUTO\nPIRANI',
    tags: ['Mecânica Geral', 'Injeção Eletrônica', 'Freios', 'Troca de Óleo'], promo: 'Troca de óleo a partir de R$ 99,90'
  },
]
