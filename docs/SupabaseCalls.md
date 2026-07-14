# TOLR — Supabase Calls Reference

> **Project:** Tools Of Last Resort (TOLR)  
> **Supabase Project URL:** `https://fgfyfxgbsqirdenkwatl.supabase.co`  
> **Client init file:** `src/lib/supabase.ts`  
> **Last audited:** 2026-06-11

---

## Client Initialization

| Call | What it does | File |
|------|-------------|------|
| `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` | Creates and exports the Supabase client using the project URL and anon key. Performs a config guard before creating — returns `null` if env values are placeholders. | `src/lib/supabase.ts` |

---

## Auth

All auth calls use `supabase.auth.*`.

| Call | What it does | File |
|------|-------------|------|
| `supabase.auth.signInWithPassword({ email, password })` | Signs in an admin with email + password credentials. Returns a session on success or an error. | `src/pages/admin/AdminLogin.tsx` |
| `supabase.auth.signInWithPassword({ email, password })` | Fallback during setup — if `signUp` finds the user already exists, signs in to retrieve their UUID instead. | `src/pages/admin/AdminAuthSetup.tsx` |
| `supabase.auth.signUp({ email, password, options: { data: { role: "admin" } } })` | Creates a new Supabase Auth user during the one-time admin setup flow. Email confirmation is expected to be disabled in the project settings. | `src/pages/admin/AdminAuthSetup.tsx` |
| `supabase.auth.signOut()` | Signs out the current user after setup completes and redirects to `/admin` login. | `src/pages/admin/AdminAuthSetup.tsx` |
| `supabase.auth.getSession()` | Checks the current active session to initialize auth state on mount. | `src/pages/admin/components/AdminShell.tsx` |
| `supabase.auth.onAuthStateChange(callback)` | Subscribes to auth state changes (sign-in / sign-out events). Updates session state and redirects unauthenticated users to `/admin`. Returns a listener that is unsubscribed on component unmount. | `src/pages/admin/components/AdminShell.tsx` |
| `supabase.auth.signOut()` | Signs out the current admin session and navigates to `/` (the public site homepage). | `src/pages/admin/components/AdminShell.tsx` |
| `supabase.auth.getSession()` | Retrieves the current session to verify the signed-in user's ID before allowing a self-password reset. Only the currently authenticated user can reset their own password here. | `src/pages/admin/AdminDashboard.tsx` |
| `supabase.auth.updateUser({ password })` | Updates the password of the currently signed-in user. Used in the admin dashboard Reset Password modal. Cannot reset other users' passwords — those require the Supabase dashboard or a service-role edge function. | `src/pages/admin/AdminDashboard.tsx` |

---

## Database (PostgREST via `supabase.from(...)`)

### Table: `Booking`

| Call | What it does | File |
|------|-------------|------|
| `supabase.from("Booking").select("*").order("created_at", { ascending: false })` | Fetches all individual booking records sorted newest-first for the admin bookings list. | `src/pages/admin/content/BookingsManager.tsx` |
| `supabase.from("Booking").update({...}).eq("id", editItem.id)` | Updates an existing booking record (admin notes, status fields, etc.) from the edit modal. | `src/pages/admin/content/BookingsManager.tsx` |
| `supabase.from("Booking").delete().eq("id", deleteTarget.id)` | Permanently deletes a booking record after admin confirmation. | `src/pages/admin/content/BookingsManager.tsx` |
| `supabase.from("Booking").insert({...})` | Inserts a new individual booking submission from the public-facing Booking Form. Includes fields: `full_name`, `email`, `phone`, `course`, `preferred_date`, `notes`, `request_type`, `contacted`, `scheduled`, `paid`, `completed`. | `src/sections/BookingSection/components/BookingForm.tsx` |

---

### Table: `BookingGroup`

