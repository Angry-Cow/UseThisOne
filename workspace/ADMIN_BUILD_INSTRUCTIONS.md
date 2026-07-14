# Admin Section Build Instructions
## Complete guide to reproduce the full admin panel on a duplicate site

These instructions assume the duplicate site is a React + TypeScript + Tailwind project using the Anima Playground React SDK (`@animaapp/playground-react-sdk`) with `react-router-dom` already installed. The database entities (Course, Service, Offering, Faq, Booking, Admin) must already exist on the target site.

---

## STEP 1 — Install bcryptjs

Paste this in chat:

> Please add `bcryptjs` and `@types/bcryptjs` to package.json dependencies and run npm install.

---

## STEP 2 — Create the password generator utility

Create the file `src/utils/passwordGenerator.ts` with this exact content:

```ts
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '*@#+%';
const ALL = LOWERCASE + UPPERCASE + NUMBERS + SYMBOLS;

export function generatePassword(length = 16): string {
  const arr: string[] = [];
  arr.push(LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)]);
  arr.push(UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)]);
  arr.push(NUMBERS[Math.floor(Math.random() * NUMBERS.length)]);
  arr.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
  for (let i = arr.length; i < length; i++) {
    arr.push(ALL[Math.floor(Math.random() * ALL.length)]);
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}
```

---

## STEP 3 — Create AdminSetup (seeds the initial admin account)

**IMPORTANT:** Before pasting, replace `YOUR_SITE_PREFIX` in the sessionStorage keys and `YOUR_ADMIN_USERNAME` / `YOUR_INITIAL_PASSWORD` with the values appropriate for your site. On TOLR these are `tolr_admin_id`, `tolr_admin_name`, `tolr_admin`, and `OD%8giW?;]dK2LYH`.

Create `src/pages/admin/AdminSetup.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { useLazyQuery, useMutation } from '@animaapp/playground-react-sdk';
import bcrypt from 'bcryptjs';

const INITIAL_USERNAME = 'YOUR_ADMIN_USERNAME';
const INITIAL_PASSWORD = 'YOUR_INITIAL_PASSWORD';

export default function AdminSetup() {
  const { query } = useLazyQuery('Admin');
  const { create, update } = useMutation('Admin');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const existing = await query({});
        if (!existing || existing.length === 0) {
          const hash = await bcrypt.hash(INITIAL_PASSWORD, 12);
          await create({
            fullName: 'Site Administrator',
            username: INITIAL_USERNAME,
            passwordHash: hash,
            isMain: 1,
            switch: 1,
            order: 0,
          });
          return;
        }
        const mainAdmin = existing.find((a: any) => a.isMain === 1) || existing[0];
        if (mainAdmin && !mainAdmin.passwordHash.startsWith('$2')) {
          const hash = await bcrypt.hash(INITIAL_PASSWORD, 12);
          await update(mainAdmin.id, { passwordHash: hash });
        }
      } catch {
        // silently fail
      }
    })();
  }, []);

  return null;
}
```

---

## STEP 4 — Create AdminLogin page

**IMPORTANT:** Replace `YOUR_SITE_PREFIX` with your site prefix (e.g. `tolr`) in the two `sessionStorage.setItem` calls and in the brand heading text.

Create `src/pages/admin/AdminLogin.tsx`:

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLazyQuery } from '@animaapp/playground-react-sdk';
import bcrypt from 'bcryptjs';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { query } = useLazyQuery('Admin');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const results = await query({ where: { username, switch: 1 } });
      if (!results || results.length === 0) {
        setError('Invalid username or password.');
        setLoading(false);
        return;
      }
      const admin = results[0];
      const match = await bcrypt.compare(password, admin.passwordHash);
      if (!match) {
        setError('Invalid username or password.');
        setLoading(false);
        return;
      }
      sessionStorage.setItem('YOUR_SITE_PREFIX_admin_id', admin.id);
      sessionStorage.setItem('YOUR_SITE_PREFIX_admin_name', admin.fullName);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Site Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Administration Panel</p>
        </div>
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-6">Sign In</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                placeholder="Enter username" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                placeholder="Enter password" />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

