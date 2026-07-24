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

-- Views / Aliases para compatibilidade de consultas legadas ou alternativas
create or replace view movimentacoes_estoque as select * from movimentacoes;
create or replace view itens_venda as select * from venda_itens;
create or replace view fidelidade as select * from clientes where fidelidade = true;

-- Helper Function para isolamento Multi-Tenant seguro e de alta performance
create or replace function public.get_user_empresa_id()
returns uuid as $$
  select empresa_id from public.usuarios where id = auth.uid() limit 1;
$$ language sql security definer stable;

-- Remoção de políticas legadas/incompletas
drop policy if exists "Isolamento multiempresa produtos" on produtos;

-- ----------------------------------------------------------------------------
-- 1. TABELA: empresas
-- ----------------------------------------------------------------------------
drop policy if exists "empresas_select_policy" on empresas;
drop policy if exists "empresas_insert_policy" on empresas;
drop policy if exists "empresas_update_policy" on empresas;
drop policy if exists "empresas_delete_policy" on empresas;

create policy "empresas_select_policy" on empresas
  for select using (
    auth.role() = 'service_role' or
    auth.role() = 'anon' or
    id = public.get_user_empresa_id()
  );

create policy "empresas_insert_policy" on empresas
  for insert with check (
    auth.role() = 'service_role' or
    auth.role() = 'anon' or
    id = public.get_user_empresa_id()
  );

create policy "empresas_update_policy" on empresas
  for update using (
    auth.role() = 'service_role' or
    auth.role() = 'anon' or
    id = public.get_user_empresa_id()
  ) with check (
    auth.role() = 'service_role' or
    auth.role() = 'anon' or
    id = public.get_user_empresa_id()
  );

create policy "empresas_delete_policy" on empresas
  for delete using (
    auth.role() = 'service_role' or
    auth.role() = 'anon' or
    id = public.get_user_empresa_id()
  );

-- ----------------------------------------------------------------------------
-- 2. TABELAS COM ISOLAMENTO DIRETO POR empresa_id
-- ----------------------------------------------------------------------------

-- PRODUTOS
drop policy if exists "produtos_select_policy" on produtos;
drop policy if exists "produtos_insert_policy" on produtos;
drop policy if exists "produtos_update_policy" on produtos;
drop policy if exists "produtos_delete_policy" on produtos;

create policy "produtos_select_policy" on produtos for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id() or empresa_id is null);
create policy "produtos_insert_policy" on produtos for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id() or empresa_id is null);
create policy "produtos_update_policy" on produtos for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id() or empresa_id is null) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id() or empresa_id is null);
create policy "produtos_delete_policy" on produtos for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id() or empresa_id is null);

-- SUPORTE_TICKETS
drop policy if exists "suporte_tickets_select_policy" on suporte_tickets;
drop policy if exists "suporte_tickets_insert_policy" on suporte_tickets;
drop policy if exists "suporte_tickets_update_policy" on suporte_tickets;
drop policy if exists "suporte_tickets_delete_policy" on suporte_tickets;

create policy "suporte_tickets_select_policy" on suporte_tickets for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id() or empresa_id is null);
create policy "suporte_tickets_insert_policy" on suporte_tickets for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id() or empresa_id is null);
create policy "suporte_tickets_update_policy" on suporte_tickets for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id() or empresa_id is null) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id() or empresa_id is null);
create policy "suporte_tickets_delete_policy" on suporte_tickets for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id() or empresa_id is null);

-- USUARIOS
drop policy if exists "usuarios_select_policy" on usuarios;
drop policy if exists "usuarios_insert_policy" on usuarios;
drop policy if exists "usuarios_update_policy" on usuarios;
drop policy if exists "usuarios_delete_policy" on usuarios;

create policy "usuarios_select_policy" on usuarios for select using (auth.role() = 'service_role' or auth.role() = 'anon' or id = auth.uid() or empresa_id = public.get_user_empresa_id());
create policy "usuarios_insert_policy" on usuarios for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "usuarios_update_policy" on usuarios for update using (auth.role() = 'service_role' or auth.role() = 'anon' or id = auth.uid() or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or id = auth.uid() or empresa_id = public.get_user_empresa_id());
create policy "usuarios_delete_policy" on usuarios for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- OPERADORES
drop policy if exists "operadores_select_policy" on operadores;
drop policy if exists "operadores_insert_policy" on operadores;
drop policy if exists "operadores_update_policy" on operadores;
drop policy if exists "operadores_delete_policy" on operadores;

