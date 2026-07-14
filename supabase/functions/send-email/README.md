# send-email Edge Function

Sends a notification email when a new review is submitted on the TOLR site.

## Transport: Resend

This function uses [Resend](https://resend.com) — a simple HTTP email API.  
Free tier: **100 emails/day**, no credit card required.

---

## One-Time Setup

### 1. Create a Resend account
Go to [resend.com](https://resend.com) and sign up.

### 2. Get your API key
Dashboard → API Keys → Create API Key.  
It will look like: `re_xxxxxxxxxxxxxxxx`

### 3. Choose a From address
- **For testing (no domain setup needed):** use `onboarding@resend.dev`
- **For production:** add and verify your domain at Resend → Domains, then use `noreply@yourdomain.com`

### 4. Save secrets in Supabase
Go to: **Supabase Dashboard → Project Settings → Edge Functions → Secrets**

Add these three secrets:

| Secret name      | Example value                  |
|-----------------|-------------------------------|
| `RESEND_API_KEY` | `re_abc123...`                 |
| `MAIL_FROM`      | `noreply@tolr.net` or `onboarding@resend.dev` |
| `MAIL_TO`        | `your-inbox@example.com`       |

### 5. Re-deploy the function
```bash
supabase functions deploy send-email
```

### 6. Update the anon key in SubmitReviewModal.tsx
The `SUPABASE_ANON_KEY` constant must be the **JWT** from:  
**Supabase Dashboard → Project Settings → API → Project API Keys → anon / public**

It must start with `eyJ...` and be ~220 characters long.

---

## Testing

You can test the function directly with curl:

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer <your-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Test","html":"<p>Hello!</p>","text":"Hello!"}'
```

Expected response: `{"ok":true}`