---

## STEP 5 — Create AdminUI shared component kit

Create `src/pages/admin/components/AdminUI.tsx` with this complete content. This is the shared UI kit used by all managers — do not modify it:

```tsx
import React, { useState, useRef } from 'react';

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 py-8 overflow-y-auto" onClick={onClose}>
      <div className={`bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} my-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export const inputCls = 'w-full px-3 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm';
export const textareaCls = inputCls + ' resize-y min-h-[80px]';

export function Toggle({ value, onChange, label }: { value: number; onChange: (v: number) => void; label?: string }) {
  const on = value === 1;
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(on ? 0 : 1)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${on ? 'bg-amber-600' : 'bg-slate-600'}`}
        role="switch" aria-checked={on}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
      {label && <span className="text-sm text-slate-300">{label}: <span className={on ? 'text-green-400' : 'text-slate-500'}>{on ? 'Visible' : 'Hidden'}</span></span>}
    </div>
  );
}

export function ChipInput({ chips, onChange, placeholder = 'Type and press Enter…' }: { chips: string[]; onChange: (chips: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const addChip = () => { const val = input.trim(); if (val && !chips.includes(val)) onChange([...chips, val]); setInput(''); };
  const removeChip = (idx: number) => onChange(chips.filter((_, i) => i !== idx));
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addChip(); }
    else if (e.key === 'Backspace' && !input && chips.length > 0) onChange(chips.slice(0, -1));
  };
  return (
    <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-700 border border-slate-600 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition min-h-[44px] cursor-text" onClick={() => ref.current?.focus()}>
      {chips.map((chip, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-600/20 border border-amber-700/50 text-amber-300 text-xs font-medium">
          {chip}
          <button type="button" onClick={(e) => { e.stopPropagation(); removeChip(i); }} className="text-amber-400 hover:text-white transition ml-0.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </span>
      ))}
      <input ref={ref} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} onBlur={addChip}
        placeholder={chips.length === 0 ? placeholder : ''}
        className="bg-transparent text-white text-sm placeholder-slate-400 focus:outline-none flex-1 min-w-[120px] py-0.5 px-1" />
    </div>
  );
}

export function ImagePicker({ value, onChange, label = 'Image' }: { value: string; onChange: (url: string) => void; label?: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('https://heyboss.heeyo.ai/api/upload-asset', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const url: string = data.url ?? data.assetUrl ?? data.fileUrl ?? '';
      if (!url) throw new Error('No URL returned');
      onChange(url);
    } catch {
      onChange(URL.createObjectURL(file));
      setError('Upload to CDN failed — using local preview. Save may not persist across sessions.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <div className="flex gap-3 items-start">
        <div className="w-24 h-20 rounded-lg bg-slate-700 border border-slate-600 overflow-hidden shrink-0 flex items-center justify-center">
          {value ? <img src={value} alt="preview" className="w-full h-full object-cover" /> : (
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          )}
        </div>
        <div className="flex-1">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" id="img-upload" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-sm text-slate-300 hover:text-white transition disabled:opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            {uploading ? 'Uploading…' : 'Upload Image'}
          </button>
          <p className="text-xs text-slate-500 mt-1.5">Or paste a URL below:</p>
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://example.com/image.jpg" className={inputCls + ' mt-1'} />
          {error && <p className="text-xs text-amber-400 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export function OrderInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition text-sm">−</button>
      <input type="number" value={value} min={0} onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 text-center px-2 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      <button type="button" onClick={() => onChange(value + 1)} className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition text-sm">+</button>
    </div>
  );
}

export function StatusBadge({ on }: { on: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${on ? 'bg-green-900/40 text-green-300 border-green-700/60' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-green-400' : 'bg-slate-500'}`} />
      {on ? 'Visible' : 'Hidden'}
    </span>
  );
}

export function FlashBanner({ msg, type = 'success' }: { msg: string; type?: 'success' | 'error' }) {
  if (!msg) return null;
  const cls = type === 'success' ? 'bg-green-900/40 border-green-700 text-green-300' : 'bg-red-900/40 border-red-700 text-red-300';
  const icon = type === 'success'
    ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    : <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />;
  return (
    <div className={`flex items-center gap-2 border rounded-lg px-4 py-3 text-sm mb-4 ${cls}`}>
      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">{icon}</svg>
      {msg}
    </div>
  );
}

