import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

const INITIAL_USERNAME = "sasstac_admin";
const INITIAL_PASSWORD = "\\:%HYnE>er-y=)+a";

export default function AdminSetup() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const { data: existing, error: fetchErr } = await supabase
          .from("Admin")
          .select("*")
          .limit(10);

        if (fetchErr) return;

        if (!existing || existing.length === 0) {
          const hash = await bcrypt.hash(INITIAL_PASSWORD, 12);
          await supabase.from("Admin").insert({
            fullName: "Site Administrator",
            username: INITIAL_USERNAME,
            passwordHash: hash,
            isMain: 1,
            switch: 1,
            order: 0,
          });
          return;
        }

        const mainAdmin =
          existing.find((a: any) => a.isMain === 1) || existing[0];
        if (mainAdmin && !String(mainAdmin.passwordHash).startsWith("$2")) {
          const hash = await bcrypt.hash(INITIAL_PASSWORD, 12);
          await supabase
            .from("Admin")
            .update({ passwordHash: hash })
            .eq("id", mainAdmin.id);
        }
      } catch {
        // silently fail — setup is best-effort
      }
    })();
  }, []);

  return null;
}
