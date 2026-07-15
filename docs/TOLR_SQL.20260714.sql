with target_tables as (
  select c.oid, n.nspname as schema_name, c.relname as table_name
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
),
cols as (
  select
    t.schema_name,
    t.table_name,
    a.attnum,
    a.attname,
    pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
    a.attnotnull,
    pg_get_expr(ad.adbin, ad.adrelid) as default_expr,
    a.attidentity,
    a.attgenerated
  from target_tables t
  join pg_attribute a on a.attrelid = t.oid
  left join pg_attrdef ad on ad.adrelid = a.attrelid and ad.adnum = a.attnum
  where a.attnum > 0 and not a.attisdropped
),
col_lines as (
  select
    schema_name,
    table_name,
    string_agg(
      format(
        '    %I %s%s%s%s',
        attname,
        data_type,
        case when attidentity <> '' then ' GENERATED ' ||
          case attidentity when 'a' then 'ALWAYS' when 'd' then 'BY DEFAULT' else '' end ||
          ' AS IDENTITY' else '' end,
        case when default_expr is not null and attidentity = '' and attgenerated = '' then ' DEFAULT ' || default_expr else '' end,
        case when attnotnull then ' NOT NULL' else '' end
      ),
      E',\n' order by attnum
    ) as cols_sql
  from cols
  group by schema_name, table_name
),
pks as (
  select
    n.nspname as schema_name,
    c.relname as table_name,
    string_agg(quote_ident(a.attname), ', ' order by x.ord) as pk_cols
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  join lateral unnest(con.conkey) with ordinality as x(attnum, ord) on true
  join pg_attribute a on a.attrelid = c.oid and a.attnum = x.attnum
  where con.contype = 'p'
    and n.nspname = 'public'
  group by n.nspname, c.relname
),
create_tables as (
  select
    format(
      'CREATE TABLE %I.%I (\n%s%s\n);',
      c.schema_name,
      c.table_name,
      c.cols_sql,
      case when p.pk_cols is not null then E',\n    PRIMARY KEY (' || p.pk_cols || ')' else '' end
    ) as ddl,
    10 as ord,
    c.table_name as obj
  from col_lines c
  left join pks p
    on p.schema_name = c.schema_name and p.table_name = c.table_name
),
uniques_checks_fks as (
  select
    format('ALTER TABLE %I.%I ADD CONSTRAINT %I %s;', n.nspname, c.relname, con.conname, pg_get_constraintdef(con.oid, true)) as ddl,
    case con.contype when 'u' then 20 when 'c' then 21 when 'f' then 22 else 29 end as ord,
    c.relname as obj
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and con.contype in ('u','c','f')
),
indexes as (
  select
    pg_get_indexdef(i.indexrelid) || ';' as ddl,
    30 as ord,
    t.relname as obj
  from pg_index i
  join pg_class t on t.oid = i.indrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and not i.indisprimary
),
rls_enable as (
  select
    format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', n.nspname, c.relname) as ddl,
    40 as ord,
    c.relname as obj
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relrowsecurity
),
policies as (
  select
    format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s %s%s;',
      p.policyname,
      p.schemaname,
      p.tablename,
      case when p.permissive = 'PERMISSIVE' then 'PERMISSIVE' else 'RESTRICTIVE' end,
      p.cmd,
      p.roles,
      case when p.qual is not null then 'USING (' || p.qual || ')' else '' end,
      case when p.with_check is not null then
        case when p.qual is not null then ' ' else '' end || 'WITH CHECK (' || p.with_check || ')'
      else '' end
    ) as ddl,
    41 as ord,
    p.tablename as obj
  from pg_policies p
  where p.schemaname = 'public'
),
functions as (
  select
    pg_get_functiondef(p.oid) as ddl,
    50 as ord,
    p.proname as obj
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
),
triggers as (
  select
    format('CREATE TRIGGER %I %s;', t.tgname, pg_get_triggerdef(t.oid, true)) as ddl,
    60 as ord,
    c.relname as obj
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and not t.tgisinternal
)
select ddl
from (
  select * from create_tables
  union all select * from uniques_checks_fks
  union all select * from indexes
  union all select * from rls_enable
  union all select * from policies
  union all select * from functions
  union all select * from triggers
) x
order by ord, obj, ddl;