export function DeleteConfirmModal({ name, onCancel, onConfirm, loading }: { name: string; onCancel: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <Modal title="Confirm Delete" onClose={onCancel}>
      <p className="text-slate-300 text-sm mb-6">Are you sure you want to delete <span className="text-white font-semibold">{name}</span>? This cannot be undone.</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition border border-slate-600">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold transition">{loading ? 'Deleting…' : 'Yes, Delete'}</button>
      </div>
    </Modal>
  );
}
```

---

## STEP 6 — Create AdminShell (sidebar + top-bar layout wrapper)

**IMPORTANT:** Replace `YOUR SITE NAME` in the header h1 text. Replace `YOUR_SITE_PREFIX` in the two `sessionStorage.removeItem` calls and `sessionStorage.getItem`. The NAV_ITEMS array below includes all 6 sections — adjust labels if your site uses different names.

Create `src/pages/admin/components/AdminShell.tsx`:

```tsx
import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const NAV_ITEMS = [
  {
    label: 'Administrators',
    path: '/admin/dashboard',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    label: 'Courses',
    path: '/admin/content/courses',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
  {
    label: 'Services',
    path: '/admin/content/services',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  },
  {
    label: 'Offerings',
    path: '/admin/content/offerings',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    label: 'FAQs',
    path: '/admin/content/faqs',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    label: 'Bookings',
    path: '/admin/content/bookings',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const adminName = sessionStorage.getItem('YOUR_SITE_PREFIX_admin_name');

  const handleLogout = () => {
    sessionStorage.removeItem('YOUR_SITE_PREFIX_admin_id');
    sessionStorage.removeItem('YOUR_SITE_PREFIX_admin_name');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-slate-900 font-inter flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <div>
            <h1 className="text-white font-bold leading-tight text-sm sm:text-base">YOUR SITE NAME Admin</h1>
            <p className="text-slate-400 text-xs">Administration Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm hidden md:block">Signed in as <span className="text-amber-400 font-medium">{adminName}</span></span>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-slate-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <nav className="bg-slate-800 border-r border-slate-700 w-14 sm:w-48 shrink-0 flex flex-col py-4">
          <div className="px-2 sm:px-3 mb-2">
            <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold hidden sm:block px-2 mb-1">Navigation</p>
          </div>
          <ul className="space-y-0.5 px-2">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link to={item.path} title={item.label}
                    className={`flex items-center gap-3 px-2 sm:px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${active ? 'bg-amber-600/20 text-amber-400 border border-amber-700/40' : 'text-slate-400 hover:text-white hover:bg-slate-700/60'}`}>
                    <span className="shrink-0">{item.icon}</span>
                    <span className="hidden sm:block truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto px-2 pt-4 border-t border-slate-700/60">
            <a href="/" target="_blank" rel="noopener noreferrer" title="View Site"
              className="flex items-center gap-3 px-2 sm:px-3 py-2.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              <span className="hidden sm:block">View Site</span>
            </a>
          </div>
        </nav>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
```

---

## STEP 7 — Create AdminDashboard (admin accounts manager)

**IMPORTANT:** Replace `YOUR_SITE_PREFIX` in the two `sessionStorage.getItem` calls.

Create `src/pages/admin/AdminDashboard.tsx` — paste the full content from the TOLR site's file. The only lines to change are:
- Line: `const adminId = sessionStorage.getItem('tolr_admin_id');` → change `tolr_admin_id` to `YOUR_SITE_PREFIX_admin_id`
- The brand text `T.O.L.R.™ Admin` in the flash message area (optional cosmetic)

The rest of the file is identical and requires no changes.

---

## STEP 8 — Create the 5 content manager pages

Each file goes in `src/pages/admin/content/`. Copy each file verbatim from the TOLR site. No substitutions are needed in the content managers — they use `sessionStorage.getItem('tolr_admin_id')` only for the auth guard redirect, and the entity names (Course, Service, Offering, Faq, Booking) are the same on both sites.

Files to copy:
- `src/pages/admin/content/CoursesManager.tsx`
- `src/pages/admin/content/ServicesManager.tsx`
- `src/pages/admin/content/OfferingsManager.tsx`
- `src/pages/admin/content/FaqsManager.tsx`
- `src/pages/admin/content/BookingsManager.tsx`

**One substitution needed in all 5 files:** Find `sessionStorage.getItem('tolr_admin_id')` and replace with `sessionStorage.getItem('YOUR_SITE_PREFIX_admin_id')`.

**Note on CoursesManager and ServicesManager:** These files import live site components for the preview panel (`CourseCard`, `ServiceCard`, `CourseInvestmentItem`). Those components must exist at the same paths on the target site. If they do not, remove the preview panel section from the modal (the right-side `lg:w-72` / `lg:w-64` / `lg:w-80` div).

---

## STEP 9 — Wire all routes in App.tsx

In the target site's `App.tsx`, add these imports at the top (after existing imports):

```tsx
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminSetup from "@/pages/admin/AdminSetup";
import CoursesManager from "@/pages/admin/content/CoursesManager";
import ServicesManager from "@/pages/admin/content/ServicesManager";
import OfferingsManager from "@/pages/admin/content/OfferingsManager";
import FaqsManager from "@/pages/admin/content/FaqsManager";
import BookingsManager from "@/pages/admin/content/BookingsManager";
```

Inside the `<BrowserRouter>` wrapper (or wherever routes are defined), add `<AdminSetup />` as a global component rendered outside `<Routes>`, then add these `<Route>` entries inside `<Routes>`:

```tsx
<AdminSetup />
<Routes>
  {/* ... existing routes ... */}
  <Route path="/admin" element={<AdminLogin />} />
  <Route path="/admin/dashboard" element={<AdminDashboard />} />
  <Route path="/admin/content/courses" element={<CoursesManager />} />
  <Route path="/admin/content/services" element={<ServicesManager />} />
  <Route path="/admin/content/offerings" element={<OfferingsManager />} />
  <Route path="/admin/content/faqs" element={<FaqsManager />} />
  <Route path="/admin/content/bookings" element={<BookingsManager />} />
</Routes>
```

If the app is not already wrapped in `<BrowserRouter>`, wrap the entire return of your root component with it.

---

## STEP 10 — Add the Admin Login link to the site UI (optional)

If the site has a TopBar or Navbar component where you want a discreet login link, add this somewhere appropriate:

```tsx
<a href="/admin" className="text-xs text-slate-400 hover:text-white transition">Admin</a>
```

---

## STEP 11 — Verify

1. Navigate to `/admin` — you should see the login screen
2. Log in with the initial credentials set in AdminSetup (INITIAL_USERNAME / INITIAL_PASSWORD)
3. Confirm the sidebar shows: Administrators, Courses, Services, Offerings, FAQs, Bookings
4. Test creating, editing, and deleting one record in each section
5. Change the admin password immediately after first login via the "Reset PW" button

---

## Key things that differ per site (substitution checklist)

| What to change | Where | From (TOLR value) | To |
|---|---|---|---|
| sessionStorage key prefix | AdminSetup, AdminLogin, AdminDashboard, AdminShell, all 5 managers | `tolr` | your site prefix |
| INITIAL_USERNAME | AdminSetup.tsx | `tolr_admin` | your chosen username |
| INITIAL_PASSWORD | AdminSetup.tsx | `OD%8giW?;]dK2LYH` | a new strong password |
| Brand name in header | AdminShell.tsx | `T.O.L.R.™ Admin` | your site name |
| Brand name in login | AdminLogin.tsx | `T.O.L.R.™ Admin` | your site name |
| Preview component imports | CoursesManager, ServicesManager, OfferingsManager | site-specific paths | target site paths |

---

---

---

## Phase: Course+Offering Table Merge

> **Audience:** SASSTAC developer replicating this change on the sister site.
> **Purpose:** This section documents the complete refactor that unified the `Offering` and `Course` database tables into a single `Course` table so that one admin record drives both the course card UI (CoursesSection) and the course investment list UI (BookingSection/CourseInvestmentList). Follow the steps below in order.

---

### Background — Why the tables were merged

Both `Course` and `Offering` described the same 9 training programs. `Offering` held pricing/CTA data (`price`, `priceNote`, `duration`, `button1Text`, `button2Text`) while `Course` held card-level data (`title`, `category`, `description`, `features`, `buttonText`). Maintaining two records per program created a dual-entry burden and a risk of drift between tables. The solution: extend `Course` with the two Offering-only fields and point every consumer at `Course`.

---

### 1. Final unified Course schema

Every `Course` row now carries these fields. This is the authoritative column list for both sites.

| Field | Type | Default | Owner | Purpose |
|---|---|---|---|---|
| `id` | string (UUID) | auto | system | Primary key |
| `createdAt` | Date | auto | system | Creation timestamp |
| `updatedAt` | Date | auto | system | Last-update timestamp |
| `switch` | number | `1` | CoursesManager / OfferingsManager | Visibility toggle (1 = visible, 0 = hidden). Single source of truth for both views. |
| `order` | number | auto | CoursesManager / OfferingsManager | Manual sort position, lower = first. Single source of truth for both views. |
| `title` | string | — | CoursesManager | Course name as shown in cards, dropdowns, and investment list headers. |
| `category` | string | `'First Aid'` | CoursesManager | Filter category: `'First Aid'`, `'Personal Defense'`, or `'Personal Awareness'`. |
| `price` | string | — | CoursesManager / OfferingsManager | Display price string, e.g. `'$125'`. |
| `priceNote` | string? | — | CoursesManager / OfferingsManager | Optional qualifier, e.g. `'per person'`. |
| `duration` | string | — | CoursesManager / OfferingsManager | Long-form scheduling note displayed in the investment list, e.g. `'4 Hours • Contact us to arrange a class'`. |
| `description` | string | — | CoursesManager | Course description paragraph shown on course cards. |
| `features` | string | — | CoursesManager | Comma-separated or JSON-array string of feature bullet points shown on course cards. |
| `buttonText` | string | `'Contact Us Now To Schedule'` | CoursesManager | CTA label on the course card "Book" button. |
| `button1Text` | string? | `'Contact Now'` | CoursesManager / OfferingsManager | Primary CTA label on the Course Investment list item. If absent, UI defaults to `'Contact Now'`. |
| `button2Text` | string? | `'Group Rate'` | CoursesManager / OfferingsManager | Secondary CTA label (opens GroupRateModal). If absent, UI defaults to `'Group Rate'`. |

**To add these two columns to a fresh Course entity**, send this message in chat:

> "Please add `button1Text` (optional string, default 'Contact Now') and `button2Text` (optional string, default 'Group Rate') to the Course entity using `backend_database_patch_entities`."

---

### 2. Query patterns per consumer

Every site component that reads Course data is documented here so you know exactly what filter each one applies.

#### CoursesSection (`src/sections/CoursesSection/index.tsx`)
```ts
useQuery('Course', { where: { switch: 1 }, orderBy: { order: 'asc' } })
```
Maps: `title`, `price`, `priceNote`, `features`, `description`, `buttonText`, `category`.
Falls back to a static COURSES array if no DB records are returned.

#### CourseInvestmentList (`src/sections/BookingSection/components/CourseInvestmentList.tsx`)
```ts
useQuery('Course', { where: { switch: 1 }, orderBy: { order: 'asc' } })
```
Maps: `title`, `duration`, `price`, `priceNote`, `button1Text` (falls back to `'Contact Now'`).
Falls back to a `FALLBACK_COURSES` static array with the same field names.

#### BookingForm dropdown (`src/sections/BookingSection/components/BookingForm.tsx`)
```ts
useQuery('Course', { where: { switch: 1 }, orderBy: { order: 'asc' } })
```
Each `<option>` renders:
```tsx
<option key={opt.value} value={opt.value}>{opt.label}</option>
// where:
//  opt.value = c.title   (stored in Booking.course field)
//  opt.label = c.price ? `${c.title} — ${c.price}` : c.title
```
Falls back to `FALLBACK_COURSE_OPTIONS: { value: string; label: string }[]` (title-only labels).

#### GroupRateModal (`src/sections/BookingSection/components/GroupRateModal.tsx`)
```ts
useQuery('Course', { where: { switch: 1 }, orderBy: { order: 'asc' } })
```
Maps only `c.title` to build the COURSES string array for the dropdown.
Falls back to `FALLBACK_COURSES: string[]`.

#### CoursesManager (`src/pages/admin/content/CoursesManager.tsx`)
```ts
useQuery('Course', { orderBy: { order: 'asc' } })   // no switch filter — shows all
useMutation('Course')  // create, update, remove
```
Writes all course-card fields: `title`, `category`, `price`, `priceNote`, `duration`, `description`, `features`, `buttonText`, `button1Text`, `button2Text`, `switch`, `order`.

#### OfferingsManager (`src/pages/admin/content/OfferingsManager.tsx`)
```ts
useQuery('Course', { where: { switch: undefined }, orderBy: { order: 'asc' } })  // all records
useMutation('Course')  // update only (no create/remove in this view)
```
Writes only investment fields: `price`, `priceNote`, `duration`, `button1Text`, `button2Text`, `switch`, `order`. `title` is read-only in this view — edits must be made in CoursesManager.

---

### 3. Data migration logic (one-time, already run on TOLR)

If the sister site's `Course` rows already exist but `button1Text` / `button2Text` are empty, run this migration via `backend_database_write_data`. For each Course row set:

```
button1Text = "Contact Now"
button2Text = "Group Rate"
```

If the sister site still has an `Offering` table with custom button labels per course (i.e. not all "Contact Now" / "Group Rate"), match Offering → Course by `title` and copy the button values over before removing the Offering table reference.

**Practical chat command to seed defaults in bulk:**

> "For every Course record that has an empty or null `button1Text`, set `button1Text = 'Contact Now'` and `button2Text = 'Group Rate'`. Use `backend_database_write_data` to update each record."

If you have custom per-course button labels in an Offering table, first query:

```
backend_database_query_data(entity: "Offering")
```

Then for each result, find the matching Course by title and run an update.

---

### 4. BookingForm dropdown label change

**Before the merge**, the dropdown was:
```tsx
<option key={c.title} value={c.title}>{c.title}</option>
```

**After the merge**, the dropdown renders:
```tsx
<option key={opt.value} value={opt.value}>{opt.label}</option>
// opt.value = c.title  → stored in Booking.course (plain course name, unchanged)
// opt.label = c.price ? `${c.title} — ${c.price}` : c.title
```

**Why `value={c.title}` and not the full label:** Booking records store the raw course name ("Stop The Bleed") in `Booking.course`. If we stored the label string it would break existing bookings and filtering in BookingsManager. The price is decorative — display only.

**Fallback array update:** The old `FALLBACK_COURSES: string[]` was replaced with:
```ts
const FALLBACK_COURSE_OPTIONS: CourseOption[] = [
  { value: 'Stop The Bleed', label: 'Stop The Bleed' },
  // ... one entry per course, value = title, label = title (no price in fallback)
];
```
Fallback labels drop the price because without a DB connection the price would be stale.

---

### 5. Files changed — step-by-step checklist for SASSTAC replication

Work through this list top to bottom. Each item is a discrete, testable change.

**Schema & Database**
- [ ] `backend_database_patch_entities`: Add `button1Text` (optional string, default `'Contact Now'`) and `button2Text` (optional string, default `'Group Rate'`) to the `Course` entity
- [ ] `backend_database_write_data`: For every existing Course row, set `button1Text = 'Contact Now'` and `button2Text = 'Group Rate'` (or copy from Offering if custom)
- [ ] Confirm via `backend_database_query_data(entity: 'Course')` that all 9 rows have both fields populated

**Admin panel — CoursesManager** (`src/pages/admin/content/CoursesManager.tsx`)
- [ ] Extend `CourseDraft` type to include `button1Text: string` and `button2Text: string`
- [ ] Add both fields to `blankDraft()` with defaults `'Contact Now'` and `'Group Rate'`
- [ ] Add two new `<Field>` inputs inside `CourseEditModal` (in a `grid-cols-2` row) labelled "Investment CTA (Primary)" and "Investment CTA (Secondary)"
- [ ] In the Edit row `onClick`, pass `button1Text: course.button1Text ?? 'Contact Now'` and `button2Text: course.button2Text ?? 'Group Rate'` into the draft

**Admin panel — OfferingsManager** (`src/pages/admin/content/OfferingsManager.tsx`)
- [ ] Change `useQuery('Offering', ...)` → `useQuery('Course', { where: { switch: undefined }, orderBy: { order: 'asc' } })`
- [ ] Change `useMutation('Offering')` → `useMutation('Course')` (keep only `update`, remove `create` and `remove` calls)
- [ ] Remove "Add Offering" button from header
- [ ] Make `title` field read-only in the modal (display as a styled div, not an input)
- [ ] Add info banner in the page header linking to `/admin/content/courses` for title/category edits
- [ ] Add a "Buttons" column to the table showing `button1Text` and `button2Text` as amber/slate chips

**Front-end — CourseInvestmentList** (`src/sections/BookingSection/components/CourseInvestmentList.tsx`)
- [ ] Change `useQuery('Offering', ...)` → `useQuery('Course', { where: { switch: 1 }, orderBy: { order: 'asc' } })`
- [ ] Update mapping: pass `button1Text ?? 'Contact Now'` to `buttonText` prop instead of old Offering field name
- [ ] Update `FALLBACK_COURSES` static array to use `button1Text`/`button2Text` field names (same values)

**Front-end — BookingForm dropdown** (`src/sections/BookingSection/components/BookingForm.tsx`)
- [ ] Replace `FALLBACK_COURSES: string[]` with `FALLBACK_COURSE_OPTIONS: CourseOption[]` (objects with `value` and `label` keys)
- [ ] Update `<option>` render to use `opt.value` and `opt.label`
- [ ] Update DB-driven option mapping to produce `label: c.price ? \`${c.title} — ${c.price}\` : c.title`
- [ ] Set `INITIAL.course = ''` and add `<option value="" disabled>Select a course…</option>` as the first option

**Front-end — GroupRateModal** (`src/sections/BookingSection/components/GroupRateModal.tsx`)
- [ ] Remove static `COURSES` string array (or keep as `FALLBACK_COURSES`)
- [ ] Add `useQuery('Course', { where: { switch: 1 }, orderBy: { order: 'asc' } })`
- [ ] Build runtime `COURSES` from `dbCourses?.map(c => c.title) ?? FALLBACK_COURSES`

**Admin panel — AdminShell sidebar** (`src/pages/admin/components/AdminShell.tsx`)
- [ ] **Keep** the "Offerings" nav item in `NAV_ITEMS` — it points to `/admin/content/offerings` (OfferingsManager) and remains accessible from the sidebar as the dedicated investment-fields editor. Do **not** remove it.

**Verify**
- [ ] All 9 courses visible in CoursesSection grid with correct category filters
- [ ] All 9 investment items visible in CourseInvestmentSection with prices and CTA buttons
- [ ] BookingForm dropdown shows `Title — $Price` labels; stored `Booking.course` value is plain title
- [ ] GroupRateModal dropdown lists all 9 visible courses
- [ ] OfferingsManager table lists all courses (visible + hidden); editing price/buttons saves to Course
- [ ] CoursesManager let you edit title, category, description, features, all CTA fields in one form
- [ ] No console errors on any admin or public page

---

## Notes on the Booking entity

The Booking entity requires these fields to exist in the database schema:
`contacted` (string, default 'no'), `scheduled` (string, default 'no'), `paid` (string, default 'no'), `completed` (string, default 'no'), `adminNotes` (string, optional).

If these fields do not exist on the target site's Booking table, ask the AI assistant to add them before creating the BookingsManager file, using this message:

> "Please add the following fields to the Booking entity: contacted (string, default 'no'), scheduled (string, default 'no'), paid (string, default 'no'), completed (string, default 'no'), adminNotes (optional string). These are admin CRM tracking fields."
