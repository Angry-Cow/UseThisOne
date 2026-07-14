<instructions>
This file tracks your database decisions, conventions, and preferences.
It does NOT store the current schema — entity definitions are injected per-request automatically.
Instead, use this file to remember:
  1. Data storage preferences (e.g., "store image references as storage paths, not full URLs")
  2. Schema conventions (e.g., "always use soft deletes", "snake_case column names", "every table gets createdAt/updatedAt")
  3. Anti-patterns to avoid (e.g., "don't store computed values", "no direct user-to-user foreign keys")
  4. Data flow decisions (e.g., "auth state comes from session, not DB lookup per request")
  5. Indexing and query patterns worth remembering

When the user makes a database-related decision, proactively capture the *why* here so you don't forget it.
Keep entries sorted in DESC order (newest first) so recent decisions stay in prompt context if the file is truncated.
</instructions>

<database>
# Database Decisions & Conventions

## Schema Conventions (always apply)
- All column names: **snake_case** — no exceptions
- Visibility toggle: `switch int` (1 = show, 0 = hide)
- Sort order: `order int` (lower = first)
- Timestamps: `created_at`, `updated_at` (trigger-managed via `set_updated_at()`)
- IDs: UUID primary keys
- RLS: public `SELECT` (anon), authenticated `INSERT/UPDATE/DELETE`; enforced via `is_admin()` helper

---

## 2026-07-11 — SiteSettings + SectionText + UsefulLink (migration 002)

**`SiteSettings`** — Singleton. PK is `singleton boolean DEFAULT true` + CHECK enforces one row. Holds 30 `color_*` text columns + `navbar_items jsonb` + site identity fields. Public SELECT, auth UPDATE only. No INSERT/DELETE after seed.

**`SectionText`** — Key/value store for all section text copy fields. `field_key` has UNIQUE index. `field_type` drives admin widget widget (`text | textarea | url | href`). All 53 fields seeded with TOLR defaults. New fields added via INSERT — no schema migration needed.

**`UsefulLink`** — Footer "Useful" column items. Follows `switch/order` convention. Public sees `switch=1` rows ordered by `order`.

**Key design decisions:**
- SiteSettings singleton-boolean PK makes the "one row ever" rule DB-enforced
- SectionText key/value avoids schema migrations for new copy fields
- `navbar_items` lives in SiteSettings (not SectionText) because it is JSONB, not a scalar text value
- `set_updated_at()` function created once in migration 001 with `OR REPLACE` — reused in 002

---

## 2026-05-14 — Supabase Auth Migration

- `auth_user_id` (nullable UUID) added to `Admin` table — links to `auth.users.id`
- `is_admin()` SQL function checks `auth.uid()` exists in `Admin.auth_user_id WHERE switch=1`
- All admin-only tables gated by `is_admin()` RLS policy
- Public tables (Booking, BookingGroup) keep `anon INSERT` policy so the public form still works
- Admin email convention: `{username}@tolr.admin` — internal only, disable email confirmations in Supabase Auth settings

---

## 2026-05-03 — Course + Offering Merge

- `Offering` table merged into `Course` — both represented the same 9 training programs
- Added `button1_text` (primary CTA, default `'Contact Now'`) and `button2_text` (secondary, default `'Group Rate'`) to `Course`
- `duration` holds long-form scheduling note (e.g. `"4 Hours • Contact us to arrange a class"`)
- `switch` and `order` are single source of truth for both CourseCard and CourseInvestmentItem views
- Booking form dropdown populated from `Course` (switch=1, order asc)
</database>