| Call | What it does | File |
|------|-------------|------|
| `supabase.from("BookingGroup").select("*").order("created_at", { ascending: false })` | Fetches all group booking records sorted newest-first for the admin group bookings list. | `src/pages/admin/content/GroupBookingsManager.tsx` |
| `supabase.from("BookingGroup").update({...}).eq("id", editTarget.id)` | Updates a group booking record (admin notes, status fields, etc.) from the edit modal. | `src/pages/admin/content/GroupBookingsManager.tsx` |
| `supabase.from("BookingGroup").delete().eq("id", deleteTarget.id)` | Permanently deletes a group booking record after admin confirmation. | `src/pages/admin/content/GroupBookingsManager.tsx` |
| `supabase.from("BookingGroup").insert([{...}])` | Inserts a new group rate request from the public-facing Group Rate Modal. Includes fields: `full_name`, `email`, `phone`, `course`, `number_of_attendees`, `training_location`, `preferred_dates`, `notes`, `contacted`, `scheduled`, `paid`, `completed`. | `src/sections/BookingSection/components/GroupRateModal.tsx` |

---

### Table: `Course`

| Call | What it does | File |
|------|-------------|------|
| `supabase.from("Course").select("*").order("order", { ascending: true })` | Fetches all courses (all visibility states) for the admin courses manager list. | `src/pages/admin/content/CoursesManager.tsx` |
| `supabase.from("Course").select("*").eq("switch", 1).order("order", { ascending: true })` | Fetches only visible categories for the category filter dropdown in the courses admin editor. | `src/pages/admin/content/CoursesManager.tsx` |
| `supabase.from("Course").insert(draft)` | Creates a new course record from the admin courses editor. | `src/pages/admin/content/CoursesManager.tsx` |
| `supabase.from("Course").update(draft).eq("id", movedId)` | Updates a course record (full draft save or order swap). Called multiple times during reorder operations. | `src/pages/admin/content/CoursesManager.tsx` |
| `supabase.from("Course").delete().eq("id", deleteTarget.id)` | Permanently deletes a course record after admin confirmation. | `src/pages/admin/content/CoursesManager.tsx` |
| `supabase.from("Course").update({ switch: ... }).eq("id", id)` | Toggles the visibility (`switch`) of a course between 0 and 1. | `src/pages/admin/content/CoursesManager.tsx` |
| `supabase.from("Course").select("title, private_price").eq("switch", 1).order("order", { ascending: true })` | Fetches visible course titles and private prices to populate the course selector dropdown in the individual booking form. | `src/sections/BookingSection/components/BookingForm.tsx` |
| `supabase.from("Course").select("title, group_price").eq("switch", 1).order("order", { ascending: true })` | Fetches visible course titles and group prices to populate the course selector dropdown in the group rate modal. | `src/sections/BookingSection/components/GroupRateModal.tsx` |
| `supabase.from("Course").select("id, title, duration, description, features, group_price, group_price_note, private_price, private_price_note, button1_text, button2_text, switch, order, category").eq("switch", 1).order("order", { ascending: true })` | Fetches all visible courses (full detail) for display on the public Courses section and Course Investment section. | `src/sections/BookingSection/components/CourseInvestmentList.tsx` |
| `supabase.from("Course").select("...full fields...").eq("switch", 1).order("order", { ascending: true })` | Fetches visible courses for display on the public Courses section cards. | `src/sections/CoursesSection/index.tsx` |

---

### Table: `CourseCategory`

| Call | What it does | File |
|------|-------------|------|
| `supabase.from("CourseCategory").select("*").order("order", { ascending: true })` | Fetches all course categories for the admin categories manager table. | `src/pages/admin/content/CategoriesManager.tsx` |
| `supabase.from("CourseCategory").insert(draft)` | Creates a new course category record from the admin editor. | `src/pages/admin/content/CategoriesManager.tsx` |
| `supabase.from("CourseCategory").update(draft).eq("id", editItem.id)` | Updates an existing category record (name, visibility, order). | `src/pages/admin/content/CategoriesManager.tsx` |
| `supabase.from("CourseCategory").delete().eq("id", deleteTarget.id)` | Permanently deletes a category record after admin confirmation. | `src/pages/admin/content/CategoriesManager.tsx` |
| `supabase.from("CourseCategory").update({ switch: ... }).eq("id", id)` | Toggles the visibility (`switch`) of a category between 0 and 1. | `src/pages/admin/content/CategoriesManager.tsx` |
| `supabase.from("CourseCategory").update({ order: ... }).eq("id", id)` | Updates the sort order of a category (called twice during a swap — once for the displaced item, once for the moved item). | `src/pages/admin/content/CategoriesManager.tsx` |
| `supabase.from("CourseCategory").select("name").eq("switch", 1).order("order", { ascending: true })` | Fetches visible category names to build the filter tab list on the public Courses section. | `src/sections/CoursesSection/index.tsx` |