create policy "operadores_select_policy" on operadores for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "operadores_insert_policy" on operadores for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "operadores_update_policy" on operadores for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "operadores_delete_policy" on operadores for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- CATEGORIAS
drop policy if exists "categorias_select_policy" on categorias;
drop policy if exists "categorias_insert_policy" on categorias;
drop policy if exists "categorias_update_policy" on categorias;
drop policy if exists "categorias_delete_policy" on categorias;

create policy "categorias_select_policy" on categorias for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "categorias_insert_policy" on categorias for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "categorias_update_policy" on categorias for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "categorias_delete_policy" on categorias for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- LOTES
drop policy if exists "lotes_select_policy" on lotes;
drop policy if exists "lotes_insert_policy" on lotes;
drop policy if exists "lotes_update_policy" on lotes;
drop policy if exists "lotes_delete_policy" on lotes;

create policy "lotes_select_policy" on lotes for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "lotes_insert_policy" on lotes for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "lotes_update_policy" on lotes for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "lotes_delete_policy" on lotes for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- LEITURAS_IA
drop policy if exists "leituras_ia_select_policy" on leituras_ia;
drop policy if exists "leituras_ia_insert_policy" on leituras_ia;
drop policy if exists "leituras_ia_update_policy" on leituras_ia;
drop policy if exists "leituras_ia_delete_policy" on leituras_ia;

create policy "leituras_ia_select_policy" on leituras_ia for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "leituras_ia_insert_policy" on leituras_ia for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "leituras_ia_update_policy" on leituras_ia for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "leituras_ia_delete_policy" on leituras_ia for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- DESCARTES
drop policy if exists "descartes_select_policy" on descartes;
drop policy if exists "descartes_insert_policy" on descartes;
drop policy if exists "descartes_update_policy" on descartes;
drop policy if exists "descartes_delete_policy" on descartes;

create policy "descartes_select_policy" on descartes for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "descartes_insert_policy" on descartes for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "descartes_update_policy" on descartes for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "descartes_delete_policy" on descartes for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- MOVIMENTACOES
drop policy if exists "movimentacoes_select_policy" on movimentacoes;
drop policy if exists "movimentacoes_insert_policy" on movimentacoes;
drop policy if exists "movimentacoes_update_policy" on movimentacoes;
drop policy if exists "movimentacoes_delete_policy" on movimentacoes;

create policy "movimentacoes_select_policy" on movimentacoes for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "movimentacoes_insert_policy" on movimentacoes for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "movimentacoes_update_policy" on movimentacoes for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "movimentacoes_delete_policy" on movimentacoes for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- CLIENTES
drop policy if exists "clientes_select_policy" on clientes;
drop policy if exists "clientes_insert_policy" on clientes;
drop policy if exists "clientes_update_policy" on clientes;
drop policy if exists "clientes_delete_policy" on clientes;

create policy "clientes_select_policy" on clientes for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "clientes_insert_policy" on clientes for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "clientes_update_policy" on clientes for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "clientes_delete_policy" on clientes for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- VENDAS
drop policy if exists "vendas_select_policy" on vendas;
drop policy if exists "vendas_insert_policy" on vendas;
drop policy if exists "vendas_update_policy" on vendas;
drop policy if exists "vendas_delete_policy" on vendas;

create policy "vendas_select_policy" on vendas for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "vendas_insert_policy" on vendas for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "vendas_update_policy" on vendas for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "vendas_delete_policy" on vendas for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- VENDA_ITENS
drop policy if exists "venda_itens_select_policy" on venda_itens;
drop policy if exists "venda_itens_insert_policy" on venda_itens;
drop policy if exists "venda_itens_update_policy" on venda_itens;
drop policy if exists "venda_itens_delete_policy" on venda_itens;

create policy "venda_itens_select_policy" on venda_itens for select using (auth.role() = 'service_role' or auth.role() = 'anon' or venda_id in (select id from vendas where empresa_id = public.get_user_empresa_id()));
create policy "venda_itens_insert_policy" on venda_itens for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or venda_id in (select id from vendas where empresa_id = public.get_user_empresa_id()));
create policy "venda_itens_update_policy" on venda_itens for update using (auth.role() = 'service_role' or auth.role() = 'anon' or venda_id in (select id from vendas where empresa_id = public.get_user_empresa_id())) with check (auth.role() = 'service_role' or auth.role() = 'anon' or venda_id in (select id from vendas where empresa_id = public.get_user_empresa_id()));
create policy "venda_itens_delete_policy" on venda_itens for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or venda_id in (select id from vendas where empresa_id = public.get_user_empresa_id()));

