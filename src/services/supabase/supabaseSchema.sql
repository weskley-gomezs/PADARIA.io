-- ============================================================================
-- PADARIA.IO - SUPABASE POSTGRESQL MULTI-TENANT SaaS SCHEMA
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ENUMS
create type nivel_usuario_enum as enum ('MASTER', 'ADMIN', 'OPERADOR');
create type billing_status_enum as enum ('ativo', 'pendente', 'concluido', 'vencendo', 'vencido', 'suspenso', 'cancelado');
create type product_status_enum as enum ('normal', 'vencendo', 'vencido');
create type ticket_priority_enum as enum ('normal', 'urgente', 'critica');
create type ticket_status_enum as enum ('aberto', 'em_andamento', 'resolvido');
create type movimentacao_tipo_enum as enum ('entrada', 'saida', 'ajuste', 'venda', 'descarte');

-- 2. TABELA: empresas
create or replace function gerar_codigo_ativacao()
returns trigger as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := 'PAD-';
  i int;
begin
  if new.codigo_ativacao is null or new.codigo_ativacao = '' then
    loop
      result := 'PAD-';
      for i in 1..8 loop
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      end loop;
      exit when not exists (select 1 from empresas where codigo_ativacao = result);
    end loop;
    new.codigo_ativacao := result;
  end if;
  return new;
end;
$$ language plpgsql;