---

### Table: `Service`

| Call | What it does | File |
|------|-------------|------|
| `supabase.from("Service").select("*").order("order", { ascending: true })` | Fetches all services for the admin services manager table. | `src/pages/admin/content/ServicesManager.tsx` |
| `supabase.from("Service").insert(draft)` | Creates a new service record from the admin editor. | `src/pages/admin/content/ServicesManager.tsx` |
| `supabase.from("Service").update(draft).eq("id", editItem.id)` | Updates an existing service record (title, description, images, list items, etc.). | `src/pages/admin/content/ServicesManager.tsx` |
| `supabase.from("Service").delete().eq("id", deleteTarget.id)` | Permanently deletes a service record after admin confirmation. | `src/pages/admin/content/ServicesManager.tsx` |
| `supabase.from("Service").update({ switch: ... }).eq("id", id)` | Toggles the visibility (`switch`) of a service between 0 and 1. | `src/pages/admin/content/ServicesManager.tsx` |
| `supabase.from("Service").update({ order: ... }).eq("id", id)` | Updates the sort order of a service. | `src/pages/admin/content/ServicesManager.tsx` |
| `supabase.from("Service").select("id, switch, order, title, description, icon_src, card_image_src, card_image_alt, list_items").eq("switch", 1).order("order", { ascending: true })` | Fetches all visible services for display on the public Services section cards. | `src/sections/ServicesSection/index.tsx` |

---

### Table: `Faq`

| Call | What it does | File |
|------|-------------|------|
| `supabase.from("Faq").select("*").order("order", { ascending: true })` | Fetches all FAQ entries for the admin FAQs manager table. | `src/pages/admin/content/FaqsManager.tsx` |
| `supabase.from("Faq").insert(draft)` | Creates a new FAQ record from the admin editor. | `src/pages/admin/content/FaqsManager.tsx` |
| `supabase.from("Faq").update(draft).eq("id", editItem.id)` | Updates an existing FAQ record (question, answer, link fields). | `src/pages/admin/content/FaqsManager.tsx` |
| `supabase.from("Faq").delete().eq("id", deleteTarget.id)` | Permanently deletes a FAQ record after admin confirmation. | `src/pages/admin/content/FaqsManager.tsx` |
| `supabase.from("Faq").update({ switch: ... }).eq("id", id)` | Toggles the visibility (`switch`) of a FAQ between 0 and 1. | `src/pages/admin/content/FaqsManager.tsx` |
| `supabase.from("Faq").update({ order: ... }).eq("id", id)` | Updates the sort order of a FAQ entry. | `src/pages/admin/content/FaqsManager.tsx` |
| `supabase.from("Faq").select("id, question, answer, link, link_text").eq("switch", 1).order("order", { ascending: true })` | Fetches all visible FAQs for display on the public FAQ accordion section. | `src/sections/FaqSection/index.tsx` |

---

### Table: `Review`

