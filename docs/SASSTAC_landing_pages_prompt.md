# SASSTAC Handoff Prompt — Admin Landing Pages Builder

> Copy everything below the horizontal rule and paste it as your first message to SASSTAC.

---

## Feature Request: Admin Landing Pages Builder with Public Offer Pages

I need you to implement a **Landing Pages** feature in the admin section of this website. This feature lets admins create pages that serve as publicly viewable offer/sales pages embedded from an external URL. Here is the complete, verified specification — implement it exactly as described.

---

### 0 — Project context (important — read before coding)

- This project uses **raw Supabase** for all database access and authentication. Import the client from `@/lib/supabase`. **Never** use `@animaapp/playground-react-sdk`, `AnimaProvider`, `useQuery`, `useMutation`, or any AnimaApp SDK hook.
- Auth is `supabase.auth` (email + password). Admin routes are protected by `AdminShell` which checks `supabase.auth.getSession()`.
- All database column names are **snake_case** (e.g. `is_published`, `iframe_src`, `created_at`).
- The supabase client is at `@/lib/supabase`.
- Routing uses `react-router-dom` with `BrowserRouter` + `Routes` defined in `src/App.tsx`.
- The admin sidebar nav lives in `src/pages/admin/components/AdminShell.tsx` in a `NAV_ITEMS` array.
- Shared admin UI components (`FlashBanner`, `DeleteConfirmModal`) are in `src/pages/admin/components/AdminUI.tsx`.
- The public-facing `<Navbar />` is imported from `@/sections/Navbar` and `<Footer />` from `@/sections/Footer`.

---

### 1 — Database (Supabase SQL)

Run this script in your Supabase SQL editor. It is idempotent — safe to run multiple times.

```sql
CREATE TABLE IF NOT EXISTS public."LandingPage" (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  slug         text        NOT NULL,
  embed_script text        NOT NULL DEFAULT '',
  iframe_src   text        NOT NULL DEFAULT '',
  is_published boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'landing_page_slug_unique'
      AND conrelid = 'public."LandingPage"'::regclass
  ) THEN
    ALTER TABLE public."LandingPage"
      ADD CONSTRAINT landing_page_slug_unique UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_landing_page_slug
  ON public."LandingPage" (slug)
  WHERE is_published = true;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS landing_page_set_updated_at ON public."LandingPage";
CREATE TRIGGER landing_page_set_updated_at
  BEFORE UPDATE ON public."LandingPage"
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public."LandingPage" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_landing_pages"     ON public."LandingPage";
DROP POLICY IF EXISTS "authenticated_full_access_landing_pages" ON public."LandingPage";

CREATE POLICY "public_read_published_landing_pages"
  ON public."LandingPage" FOR SELECT TO anon
  USING (is_published = true);

CREATE POLICY "authenticated_full_access_landing_pages"
  ON public."LandingPage" FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

GRANT SELECT ON public."LandingPage" TO anon;
GRANT ALL    ON public."LandingPage" TO authenticated;
```

**Column notes:**
- `embed_script` exists in the schema but is **not used by any form field** — it keeps its `DEFAULT ''` and is never written by the UI. Do not add a form field for it.
- `iframe_src` is the only URL field used by the UI (a plain `https://` URL the admin pastes directly).

---

### 2 — Admin Navigation (`src/pages/admin/components/AdminShell.tsx`)

Add one new entry to the end of the `NAV_ITEMS` array:

```tsx
{
  label: "Landing Pages",
  path: "/admin/content/landing-pages",
  icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
},
```

---

### 3 — Routes (`src/App.tsx`)

Add these four imports at the top:

```tsx
import LandingPagesManager from "@/pages/admin/content/LandingPagesManager";
import LandingPageForm from "@/pages/admin/content/LandingPageForm";
import LandingPageView from "@/pages/LandingPageView";
```

Add these four routes inside `<Routes>`:

```tsx
<Route path="/admin/content/landing-pages"          element={<LandingPagesManager />} />
<Route path="/admin/content/landing-pages/new"       element={<LandingPageForm />} />
<Route path="/admin/content/landing-pages/edit/:id"  element={<LandingPageForm />} />
<Route path="/offers/:slug"                          element={<LandingPageView />} />
```

Note: `/offers/:slug` is a **public route** — no auth required, not wrapped in `AdminShell`.

---

### 4 — Landing Pages Manager (`src/pages/admin/content/LandingPagesManager.tsx`)

New file. Wrapped in `<AdminShell>`. Uses `FlashBanner` and `DeleteConfirmModal` from `AdminUI`.

**Data fetch:**
```ts
supabase
  .from("LandingPage")
  .select("id, name, slug, embed_script, iframe_src, is_published, created_at, updated_at")
  .order("created_at", { ascending: false })
```

**Table columns:**

