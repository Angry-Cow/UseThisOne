import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from, replyTo } = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // SMTP credentials — set these as Supabase secrets:
    //   supabase secrets set SMTP_USER=info@tolr.net
    //   supabase secrets set SMTP_PASS=your_password_here
    const smtpUser = Deno.env.get("SMTP_USER") ?? "";
    const smtpPass = Deno.env.get("SMTP_PASS") ?? "";
    const smtpHost = Deno.env.get("SMTP_HOST") ?? "webhosting3007.is.cc";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") ?? "465");
    const smtpFrom = Deno.env.get("SMTP_FROM") ?? "info@tolr.net";

    if (!smtpUser || !smtpPass) {
      return new Response(
        JSON.stringify({
          error:
            "SMTP credentials not configured. Set SMTP_USER and SMTP_PASS as Supabase secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: true, // true for port 465 (SSL)
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: from ?? smtpFrom,
      to,
      subject,
      html,
    };
    if (replyTo) mailOptions.replyTo = replyTo;

    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email edge function error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
