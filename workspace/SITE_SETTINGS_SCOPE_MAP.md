# Site Settings & Section Management — Scope Map
> Source-of-truth for SiteSettings + SectionText field keys.
> ✅ ALL keys verified against live source AND `002_site_settings.sql` seed on 2026-07-12.
> SASSTAC must use identical `field_key` values in its own seed.

---

## PART A — SiteSettings Color Tokens (30 columns)

| Column | Description | Default |
|--------|-------------|---------|
| `color_navbar_bg` | Navbar background | `#ffffff` |
| `color_navbar_border` | Navbar bottom border | `#0e7490` |
| `color_navbar_text` | Nav link text | `#1f2937` |
| `color_navbar_active` | Active nav link | `#d97706` |
| `color_brand_primary` | Site name/tagline | `#d97706` |
| `color_btn_primary_bg` | Primary CTA bg | `#d97706` |
| `color_btn_primary_text` | Primary CTA text | `#ffffff` |
| `color_btn_secondary_bg` | Secondary button bg | `rgba(255,255,255,0.1)` |
| `color_btn_secondary_text` | Secondary button text | `#ffffff` |
| `color_btn_nav_bg` | Navbar Book Now bg | `#0c4a6e` |
| `color_btn_nav_text` | Navbar Book Now text | `#ffffff` |
| `color_bg_light` | Light section bg | `#ffffff` |
| `color_bg_alt` | Alt/grey section bg | `#f8fafc` |
| `color_section_eyebrow` | Eyebrow label color | `#0c4a6e` |
| `color_section_heading` | Section h2 | `#0f172a` |
| `color_section_body` | Body/paragraph text | `#6b7280` |
| `color_accent_orange` | Hero h1 line 3 | `#d97706` |
| `color_accent_peach` | Hero h1 line 2 | `#fdba74` |
| `color_footer_bg` | Footer bg | `#0f172a` |
| `color_footer_heading` | Footer column headings | `#d97706` |
| `color_footer_text` | Footer body/links | `rgba(255,255,255,0.6)` |
| `color_footer_copyright` | Copyright line | `rgba(255,255,255,0.4)` |
| `color_faq_eyebrow` | FAQ eyebrow | `#d97706` |
| `color_faq_heading` | FAQ h2 | `#0c4a6e` |
| `color_hero_overlay_start` | Hero gradient start | `rgba(11,74,111,0.4)` |
| `color_hero_overlay_end` | Hero gradient end | `rgba(11,74,111,0.8)` |
| `color_cta_overlay` | CTA overlay | `rgba(12,74,110,0.9)` |
| `color_badge_bg` | Hero badge bg | `#0c4a6e` |
| `color_badge_text` | Hero badge text | `#ffffff` |
| `color_badge_highlight` | Hero badge highlight word | `#fbbf24` |

**SiteSettings also holds:** `navbar_items` (jsonb array of `{label,href}`), `site_name`, `site_tagline`, `navbar_cta_text`, `navbar_cta_href`, `navbar_mobile_cta_text`

---

## PART B — SectionText field_keys (53 rows)

### section: `hero`
| field_key | label | type |
|-----------|-------|------|
| `hero_badge_text` | Star-badge text | text |
| `hero_badge_highlight` | Badge highlight word | text |
| `hero_h1_line1` | Headline line 1 | text |
| `hero_h1_line2` | Headline line 2 | text |
| `hero_h1_line3` | Headline line 3 | text |
| `hero_paragraph` | Body paragraph | textarea |
| `hero_btn1_text` | Primary button text | text |
| `hero_btn1_target` | Primary button scroll target | href |
| `hero_btn2_text` | Secondary button text | text |
| `hero_btn2_target` | Secondary button scroll target | href |
| `hero_image_url` | Hero background image URL | url |

### section: `navbar`
| field_key | label | type |
|-----------|-------|------|
| `navbar_site_name` | Site name | text |
| `navbar_tagline` | Tagline | text |
| `navbar_logo_url` | Logo image URL | url |
| `navbar_cta_button_text` | Book Now text | text |
| `navbar_cta_button_href` | Book Now target | href |
| `navbar_mobile_cta_text` | Mobile CTA text | text |

### section: `services`
| field_key | label | type |
|-----------|-------|------|
| `services_eyebrow` | Eyebrow label | text |
| `services_heading` | Main heading | text |
| `services_subtext` | Description paragraph | textarea |

### section: `whyus`
| field_key | label | type |
|-----------|-------|------|
| `whyus_eyebrow` | Eyebrow label | text |
| `whyus_heading` | Main heading | text |

### section: `testimonials`
| field_key | label | type |
|-----------|-------|------|
| `testimonials_eyebrow` | Eyebrow label | text |
| `testimonials_heading` | Main heading | text |
| `testimonials_subtext` | Body paragraph | textarea |

### section: `courses`
| field_key | label | type |
|-----------|-------|------|
| `courses_eyebrow` | Eyebrow label | text |
| `courses_heading` | Main heading | text |
| `courses_subtext` | Description paragraph | textarea |

### section: `investment`
| field_key | label | type |
|-----------|-------|------|
| `investment_eyebrow` | Eyebrow label | text |
| `investment_heading` | Main heading | text |
| `investment_alert_text` | Alert/notice box text | textarea |

### section: `cta`
| field_key | label | type |
|-----------|-------|------|
| `cta_heading` | Main heading | text |
| `cta_subtext` | Body paragraph | textarea |
| `cta_button_text` | CTA button text | text |
| `cta_button_target` | CTA scroll target | href |

### section: `faq`
| field_key | label | type |
|-----------|-------|------|
| `faq_eyebrow` | Eyebrow label | text |
| `faq_heading` | Main heading | text |
| `faq_intro_text` | Intro paragraph | textarea |
| `faq_link_text` | Inline link label | text |
| `faq_link_target` | Inline link scroll target | href |

### section: `footer`
| field_key | label | type |
|-----------|-------|------|
| `footer_brand_name` | Brand name | text |
| `footer_brand_tagline` | Brand tagline | text |
| `footer_brand_description` | Brand blurb | textarea |
| `footer_logo_url` | Footer logo URL | url |
| `footer_contact_address` | Address line | text |
| `footer_contact_phone` | Phone number | text |
| `footer_contact_email` | Email address | text |
| `footer_contact_hours` | Business hours | text |
| `footer_findus_heading` | "Find Us" heading | text |
| `footer_map_src` | Google Maps embed URL | url |
| `footer_map_caption` | Caption below map | textarea |
| `footer_copyright_text` | Copyright line | text |

---

## PART C — DB Tables Required

| Table | Purpose |
|-------|---------|
| `SiteSettings` | Singleton — 30 color tokens + site identity + navbar_items |
| `SectionText` | Key/value — all 53 section text copy fields |
| `UsefulLink` | Footer "Useful" column items (switch/order convention) |

---

## PART D — Out of Scope (never touched by Site Control)

- Layout, spacing, font family/size/weight
- Individual card content: Services, WhyUs reasons/cards, Reviews, FAQs, Courses, CourseInvestment rows → managed by existing content managers
- BookingForm itself
- StatsSection, TopBar (renders null)
- Routing, page structure, component hierarchy
