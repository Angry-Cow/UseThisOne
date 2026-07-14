/**
 * ─── Asset Registry ──────────────────────────────────────────────────────────
 *
 * All image / video / icon paths used in this project are centralised here.
 */

// ── Logo ──────────────────────────────────────────────────────────────────────
export const LOGO_URL =
  "https://c.animaapp.com/mnhhfa3v5Jwbmd/img/uploaded-asset-1775135956982-1.png";

// ── Hero ──────────────────────────────────────────────────────────────────────
export const HERO_BG_URL =
  "https://c.animaapp.com/mnhhfa3v5Jwbmd/img/uploaded-asset-1775135956981-0.jpeg";
/** Alias used by StatsSection (same image until a dedicated stats BG is uploaded) */
export const STATS_BG = HERO_BG_URL;
/** Alias used by any legacy import that references HERO_BG */
export const HERO_BG = HERO_BG_URL;

// ── CTA Section ───────────────────────────────────────────────────────────────
export const CTA_BG_URL =
  "https://heyboss.heeyo.ai/user-assets/mnhhfa3v5Jwbmd/cta-bg.png";

// ── Services Section card images ──────────────────────────────────────────────
export const SERVICE_IMG_FIRST_AID =
  "https://heyboss.heeyo.ai/user-assets/mnhhfa3v5Jwbmd/service-first-aid.png";
export const SERVICE_IMG_AWARENESS =
  "https://heyboss.heeyo.ai/user-assets/mnhhfa3v5Jwbmd/service-awareness.png";
export const SERVICE_IMG_PROTECTION =
  "https://heyboss.heeyo.ai/user-assets/mnhhfa3v5Jwbmd/service-protection.jpg";
export const SERVICE_IMG_TOLR =
  "https://heyboss.heeyo.ai/user-assets/mnhhfa3v5Jwbmd/service-tolr.jpeg";

// ── WhyUs Section ─────────────────────────────────────────────────────────────
export const WHY_US_VIDEO_URL =
  "https://fgfyfxgbsqirdenkwatl.supabase.co/storage/v1/object/sign/tolrBucket/Larry%20TOLR%20Welcome%20Thankyou.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hM2ZkNGI2Ny04MTk5LTQ3MjYtOGQ2ZC1iZTI0ODU2ZjlkOTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ0b2xyQnVja2V0L0xhcnJ5IFRPTFIgV2VsY29tZSBUaGFua3lvdS5tcDQiLCJpYXQiOjE3ODA4MzI2MTIsImV4cCI6MTkzODUxMjYxMn0.mLq1c7ilszrqHLTG6J1BLSGofkaluyWm5DJtQLQAuoo";

// ── OG / Social preview image ────────────────────────────────────────────────
export const OG_IMAGE_URL =
  "https://heyboss.heeyo.ai/user-assets/mnhhfa3v5Jwbmd/og-image.png";

// ── SVG Icons ────────────────────────────────────────────────────────────────
//
// ⭐ MIGRATION NOTE (2026-07-13):
// Icon constants below currently point at the Anima CDN (c.animaapp.com/...).
// As icons are re-uploaded to tolrbucket/Icons/, replace each constant with
// its Supabase public URL using this pattern:
//
//   export const ICON_X = "https://<project>.supabase.co/storage/v1/object/public/tolrbucket/Icons/<filename.svg>";
//
// Upload via: Admin → Resources → Icons tab → drag-drop or click to browse
// Then copy the URL from the Resources grid and paste it here.
// Do NOT update a constant until the file has been confirmed in the bucket.
//
export const ICON_1 = "https://c.animaapp.com/mnhhfa3v5Jwbmd/assets/icon-1.svg";
export const ICON_3 = "https://c.animaapp.com/mnhhfa3v5Jwbmd/assets/icon-3.svg";
export const ICON_4 = "https://c.animaapp.com/mnhhfa3v5Jwbmd/assets/icon-4.svg";
export const ICON_5 = "https://c.animaapp.com/mnhhfa3v5Jwbmd/assets/icon-5.svg";
export const ICON_6 = "https://c.animaapp.com/mnhhfa3v5Jwbmd/assets/icon-6.svg";
export const ICON_7 = "https://c.animaapp.com/mnhhfa3v5Jwbmd/assets/icon-7.svg";
export const ICON_8 = "https://c.animaapp.com/mnhhfa3v5Jwbmd/assets/icon-8.svg";
export const ICON_9 = "https://c.animaapp.com/mnhhfa3v5Jwbmd/assets/icon-9.svg";
export const ICON_10 =
  "https://c.animaapp.com/mnhhfa3v5Jwbmd/assets/icon-10.svg";
export const ICON_11 =
  "https://c.animaapp.com/mnhhfa3v5Jwbmd/assets/icon-11.svg";
export const ICON_12 =
  "https://c.animaapp.com/mnhhfa3v5Jwbmd/assets/icon-12.svg";
export const ICON_14 =
  "https://c.animaapp.com/mnhhfa3v5Jwbmd/assets/icon-14.svg";
export const ICON_15 =
  "https://c.animaapp.com/mnhhfa3v5Jwbmd/assets/icon-15.svg";