-- CONFIGURACOES
drop policy if exists "configuracoes_select_policy" on configuracoes;
drop policy if exists "configuracoes_insert_policy" on configuracoes;
drop policy if exists "configuracoes_update_policy" on configuracoes;
drop policy if exists "configuracoes_delete_policy" on configuracoes;

create policy "configuracoes_select_policy" on configuracoes for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "configuracoes_insert_policy" on configuracoes for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "configuracoes_update_policy" on configuracoes for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "configuracoes_delete_policy" on configuracoes for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- LICENCAS
drop policy if exists "licencas_select_policy" on licencas;
drop policy if exists "licencas_insert_policy" on licencas;
drop policy if exists "licencas_update_policy" on licencas;
drop policy if exists "licencas_delete_policy" on licencas;

create policy "licencas_select_policy" on licencas for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "licencas_insert_policy" on licencas for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "licencas_update_policy" on licencas for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "licencas_delete_policy" on licencas for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- ASSINATURAS
drop policy if exists "assinaturas_select_policy" on assinaturas;
drop policy if exists "assinaturas_insert_policy" on assinaturas;
drop policy if exists "assinaturas_update_policy" on assinaturas;
drop policy if exists "assinaturas_delete_policy" on assinaturas;

create policy "assinaturas_select_policy" on assinaturas for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "assinaturas_insert_policy" on assinaturas for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "assinaturas_update_policy" on assinaturas for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "assinaturas_delete_policy" on assinaturas for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- NOTIFICACOES
drop policy if exists "notificacoes_select_policy" on notificacoes;
drop policy if exists "notificacoes_insert_policy" on notificacoes;
drop policy if exists "notificacoes_update_policy" on notificacoes;
drop policy if exists "notificacoes_delete_policy" on notificacoes;

create policy "notificacoes_select_policy" on notificacoes for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "notificacoes_insert_policy" on notificacoes for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "notificacoes_update_policy" on notificacoes for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "notificacoes_delete_policy" on notificacoes for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- AUDITORIA
drop policy if exists "auditoria_select_policy" on auditoria;
drop policy if exists "auditoria_insert_policy" on auditoria;
drop policy if exists "auditoria_update_policy" on auditoria;
drop policy if exists "auditoria_delete_policy" on auditoria;

create policy "auditoria_select_policy" on auditoria for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "auditoria_insert_policy" on auditoria for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "auditoria_update_policy" on auditoria for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "auditoria_delete_policy" on auditoria for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- INTEGRACOES
drop policy if exists "integracoes_select_policy" on integracoes;
drop policy if exists "integracoes_insert_policy" on integracoes;
drop policy if exists "integracoes_update_policy" on integracoes;
drop policy if exists "integracoes_delete_policy" on integracoes;

create policy "integracoes_select_policy" on integracoes for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "integracoes_insert_policy" on integracoes for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "integracoes_update_policy" on integracoes for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "integracoes_delete_policy" on integracoes for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- LOGS
drop policy if exists "logs_select_policy" on logs;
drop policy if exists "logs_insert_policy" on logs;
drop policy if exists "logs_update_policy" on logs;
drop policy if exists "logs_delete_policy" on logs;

create policy "logs_select_policy" on logs for select using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "logs_insert_policy" on logs for insert with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "logs_update_policy" on logs for update using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id()) with check (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());
create policy "logs_delete_policy" on logs for delete using (auth.role() = 'service_role' or auth.role() = 'anon' or empresa_id = public.get_user_empresa_id());

-- ----------------------------------------------------------------------------
-- 3. TABELA GLOBAL (SISTEMA): planos
-- ----------------------------------------------------------------------------
drop policy if exists "planos_select_policy" on planos;
drop policy if exists "planos_all_policy" on planos;

create policy "planos_select_policy" on planos
  for select using (true); -- Leitura pública e para todos os usuários autenticados

create policy "planos_all_policy" on planos
  for all using (auth.role() = 'service_role');

-- ============================================================================
-- SUPABASE STORAGE BUCKETS
-- ============================================================================
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('produtos', 'produtos', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('etiquetas', 'etiquetas', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('documentos', 'documentos', true) on conflict do nothing;
