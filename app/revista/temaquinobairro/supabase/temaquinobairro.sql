-- Banco inicial: Tem Aqui No Bairro
-- Rodar no Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.tnb_bairros (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  cidade text not null default 'São Paulo',
  estado text not null default 'SP',
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tnb_categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  icone text,
  cor text,
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tnb_empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  categoria_id uuid references public.tnb_categorias(id),
  bairro_id uuid references public.tnb_bairros(id),
  descricao text,
  endereco text,
  numero text,
  complemento text,
  telefone text,
  whatsapp text,
  instagram text,
  site text,
  logo_url text,
  capa_url text,
  plano text not null default 'gratuito' check (plano in ('gratuito','destaque','patrocinado','premium')),
  ativo boolean not null default true,
  verificado boolean not null default false,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tnb_promocoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.tnb_empresas(id) on delete cascade,
  titulo text not null,
  descricao text,
  preco_de numeric(10,2),
  preco_por numeric(10,2),
  imagem_url text,
  validade date,
  ativo boolean not null default true,
  destaque boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tnb_eventos (
  id uuid primary key default gen_random_uuid(),
  bairro_id uuid references public.tnb_bairros(id),
  empresa_id uuid references public.tnb_empresas(id),
  titulo text not null,
  descricao text,
  data_inicio timestamptz,
  data_fim timestamptz,
  local text,
  imagem_url text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tnb_anuncios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.tnb_empresas(id) on delete cascade,
  bairro_id uuid references public.tnb_bairros(id),
  tipo text not null default 'banner' check (tipo in ('banner','card','capa','revista','bairro')),
  titulo text,
  imagem_url text,
  link_url text,
  inicio date,
  fim date,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.tnb_bairros (nome, slug, descricao) values
('Jd. Rodolfo Pirani', 'jd-rodolfo-pirani', 'Bairro piloto do portal Tem Aqui No Bairro.'),
('São Mateus', 'sao-mateus', 'Região inicial de expansão.'),
('Sapopemba', 'sapopemba', 'Região de expansão.')
on conflict (slug) do nothing;

insert into public.tnb_categorias (nome, slug, icone, cor, ordem) values
('Saúde', 'saude', '✚', 'green', 1),
('Alimentação', 'alimentacao', '🍽️', 'orange', 2),
('Automóveis', 'automoveis', '🚗', 'blue', 3),
('Pet Shop', 'pet-shop', '🐾', 'purple', 4),
('Mercado', 'mercado', '🛒', 'yellow', 5),
('Beleza', 'beleza', '✂️', 'pink', 6),
('Serviços', 'servicos', '🔧', 'sky', 7)
on conflict (slug) do nothing;

-- Exemplo de empresa
insert into public.tnb_empresas (nome, slug, categoria_id, bairro_id, descricao, endereco, whatsapp, plano, verificado)
select 'Drogaria Rede Fabiano', 'drogaria-rede-fabiano', c.id, b.id,
'Farmácia com atendimento pelo WhatsApp, entrega e promoções no bairro.',
'Av. Ragueb Chohfi, 1925 - Jd. Rodolfo Pirani', '5511999999999', 'destaque', true
from public.tnb_categorias c, public.tnb_bairros b
where c.slug = 'saude' and b.slug = 'jd-rodolfo-pirani'
on conflict (slug) do nothing;

create or replace view public.v_tnb_empresas as
select
  e.*,
  c.nome as categoria_nome,
  c.slug as categoria_slug,
  b.nome as bairro_nome,
  b.slug as bairro_slug
from public.tnb_empresas e
left join public.tnb_categorias c on c.id = e.categoria_id
left join public.tnb_bairros b on b.id = e.bairro_id;