| Call | What it does | File |
|------|-------------|------|
| `supabase.from("Review").select("*").order("order", { ascending: true })` | Fetches all reviews for the admin reviews manager table. | `src/pages/admin/content/ReviewsManager.tsx` |
| `supabase.from("Review").insert(draft)` | Creates a new review record from the admin editor. | `src/pages/admin/content/ReviewsManager.tsx` |
| `supabase.from("Review").update(draft).eq("id", editItem.id)` | Updates an existing review record (name, role, text, rating, visibility, etc.). | `src/pages/admin/content/ReviewsManager.tsx` |
| `supabase.from("Review").delete().eq("id", deleteTarget.id)` | Permanently deletes a review record after admin confirmation. | `src/pages/admin/content/ReviewsManager.tsx` |
| `supabase.from("Review").update({ switch: ... }).eq("id", id)` | Toggles the visibility (`switch`) of a review between 0 and 1. Used to approve or hide public reviews. | `src/pages/admin/content/ReviewsManager.tsx` |
| `supabase.from("Review").update({ order: ... }).eq("id", id)` | Updates the sort order of a review. | `src/pages/admin/content/ReviewsManager.tsx` |
| `supabase.from("Review").select("name, role, text, initials, color, rating").eq("switch", 1).order("order", { ascending: true })` | Fetches all approved (visible) reviews for display on the public Testimonials section. | `src/sections/TestimonialsSection/index.tsx` |
| `supabase.from("Review").select("order").order("order", { ascending: false }).limit(1)` | Fetches the highest existing `order` value so a new public review submission can be assigned `maxOrder + 1`. | `src/sections/TestimonialsSection/SubmitReviewModal.tsx` |
| `supabase.from("Review").insert({...})` | Inserts a new public review submission with `switch: 0` (hidden pending admin approval). Fields: `switch`, `order`, `name`, `role`, `text`, `initials`, `color`, `rating`. | `src/sections/TestimonialsSection/SubmitReviewModal.tsx` |

---

### Table: `WhyUsCard`

| Call | What it does | File |
|------|-------------|------|
| `supabase.from("WhyUsCard").select("*").order("order", { ascending: true })` | Fetches all Why Us card records for the admin WhyUsCard manager table. | `src/pages/admin/content/WhyUsCardManager.tsx` |
| `supabase.from("WhyUsCard").insert(draft)` | Creates a new WhyUs card record from the admin editor. | `src/pages/admin/content/WhyUsCardManager.tsx` |
| `supabase.from("WhyUsCard").update(draft).eq("id", editItem.id)` | Updates an existing WhyUs card record (video URL, quote, name, role, initial). | `src/pages/admin/content/WhyUsCardManager.tsx` |
| `supabase.from("WhyUsCard").delete().eq("id", deleteTarget.id)` | Permanently deletes a WhyUs card record after admin confirmation. | `src/pages/admin/content/WhyUsCardManager.tsx` |
| `supabase.from("WhyUsCard").update({ switch: ... }).eq("id", id)` | Toggles the visibility (`switch`) of a WhyUs card between 0 and 1. | `src/pages/admin/content/WhyUsCardManager.tsx` |
| `supabase.from("WhyUsCard").update({ order: ... }).eq("id", id)` | Updates the sort order of a WhyUs card. | `src/pages/admin/content/WhyUsCardManager.tsx` |
| `supabase.from("WhyUsCard").select("video_url, quote, name, role, initial").eq("switch", 1).order("order", { ascending: true }).limit(1)` | Fetches the first visible WhyUs card to render the video + testimonial quote on the public Why Us section. | `src/sections/WhyUsSection/components/WhyUsMedia.tsx` |

---

### Table: `WhyUsReason`

| Call | What it does | File |
|------|-------------|------|
| `supabase.from("WhyUsReason").select("*").order("order", { ascending: true })` | Fetches all Why Us reasons for the admin WhyUsReasons manager table. | `src/pages/admin/content/WhyUsReasonsManager.tsx` |
| `supabase.from("WhyUsReason").insert(draft)` | Creates a new WhyUs reason record from the admin editor. | `src/pages/admin/content/WhyUsReasonsManager.tsx` |
| `supabase.from("WhyUsReason").update(draft).eq("id", editItem.id)` | Updates an existing WhyUs reason record (headline + message). | `src/pages/admin/content/WhyUsReasonsManager.tsx` |
| `supabase.from("WhyUsReason").delete().eq("id", deleteTarget.id)` | Permanently deletes a WhyUs reason record after admin confirmation. | `src/pages/admin/content/WhyUsReasonsManager.tsx` |
| `supabase.from("WhyUsReason").update({ switch: ... }).eq("id", id)` | Toggles the visibility (`switch`) of a WhyUs reason between 0 and 1. | `src/pages/admin/content/WhyUsReasonsManager.tsx` |
| `supabase.from("WhyUsReason").update({ order: ... }).eq("id", id)` | Updates the sort order of a WhyUs reason. | `src/pages/admin/content/WhyUsReasonsManager.tsx` |
| `supabase.from("WhyUsReason").select("id, headline, message").eq("switch", 1).order("order", { ascending: true })` | Fetches all visible Why Us reasons for display on the public Why Us section content column. | `src/sections/WhyUsSection/components/WhyUsContent.tsx` |