create table if not exists empresas (
  id uuid primary key default uuid_generate_v4(),
  codigo_ativacao varchar(32) unique not null,
  nome varchar(150) not null,
  cnpj varchar(20) unique,
  telefone varchar(30),
  email varchar(150) not null,
  endereco text,
  cidade varchar(100),
  estado varchar(2),
  logo_url text,
  plano varchar(50) default 'Padronizado',
  status boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists trg_gerar_codigo_ativacao on empresas;
create trigger trg_gerar_codigo_ativacao
  before insert on empresas
  for each row
  execute function gerar_codigo_ativacao();

-- 3. TABELA: usuarios
create table if not exists usuarios (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  nome varchar(150) not null,
  login varchar(100) unique not null,
  senha_hash text not null,
  nivel nivel_usuario_enum not null default 'OPERADOR',
  status boolean default true,
  ultimo_login timestamptz,
  created_at timestamptz default now()
);

-- 4. TABELA: operadores (caso separado ou vinculado)
create table if not exists operadores (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  nome varchar(150) not null,
  login varchar(100) unique not null,
  senha_hash text not null,
  status boolean default true,
  created_at timestamptz default now()
);

-- 5. TABELA: categorias
create table if not exists categorias (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  nome varchar(100) not null,
  cor varchar(50) default '#FF6B00',
  icone varchar(50) default 'tag',
  created_at timestamptz default now()
);

-- 6. TABELA: produtos
create table if not exists produtos (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  categoria_id uuid references categorias(id) on delete set null,
  bakery_code varchar(32) not null,
  codigo_barras varchar(100),
  nome varchar(200) not null,
  descricao text,
  marca varchar(100),
  unidade varchar(20) default 'un',
  preco_custo numeric(10,2) default 0.00,
  preco_venda numeric(10,2) default 0.00,
  valor_kg numeric(10,2),
  quantidade integer default 1,
  data_fabricacao date,
  data_validade date not null,
  dias_para_vencer integer default 0,
  status product_status_enum default 'normal',
  motivo varchar(100) default 'Vencimento',
  notas text,
  fotos text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. TABELA: lotes
create table if not exists lotes (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  produto_id uuid references produtos(id) on delete cascade,
  data_fabricacao date,
  data_validade date not null,
  quantidade integer default 1,
  preco_promocional numeric(10,2),
  status product_status_enum default 'normal',
  created_at timestamptz default now()
);

-- 8. TABELA: leituras_ia
create table if not exists leituras_ia (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  produto_id uuid references produtos(id) on delete set null,
  imagem text,
  texto_extraido text,
  modelo_ia varchar(100) default 'gemini-3.1-flash-lite',
  tokens_utilizados integer default 0,
  tempo_processamento numeric(6,2) default 0.00,
  created_at timestamptz default now()
);

-- 9. TABELA: descartes
create table if not exists descartes (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  produto_id uuid references produtos(id) on delete set null,
  lote_id uuid references lotes(id) on delete set null,
  quantidade integer not null,
  motivo text not null,
  valor_perdido numeric(10,2) default 0.00,
  usuario_id uuid references usuarios(id) on delete set null,
  created_at timestamptz default now()
);

-- 10. TABELA: movimentacoes
create table if not exists movimentacoes (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  produto_id uuid references produtos(id) on delete cascade,
  tipo movimentacao_tipo_enum not null,
  entrada integer default 0,
  saida integer default 0,
  ajuste integer default 0,
  quantidade integer not null,
  usuario_id uuid references usuarios(id) on delete set null,
  created_at timestamptz default now()
);

-- 11. TABELA: clientes
create table if not exists clientes (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  nome varchar(150) not null,
  telefone varchar(30),
  email varchar(150),
  cpf varchar(20),
  fidelidade boolean default true,
  pontos integer default 0,
  created_at timestamptz default now()
);

-- 12. TABELA: vendas
create table if not exists vendas (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete set null,
  operador_id uuid references usuarios(id) on delete set null,
  valor_total numeric(10,2) not null default 0.00,
  forma_pagamento varchar(50) default 'dinheiro',
  status varchar(30) default 'concluida',
  created_at timestamptz default now()
);

-- 13. TABELA: venda_itens
create table if not exists venda_itens (
  id uuid primary key default uuid_generate_v4(),
  venda_id uuid references vendas(id) on delete cascade,
  produto_id uuid references produtos(id) on delete set null,
  quantidade integer not null default 1,
  valor_unitario numeric(10,2) not null default 0.00,
  subtotal numeric(10,2) not null default 0.00
);

-- 14. TABELA: configuracoes
create table if not exists configuracoes (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade unique,
  nome_empresa varchar(150),
  logo text,
  tema varchar(50) default 'light',
  whatsapp varchar(30),
  email varchar(150),
  politica_desconto text,
  tempo_alerta_validade integer default 3,
  created_at timestamptz default now()
);

-- 15. TABELA: planos
create table if not exists planos (
  id uuid primary key default uuid_generate_v4(),
  nome varchar(100) not null,
  descricao text,
  valor numeric(10,2) not null default 0.00,
  status boolean default true,
  created_at timestamptz default now()
);

-- 16. TABELA: licencas
create table if not exists licencas (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  plano_id uuid references planos(id) on delete set null,
  status billing_status_enum default 'ativo',
  data_inicio date not null,
  data_vencimento date not null,
  ultima_cobranca timestamptz,
  created_at timestamptz default now()
);

-- 17. TABELA: assinaturas (controle de cobrança e histórico)
create table if not exists assinaturas (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  tipo varchar(50) default 'mensalidade',
  valor numeric(10,2) not null,
  status billing_status_enum default 'pendente',
  link_boleto text,
  data_vencimento date,
  data_pagamento timestamptz,
  created_at timestamptz default now()
);

-- 18. TABELA: notificacoes
create table if not exists notificacoes (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  titulo varchar(150) not null,
  mensagem text not null,
  lida boolean default false,
  tipo varchar(50) default 'alerta',
  created_at timestamptz default now()
);

-- 19. TABELA: auditoria
create table if not exists auditoria (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  usuario_id uuid references usuarios(id) on delete set null,
  tabela_afetada varchar(100) not null,
  acao varchar(50) not null,
  registro_id uuid,
  dados_anteriores jsonb,
  dados_novos jsonb,
  created_at timestamptz default now()
);

-- 20. TABELA: integracoes (ERPs, PDVs, APIs externas)
create table if not exists integracoes (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  nome_sistema varchar(100) not null,
  ativo boolean default true,
  creditos_api jsonb,
  created_at timestamptz default now()
);

-- 21. TABELA: logs (acessos e eventos)
create table if not exists logs (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  usuario_id uuid references usuarios(id) on delete set null,
  acao text not null,
  ip varchar(50),
  device text,
  created_at timestamptz default now()
);

-- 22. TABELA: suporte_tickets
create table if not exists suporte_tickets (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id) on delete cascade,
  bakery_code varchar(32) not null,
  empresa_nome varchar(150) not null,
  assunto varchar(200) not null,
  descricao text not null,
  prioridade ticket_priority_enum default 'normal',
  status ticket_status_enum default 'aberto',
  resposta_suporte text,
  screenshot_url text,
  data_criacao timestamptz default now(),
  data_resolucao timestamptz
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
create index if not exists idx_produtos_empresa on produtos(empresa_id);
create index if not exists idx_produtos_codigo_barras on produtos(codigo_barras);
create index if not exists idx_produtos_validade on produtos(data_validade);
create index if not exists idx_vendas_empresa on vendas(empresa_id);
create index if not exists idx_movimentacoes_empresa on movimentacoes(empresa_id);
create index if not exists idx_clientes_empresa on clientes(empresa_id);
create index if not exists idx_logs_empresa on logs(empresa_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ============================================================================
alter table empresas enable row level security;
alter table usuarios enable row level security;
alter table operadores enable row level security;
alter table categorias enable row level security;
alter table produtos enable row level security;
alter table lotes enable row level security;
alter table leituras_ia enable row level security;
alter table descartes enable row level security;
alter table movimentacoes enable row level security;
alter table clientes enable row level security;
alter table vendas enable row level security;
alter table venda_itens enable row level security;
alter table configuracoes enable row level security;
alter table planos enable row level security;
alter table licencas enable row level security;
alter table assinaturas enable row level security;
alter table notificacoes enable row level security;
alter table auditoria enable row level security;
alter table integracoes enable row level security;
alter table logs enable row level security;
alter table suporte_tickets enable row level security;

-- Policies example (Tenant isolation):
-- Master sees everything, Admin and Operator see only their empresa_id.
create policy "Isolamento multiempresa produtos" on produtos
  using (
    auth.role() = 'service_role' or 
    empresa_id in (select empresa_id from usuarios where id = auth.uid())
  );

-- ============================================================================
-- SUPABASE STORAGE BUCKETS
-- ============================================================================
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('produtos', 'produtos', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('etiquetas', 'etiquetas', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('documentos', 'documentos', true) on conflict do nothing;
