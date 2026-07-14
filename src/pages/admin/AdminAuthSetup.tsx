import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const ADMIN_RECORD_ID = "74e390d4-319e-4736-b553-c1cfa9429d5b";

type Step = "idle" | "running" | "done" | "error" | "already_done";

export default function AdminAuthSetup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [message, setMessage] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  // Check if setup already done
  useEffect(() => {
    const check = async () => {
      const { data, error } = await supabase
        .from("Admin")
        .select("auth_user_id")
        .eq("id", ADMIN_RECORD_ID)
        .single();
      if (!error && data?.auth_user_id) {
        setStep("already_done");
        setMessage(
          `Setup already completed. Auth user is linked: ${data.auth_user_id}`,
        );
      }
    };
    check();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setStep("running");
    setLog([]);
    setMessage("");

    try {
      // Step 1: Sign up in Supabase Auth
      addLog("Step 1: Creating Supabase Auth user…");
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            // Skip email confirmation — user is already verified (admin context)
            data: { role: "admin" },
          },
        });

      if (signUpError) {
        // If user already exists, try signing in to get the ID
        if (
          signUpError.message.toLowerCase().includes("already registered") ||
          signUpError.message
            .toLowerCase()
            .includes("already been registered") ||
          signUpError.message.toLowerCase().includes("user already exists")
        ) {
          addLog("Auth user already exists — signing in to retrieve UUID…");
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email: email.trim(),
              password: password.trim(),
            });
          if (signInError) {
            throw new Error(
              `Could not sign in with existing user: ${signInError.message}`,
            );
          }
          const authUserId = signInData.session?.user?.id;
          if (!authUserId)
            throw new Error("Sign-in succeeded but no user ID returned.");
          addLog(`✅ Auth user found: ${authUserId}`);
          await linkAndFinish(authUserId);
          return;
        }
        throw new Error(`Auth signup failed: ${signUpError.message}`);
      }

      const authUserId = signUpData.user?.id;
      if (!authUserId) {
        throw new Error(
          "Signup succeeded but no user ID was returned. Check if email confirmation is required in your Supabase project settings (Authentication → Providers → Email → Confirm email OFF).",
        );
      }
      addLog(`✅ Auth user created: ${authUserId}`);
      await linkAndFinish(authUserId);
    } catch (err: any) {
      setStep("error");
      setMessage(err?.message || "Unknown error occurred.");
      addLog(`❌ Error: ${err?.message}`);
    }
  };

  const linkAndFinish = async (authUserId: string) => {
    // Step 2: Link UUID to Admin record
    addLog("Step 2: Linking auth UUID to Admin record…");
    const { error: updateError } = await supabase
      .from("Admin")
      .update({ auth_user_id: authUserId })
      .eq("id", ADMIN_RECORD_ID);

    if (updateError) {
      throw new Error(
        `Failed to link auth_user_id to Admin record: ${updateError.message}`,
      );
    }
    addLog("✅ Admin record linked successfully.");

    // Step 3: Sign out so user logs in fresh via /admin
    await supabase.auth.signOut();
    addLog("Step 3: ✅ Signed out — redirecting to login…");

    setStep("done");
    setMessage(
      "Setup complete! You can now log in at /admin with your email and password.",
    );
    setTimeout(() => navigate("/admin"), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-600 mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Auth Setup</h1>
          <p className="text-slate-400 text-sm mt-1">
            One-time Supabase Auth user creation
          </p>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          {step === "already_done" && (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-600/20 border border-green-500/40 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-green-400 font-semibold mb-2">
                Already configured
              </p>
              <p className="text-slate-400 text-sm">{message}</p>
              <button
                onClick={() => navigate("/admin")}
                className="mt-6 w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition"
              >
                Go to Login
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-600/20 border border-green-500/40 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-green-400 font-semibold mb-2">
                Setup complete!
              </p>
              <p className="text-slate-400 text-sm">{message}</p>
              <p className="text-slate-500 text-xs mt-3">
                Redirecting to login…
              </p>
            </div>
          )}

          {(step === "idle" || step === "error") && (
            <>
              <p className="text-slate-300 text-sm mb-5">
                Enter the{" "}
                <span className="text-amber-400 font-medium">
                  email and password
                </span>{" "}
                you want to use to log into the admin panel. This runs once — it
                creates your Supabase Auth user and links it automatically.
              </p>

              <form onSubmit={handleSetup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    placeholder="At least 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    placeholder="Repeat password"
                  />
                </div>

                {message && (
                  <div className="flex items-start gap-2 text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
                    <svg
                      className="w-4 h-4 mt-0.5 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  Run Setup
                </button>
              </form>
            </>
          )}

          {step === "running" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                <p className="text-slate-300 text-sm font-medium">
                  Running setup…
                </p>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-400 space-y-1 min-h-[80px]">
                {log.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.startsWith("✅")
                        ? "text-green-400"
                        : line.startsWith("❌")
                          ? "text-red-400"
                          : "text-slate-400"
                    }
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log output after error */}
          {step === "error" && log.length > 0 && (
            <div className="mt-4 bg-slate-900 rounded-lg p-4 font-mono text-xs space-y-1">
              {log.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith("✅")
                      ? "text-green-400"
                      : line.startsWith("❌")
                        ? "text-red-400"
                        : "text-slate-400"
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-700 text-center">
            <p className="text-slate-600 text-xs">
              ⚠️ This page should be visited only once. After setup, navigate to{" "}
              <span className="text-slate-400">/admin</span> to log in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
