-- SubGuard AI database schema
-- Run this in the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'inactive',
  plan text not null default 'starter',
  created_at timestamptz not null default now()
);

create index if not exists companies_owner_id_idx on companies (owner_id);

-- ---------------------------------------------------------------------------
-- subcontractors
-- ---------------------------------------------------------------------------
create table if not exists subcontractors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  status text not null default 'active' check (status in ('active', 'expiring_soon', 'expired')),
  created_at timestamptz not null default now()
);

create index if not exists subcontractors_company_id_idx on subcontractors (company_id);

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  subcontractor_id uuid not null references subcontractors (id) on delete cascade,
  doc_type text not null check (
    doc_type in (
      'Haftpflichtversicherung',
      'Freistellungsbescheinigung',
      'Gewerbeanmeldung',
      'Sonstiges'
    )
  ),
  file_url text not null,
  issue_date date,
  expiration_date date,
  status text not null default 'active' check (status in ('active', 'expiring_soon', 'expired', 'invalid')),
  extracted_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists documents_subcontractor_id_idx on documents (subcontractor_id);
create index if not exists documents_expiration_date_idx on documents (expiration_date);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table companies enable row level security;
alter table subcontractors enable row level security;
alter table documents enable row level security;

-- companies: owner can fully manage their own company row(s)
create policy "companies_select_own" on companies
  for select using (auth.uid() = owner_id);

create policy "companies_insert_own" on companies
  for insert with check (auth.uid() = owner_id);

create policy "companies_update_own" on companies
  for update using (auth.uid() = owner_id);

create policy "companies_delete_own" on companies
  for delete using (auth.uid() = owner_id);

-- subcontractors: accessible only through an owned company
create policy "subcontractors_select_own" on subcontractors
  for select using (
    exists (
      select 1 from companies
      where companies.id = subcontractors.company_id
        and companies.owner_id = auth.uid()
    )
  );

create policy "subcontractors_insert_own" on subcontractors
  for insert with check (
    exists (
      select 1 from companies
      where companies.id = subcontractors.company_id
        and companies.owner_id = auth.uid()
    )
  );

create policy "subcontractors_update_own" on subcontractors
  for update using (
    exists (
      select 1 from companies
      where companies.id = subcontractors.company_id
        and companies.owner_id = auth.uid()
    )
  );

create policy "subcontractors_delete_own" on subcontractors
  for delete using (
    exists (
      select 1 from companies
      where companies.id = subcontractors.company_id
        and companies.owner_id = auth.uid()
    )
  );

-- documents: accessible only through an owned company -> subcontractor chain
create policy "documents_select_own" on documents
  for select using (
    exists (
      select 1 from subcontractors
      join companies on companies.id = subcontractors.company_id
      where subcontractors.id = documents.subcontractor_id
        and companies.owner_id = auth.uid()
    )
  );

create policy "documents_insert_own" on documents
  for insert with check (
    exists (
      select 1 from subcontractors
      join companies on companies.id = subcontractors.company_id
      where subcontractors.id = documents.subcontractor_id
        and companies.owner_id = auth.uid()
    )
  );

create policy "documents_update_own" on documents
  for update using (
    exists (
      select 1 from subcontractors
      join companies on companies.id = subcontractors.company_id
      where subcontractors.id = documents.subcontractor_id
        and companies.owner_id = auth.uid()
    )
  );

create policy "documents_delete_own" on documents
  for delete using (
    exists (
      select 1 from subcontractors
      join companies on companies.id = subcontractors.company_id
      where subcontractors.id = documents.subcontractor_id
        and companies.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage bucket for uploaded documents
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "documents_bucket_auth_read" on storage.objects
  for select using (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "documents_bucket_auth_insert" on storage.objects
  for insert with check (bucket_id = 'documents' and auth.role() = 'authenticated');