---

### Table: `Admin`

| Call | What it does | File |
|------|-------------|------|
| `supabase.from("Admin").select("*").order("order", { ascending: true })` | Fetches all admin directory records for display in the admin dashboard table. | `src/pages/admin/AdminDashboard.tsx` |
| `supabase.from("Admin").insert({...})` | Creates a new admin display record (fullname, username, ismain, switch, order) from the dashboard Add Admin form. Note: the matching Supabase Auth user must be created separately in the dashboard. | `src/pages/admin/AdminDashboard.tsx` |
| `supabase.from("Admin").delete().eq("id", deleteTarget.id)` | Permanently deletes an admin display record. Does not delete the associated Supabase Auth user. | `src/pages/admin/AdminDashboard.tsx` |
| `supabase.from("Admin").select("auth_user_id").eq("id", ADMIN_RECORD_ID).single()` | Checks if the admin record has already been linked to a Supabase Auth user (setup already completed guard). | `src/pages/admin/AdminAuthSetup.tsx` |
| `supabase.from("Admin").update({ auth_user_id: authUserId }).eq("id", ADMIN_RECORD_ID)` | Links the newly created Supabase Auth user UUID to the Admin table record during the one-time setup flow. | `src/pages/admin/AdminAuthSetup.tsx` |
| `supabase.from("Admin").select("*").limit(10)` | Fetches existing admin records during the legacy setup flow to check if seeding is needed. | `src/pages/admin/AdminSetup.tsx` |
| `supabase.from("Admin").insert({...})` | Seeds an initial admin record with a bcrypt password hash if no records exist. Legacy flow — superseded by `AdminAuthSetup.tsx`. | `src/pages/admin/AdminSetup.tsx` |
| `supabase.from("Admin").update({ passwordHash: hash }).eq("id", mainAdmin.id)` | Updates the main admin's bcrypt password hash during the legacy setup flow. Legacy flow — superseded by `AdminAuthSetup.tsx`. | `src/pages/admin/AdminSetup.tsx` |

---

### Table: `Course` — via `OfferingsManager`

| Call | What it does | File |
|------|-------------|------|
| `supabase.from("Course").select("*").order("order", { ascending: true })` | Fetches all courses for the admin Offerings manager (alternate course editor view). | `src/pages/admin/content/OfferingsManager.tsx` |
| `supabase.from("Course").update(fields).eq("id", movedId)` | Updates a course record (full draft or order swap). Called multiple times during reorder. | `src/pages/admin/content/OfferingsManager.tsx` |
| `supabase.from("Course").update({ switch: ... }).eq("id", id)` | Toggles visibility of a course from the Offerings manager. | `src/pages/admin/content/OfferingsManager.tsx` |
| `supabase.from("Course").update({ order: ... }).eq("id", id)` | Updates sort order of a course from the Offerings manager. | `src/pages/admin/content/OfferingsManager.tsx` |

---

## Edge Functions (via `fetch` with Supabase Auth Bearer token)

These are HTTP `fetch` calls to the deployed Supabase Edge Function. They are not made through the Supabase JS client but use the project anon key as a Bearer token in the `Authorization` header.

**Endpoint:** `https://fgfyfxgbsqirdenkwatl.supabase.co/functions/v1/send-email`