| Column | Detail |
|---|---|
| **Name** | `page.name` in white bold; `page.iframe_src` truncated in slate-500 below it |
| **Public Path** | `<code>/offers/{slug}</code>` as an amber chip (`bg-slate-900/60 text-amber-400`) |
| **Status** | Clickable `PublishBadge` that toggles `is_published` inline |
| **Updated** | `formatDate(page.updated_at)` — formatted as `"MMM D, YYYY"` |
| **Actions** | Copy URL button · Edit button · Delete button |

**Publish toggle (inline, no modal):**
```ts
supabase
  .from("LandingPage")
  .update({ is_published: !page.is_published, updated_at: new Date().toISOString() })
  .eq("id", page.id)
```
Then refetch the list.

**Copy URL button:** writes `window.location.origin + "/offers/" + slug` to clipboard. Shows "Copied!" for 2 seconds.

**Edit button:** `window.location.href = "/admin/content/landing-pages/edit/" + page.id` (hard redirect — not React Router navigate — to ensure clean page load).

**Delete:** opens `DeleteConfirmModal` → on confirm calls `.delete().eq("id", id)` → refetch list → flash "Landing page deleted."

**Error state (fetch failed):** show message referencing `docs/migrations/001_create_landing_pages.sql`.

**Empty state:** CTA button that navigates to `/admin/content/landing-pages/new` (same hard-redirect pattern).

**Header "New Landing Page" button:** hard-redirect to `/admin/content/landing-pages/new`.

---

### 5 — Create / Edit Form (`src/pages/admin/content/LandingPageForm.tsx`)

New file. Dual-mode: create (`/new`, no `id` param) vs. edit (`/edit/:id`). Wrapped in `<AdminShell>`.

#### 5a — State shape

```ts
type FormState = {
  name: string;
  slug: string;
  iframe_src: string;
  is_published: boolean;
};
```

`embed_script` is **NOT** in the form state and NOT written by this component. The DB column keeps its default `''`.

#### 5b — Fields (left panel)

**1. Page Name** (`text` input, required)
- On change: updates `form.name`; if `slugAutoSync === true`, also updates `form.slug` via `slugify(value)`.
- `slugAutoSync` starts as `true` for new pages, `false` for edit pages.

**2. URL Slug** (`text` input, required)
- On change: sets `slugAutoSync = false`, then updates `form.slug = slugify(value)`.
- `slugify()` implementation:
  ```ts
  function slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  ```
- Below the input: hint text `Public path: /offers/{slug}` (slug or "your-slug" placeholder).
- **Real-time uniqueness check** (debounced 600 ms):
  ```ts
  supabase.from("LandingPage").select("id").eq("slug", slug).maybeSingle()
  ```
  Marks `slugTaken = true` if a row exists AND `result.id !== current id` (so editing the same page without changing its slug does not falsely show "taken").
  - While checking: show "checking…" inside/beside the input.
  - Taken: show "taken" in red.
  - Available (slug is non-empty, not current original, not taken): show "available" in green.

**3. Page URL** (`url` input for `iframe_src`, required)
- Validated with:
  ```ts
  function isValidUrl(url: string): boolean {
    try {
      const u = new URL(url);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch { return false; }
  }
  ```
- When valid: show green "✓ Valid URL" indicator below the input.
- When invalid and field has been touched: show red field error.

**4. Published toggle** (labelled switch, default OFF)
- Amber when ON, slate when OFF.

**5. Public URL row** (shown only when `form.slug` is non-empty)
- Displays `{window.location.origin}/offers/{slug}` in amber monospace.
- Includes a `CopyButton` (same 2-second "Copied!" feedback as the manager).

#### 5c — Validation (client-side, field-level errors)

Validate on Save click:
- Name required → `"Page name is required."`
- Slug required → `"URL slug is required."`
- Slug taken → `"This slug is already in use. Choose a different one."`
- `iframe_src` empty → `"A page URL is required."`
- `iframe_src` fails `isValidUrl()` → `"Enter a valid http:// or https:// URL."`

Display errors inline below each field in `text-red-400 text-xs`.

#### 5d — Save flow

Payload for both create and update:
```ts
{
  name: form.name.trim(),
  slug: form.slug.trim(),
  iframe_src: form.iframe_src.trim(),
  is_published: form.is_published,
  updated_at: new Date().toISOString(),
}
```
Insert also includes `created_at: new Date().toISOString()`.

**On `23505` error code** (unique constraint violation on slug): set the slug field error to `"This slug is already taken."` AND show an error flash banner. Do NOT throw.

**On create success:** `navigate("/admin/content/landing-pages/edit/" + newId, { replace: true })`.

**On edit success:** clear `isDirty`, update `originalSlug.current`, show success flash.

**Save button disabled** while: `saving || slugChecking || slugTaken`.

#### 5e — Unsaved-changes guard

