import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fgfyfxgbsqirdenkwatl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZnlmeGdic3FpcmRlbmt3YXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzIwOTQsImV4cCI6MjA5NDAwODA5NH0.BEbcW4ChcnxubhRcrizJhXCpxxxhaMlepQC2ENDn9zA";

const isConfigured =
  SUPABASE_URL.startsWith("http") &&
  !SUPABASE_URL.includes("{{") &&
  SUPABASE_ANON_KEY.length > 0 &&
  !SUPABASE_ANON_KEY.includes("{{");

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : (null as unknown as ReturnType<typeof createClient>);
