# Smart Bookmark App

A simple, real-time bookmark manager built with **Next.js (App Router)**, **Supabase** (Auth, Database, Realtime), and **Tailwind CSS**.

![Smart Bookmark App](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![Supabase](https://img.shields.io/badge/Supabase-Auth%20%7C%20DB%20%7C%20Realtime-green?logo=supabase) ![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-v4-blue?logo=tailwindcss)

## Features

- **Google OAuth** — Sign up and log in using Google (no email/password)
- **Add Bookmarks** — Save any URL with a title
- **Private Bookmarks** — Each user can only see their own bookmarks (Row Level Security)
- **Real-time Updates** — Bookmarks sync instantly across all open tabs without page refresh
- **Delete Bookmarks** — Remove bookmarks you no longer need
- **Beautiful UI** — Clean, modern interface with glassmorphism effects and smooth animations
- **Dark Mode** — Automatic dark mode support based on system preference

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | Full-stack React framework |
| Supabase Auth | Google OAuth authentication |
| Supabase Database | PostgreSQL for bookmark storage |
| Supabase Realtime | Live updates via WebSocket subscriptions |
| Tailwind CSS v4 | Utility-first styling |
| TypeScript | Type safety |

## Setup Instructions

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/bookmark.git
cd bookmark
npm install
```

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Project URL** and **anon/public key** from Settings > API
3. Create a `.env.local` file (use `.env.example` as template):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Database Setup

Go to **SQL Editor** in your Supabase Dashboard and run the contents of `supabase-schema.sql`. This will:
- Create the `bookmarks` table
- Enable Row Level Security (RLS)
- Create policies so users can only access their own bookmarks
- Enable Realtime for the bookmarks table

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Go to **APIs & Services > Credentials**
4. Create an **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URI:
   - For local: `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
   - For production: same Supabase callback URL (Supabase handles the redirect)
6. Copy the **Client ID** and **Client Secret**
7. In Supabase Dashboard: go to **Authentication > Providers > Google**
8. Enable Google provider and paste your Client ID and Client Secret

### 5. Supabase Site URL Configuration

1. In Supabase Dashboard: **Authentication > URL Configuration**
2. Set **Site URL** to:
   - Local: `http://localhost:3000`
   - Production: your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-app.vercel.app/auth/callback`

### 6. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 7. Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!
5. **Important:** Update your Supabase Site URL and Redirect URLs to use your Vercel domain

---

## Problems Encountered & Solutions

### 1. OAuth Redirect Loop / "Missing code parameter"

**Problem:** After signing in with Google, the app redirected back to the login page instead of completing authentication. The OAuth callback wasn't receiving the `code` parameter.

**Solution:** The issue was that the Supabase **Site URL** and **Redirect URLs** were not configured correctly. In Supabase Dashboard → Authentication → URL Configuration:
- Set the Site URL to match the app's deployment URL exactly
- Added both `http://localhost:3000/auth/callback` and the production URL to the Redirect URLs list

### 2. Realtime Not Triggering / Bookmarks Not Syncing Across Tabs

**Problem:** After adding a bookmark in one tab, it didn't appear in another open tab. The Supabase Realtime subscription was set up but wasn't receiving events.

**Solution:** Two things were needed:
1. Run `ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;` in the SQL Editor to enable Realtime replication for the bookmarks table
2. Make sure the Realtime subscription filters only show bookmarks belonging to the current user (to respect privacy/RLS). Note that Realtime bypasses RLS on the broadcast level, so we filter in the client callback.

### 3. Row Level Security (RLS) Blocking All Queries

**Problem:** After enabling RLS on the bookmarks table, all queries returned empty arrays, even for logged-in users.

**Solution:** RLS was enabled but no policies were created yet. Each CRUD operation needs its own policy:
- `SELECT` policy using `auth.uid() = user_id`
- `INSERT` policy with `WITH CHECK (auth.uid() = user_id)`
- `DELETE` policy using `auth.uid() = user_id`

Without these policies, RLS blocks everything by default — which is secure but confusing if you forget to add them.

### 4. Cookies / Session Not Persisting in Server Components

**Problem:** The user appeared logged in on the client but `getUser()` returned null in Server Components, causing a flash of the landing page on refresh.

**Solution:** Implemented middleware (`src/middleware.ts`) that refreshes the Supabase auth session on every request using `@supabase/ssr`. The middleware reads and writes cookies to keep the session alive, which is essential for Server Components to access the authenticated user.

### 5. Duplicate Bookmarks Appearing on INSERT

**Problem:** When adding a bookmark, it appeared twice in the list — once from the optimistic form reset and once from the Realtime INSERT event.

**Solution:** Added a deduplication check in the Realtime INSERT handler:
```typescript
setBookmarks((prev) => {
  if (prev.some((b) => b.id === payload.new.id)) return prev;
  return [payload.new as Bookmark, ...prev];
});
```

### 6. Next.js App Router + Supabase SSR Cookie Handling

**Problem:** `cookies()` from `next/headers` throws an error when `setAll` is called from a Server Component (not a Route Handler or Server Action).

**Solution:** Wrapped the `setAll` call in a try-catch block. This is expected behavior — cookies can only be set in Route Handlers, Server Actions, and Middleware. The middleware handles session refresh, so the Server Component error can be safely ignored.

### 7. Tailwind CSS v4 Configuration Differences

**Problem:** Tailwind CSS v4 uses a different configuration approach than v3. The `tailwind.config.ts` file approach doesn't work the same way.

**Solution:** Tailwind v4 uses CSS-first configuration with `@import "tailwindcss"` and `@theme inline {}` blocks for custom theme values. Custom colors and fonts are defined directly in CSS using CSS custom properties, which is cleaner and more native.

---

## Project Structure

```
src/
├── app/
│   ├── auth/callback/route.ts  # OAuth callback handler
│   ├── error/page.tsx           # Error page
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page (landing + dashboard)
├── components/
│   ├── AuthButton.tsx           # Google sign-in/out button
│   ├── BookmarkForm.tsx         # Add bookmark form
│   ├── BookmarkItem.tsx         # Individual bookmark card
│   └── BookmarkList.tsx         # Bookmark list with realtime
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   ├── middleware.ts        # Middleware Supabase client
│   │   └── server.ts            # Server Supabase client
│   └── types.ts                 # TypeScript interfaces
├── middleware.ts                 # Next.js middleware for auth
supabase-schema.sql              # Database schema SQL
```