```ts
useEffect(() => {
  const handler = (e: BeforeUnloadEvent) => {
    if (isDirty) { e.preventDefault(); e.returnValue = ""; }
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [isDirty]);
```

#### 5f — Live preview panel (right column, sticky)

- Rendered as a `sticky top-6` card beside the form fields.
- **Has a "browser chrome" header:** three macOS-style dot indicators (red/amber/green) + the truncated `iframe_src` URL as grey text.
- Iframe element when `iframe_src` is valid:
  ```tsx
  <iframe
    src={iframeSrc}
    style={{ border: "none", minHeight: "400px" }}
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
  />
  ```
  Note: `allow-top-navigation-by-user-activation` is intentionally **absent** from the preview iframe sandbox.
- **Empty state** when `iframe_src` is empty or invalid: show placeholder icon + "Enter a page URL on the left to see a live preview here."

#### 5g — Overall layout

```
grid grid-cols-1 xl:grid-cols-2 gap-6 items-start
  └── left: dark card (bg-slate-800 rounded-2xl border border-slate-700) with all fields + actions
  └── right: dark card (bg-slate-800 ...) sticky, with browser-chrome header + iframe
```

---

### 6 — Public Landing Page View (`src/pages/LandingPageView.tsx`)

New file. **Not** wrapped in `AdminShell`. Uses the site's public `<Navbar />` and `<Footer />`.

#### 6a — Data fetch

```ts
supabase
  .from("LandingPage")
  .select("name, iframe_src")
  .eq("slug", slug)
  .eq("is_published", true)
  .single()
```

On success: `document.title = page.name + " | {SiteName}"` (replace `{SiteName}` with whatever the site's brand name is in the document title).

#### 6b — Page layout (DOM order, top to bottom)

```tsx
<div className="min-h-screen bg-slate-50 flex flex-col">
  <Navbar />

  <div className="h-20" />   {/* 80px spacer for fixed navbar */}
  <div className="h-4" />    {/* 16px additional buffer */}

  <main className="flex-1 flex flex-col items-center px-4 pb-0">
    <div className="w-full" style={{ maxWidth: "900px", overflow: "hidden" }}>
      {/* AutoResizeIframe or empty-content placeholder */}
    </div>
  </main>

  <div className="h-10" />   {/* 40px bottom buffer */}

  <Footer />
</div>
```

#### 6c — `AutoResizeIframe` component

```tsx
function AutoResizeIframe({ src, title }: { src: string; title: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(600);  // default 600px

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.height) {
        setHeight(event.data.height);
      }
      // Only { height: N } shape is handled — bare numbers and other
      // shapes (frameHeight, iframeHeight) are intentionally NOT handled.
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <iframe
      id="lp-frame"
      ref={iframeRef}
      src={src}
      title={title}
      className="w-full rounded-xl shadow-md"
      style={{ width: "100%", border: "none", height: `${height}px`, display: "block" }}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
    />
  );
}
```

Key behavioural notes:
- Default height: **600px** (not 700px).
- Only `event.data.height` (number property on an object) triggers a resize. Bare numbers and other property names are ignored.
- No `getHeight` message is sent on load.
- No CSS height transition — height changes are direct state updates.
- The public page iframe **does** include `allow-top-navigation-by-user-activation` in sandbox (unlike the admin preview iframe which does not).

#### 6d — Not-found / unpublished state

Show with `<Navbar />` and `<Footer />` still visible:
- Amber icon in a rounded box.
- `"Page not found"` heading.
- `"This offer page doesn't exist or is no longer available."` subtext.
- `"Back to Home"` amber pill button linking to `/`.

#### 6e — Loading state

Show with `<Navbar />` and `<Footer />` still visible. Centered spinner in the `flex-1` area.

---

### 7 — Design / Style Notes

- All admin screens must match the dark slate palette used by existing admin managers: `bg-slate-900` shell, `bg-slate-800` cards, `border-slate-700`, amber (`amber-600`) accents.
- Use `FlashBanner` and `DeleteConfirmModal` from `src/pages/admin/components/AdminUI.tsx` — do not create custom alternatives.
- The public page (`/offers/:slug`) inherits the site chrome (Navbar + Footer) untouched — no layout changes to those components.
- The iframe `max-width: 900px` matches the "Why Us" / "Why Choose Us" section width used elsewhere on the site.

---

### 8 — Files to create / modify summary

| Operation | Path |
|---|---|
| **SQL** (run in Supabase) | `docs/migrations/001_create_landing_pages.sql` |
| **Edit** (add nav item) | `src/pages/admin/components/AdminShell.tsx` |
| **Edit** (add 4 routes + 3 imports) | `src/App.tsx` |
| **Create** | `src/pages/admin/content/LandingPagesManager.tsx` |
| **Create** | `src/pages/admin/content/LandingPageForm.tsx` |
| **Create** | `src/pages/LandingPageView.tsx` |

---

*End of handoff prompt.*