| Call | What it does | File |
|------|-------------|------|
| `fetch(EDGE_FN_URL, { method: "POST", headers: { Authorization: "Bearer <anon_key>" }, body: JSON.stringify({ to, subject, html, text }) })` | **Fire-and-forget** — sends a booking confirmation email to the person who submitted the individual booking form. | `src/sections/BookingSection/components/BookingForm.tsx` |
| `fetch(EDGE_FN_URL, { method: "POST", ... })` | **Awaited** — sends a new individual booking notification email to `info@tolr.net` (admin alert). | `src/sections/BookingSection/components/BookingForm.tsx` |
| `fetch(EDGE_FN_URL, { method: "POST", ... })` | **Fire-and-forget** — sends a group rate request confirmation email to the submitter. | `src/sections/BookingSection/components/GroupRateModal.tsx` |
| `fetch(EDGE_FN_URL, { method: "POST", ... })` | **Awaited** — sends a new group rate request notification email to `info@tolr.net` (admin alert). | `src/sections/BookingSection/components/GroupRateModal.tsx` |
| `fetch(EDGE_FN_URL, { method: "POST", ... })` | **Fire-and-forget** — sends a new review notification email to `info@tolr.net` alerting the admin that a public review needs approval. | `src/sections/TestimonialsSection/SubmitReviewModal.tsx` |

---

## Storage

No `supabase.storage.*` API calls are made in the codebase. The video asset in `src/assets.ts` uses a pre-signed Supabase Storage URL directly as a string constant — it does not use the Storage SDK at runtime.

| Asset | Type | File |
|-------|------|------|
| `https://fgfyfxgbsqirdenkwatl.supabase.co/storage/v1/object/sign/tolrBucket/Larry%20TOLR%20Welcome%20Thankyou.mp4?token=...` | Pre-signed video URL — hardcoded string constant, not a runtime SDK call. Used as fallback for `WhyUsMedia`. | `src/assets.ts` |

---

## Realtime

No `supabase.channel(...)`, `supabase.realtime`, or `.on("postgres_changes", ...)` subscriptions are used anywhere in the codebase. All data fetching is on-demand (manual re-fetch after mutations).

---

### Table: `LandingPage` *(added 2026-07-02)*

| Call | What it does | File |
|------|-------------|------|
| `supabase.from("LandingPage").select("*").order("created_at", { ascending: false })` | Fetch all landing pages for the admin list view, sorted newest-first. | `src/pages/admin/content/LandingPagesManager.tsx` *(pending)* |
| `supabase.from("LandingPage").select("id, name, slug, embed_script, iframe_src, is_published").eq("id", id)` | Fetch a single landing page record for the edit form. | `src/pages/admin/content/LandingPagesManager.tsx` *(pending)* |
| `supabase.from("LandingPage").select("iframe_src, name").eq("slug", slug).eq("is_published", true).single()` | Fetch a published page by its URL slug for the public landing page render. | `src/pages/LandingPageView.tsx` *(pending)* |
| `supabase.from("LandingPage").insert([{ name, slug, embed_script, iframe_src, is_published }])` | Create a new landing page record from the admin create form. | `src/pages/admin/content/LandingPagesManager.tsx` *(pending)* |
| `supabase.from("LandingPage").update({ name, slug, embed_script, iframe_src, is_published, updated_at }).eq("id", id)` | Update an existing landing page record from the admin edit form. | `src/pages/admin/content/LandingPagesManager.tsx` *(pending)* |
| `supabase.from("LandingPage").delete().eq("id", id)` | Permanently delete a landing page record after admin confirmation. | `src/pages/admin/content/LandingPagesManager.tsx` *(pending)* |

---

## Summary by Category

| Category | Call Count |
|----------|-----------|
| **Auth** | 9 |
| **Database (DB reads)** | 20 |
| **Database (DB writes — insert)** | 11 |
| **Database (DB writes — update)** | 23 |
| **Database (DB writes — delete)** | 10 |
| **Edge Functions (via fetch)** | 5 |
| **Storage (SDK calls)** | 0 |
| **Realtime** | 0 |
| **Total** | ~78 |

*Last updated: 2026-07-02*
