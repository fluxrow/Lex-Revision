# Lovable Integration Handoff

Welcome to the Lex Revision project! This document outlines the current state of the application and provides strict rules for integrating Supabase and Stripe without breaking the existing premium UI and functionality.

## Project State
Lex Revision is a modern, premium web application for legal professionals to generate, review, translate, and manage legal contracts using AI. 

**Tech Stack**: Next.js (App Router, version 16.2.4), React, Vanilla CSS (`globals.css`), Supabase (SSR Auth ready), Stripe, Anthropic (Claude 3.5 Sonnet).

**What is already implemented:**
1. **Premium UI/UX**: The entire interface is built with highly polished vanilla CSS (`globals.css`) using CSS variables, a modern dark mode, and glassmorphism. **DO NOT modify the visual design or `globals.css` structure.**
2. **AI Endpoints**: Fully functional Anthropic integrations at `/app/api/ai/*`.
3. **Webhooks**: Stripe and Clicksign webhook routes exist and handle signature verification.
4. **Auth Shell**: Supabase SSR clients are created in `/lib/supabase/client.ts` and `/lib/supabase/server.ts`. The UI for `/login` and `/signup` is ready and wired up to use `supabase.auth.signInWithPassword` and `signUp`.
5. **Data Layer**: `/lib/data.ts` currently fetches from Supabase but falls back to Mock Data if tables/credentials are missing.

## Mission for Lovable
Your primary goal is to **configure the backend and wire it to the frontend** without ruining the existing layout.

### 1. Supabase Database & Auth Setup
- Configure the database schema (Contracts, Clients, Templates, Signatures).
- Implement RLS (Row Level Security) policies.
- Wire the frontend data fetches (currently in `lib/data.ts` or directly in components) to strictly use the real Supabase data.
- Ensure the user profile is properly created on `signup` (using a trigger or direct insert).

### 2. Stripe Integration
- Map the Stripe products/prices to the application plans.
- Update `/app/api/stripe/create-session/route.ts` with the exact `priceId`s generated in the Stripe dashboard.
- Update the webhook `/app/api/stripe/webhook/route.ts` to properly provision access (e.g., updating a `users.subscription_status` field in Supabase) when a payment is successful.

### 🚀 STRICT RULES (DO NOT IGNORE)
- **RESPECT THE UI**: The user has spent a lot of time perfecting the CSS and component layout. Do NOT inject Tailwind classes if the component relies on `globals.css`. Do NOT strip out existing `className` or inline styles without explicit permission.
- **NO DESTRUCTIVE CHANGES**: When modifying pages (e.g., `/app/(app)/clientes/page.tsx`), only replace the mock data fetching logic with Supabase queries. Leave the JSX structure intact.
- **USE EXISTING HELPERS**: Use the existing Supabase clients (`/lib/supabase/client.ts` and `server.ts`).
- **DO NOT BREAK AI**: The endpoints in `/app/api/ai/*` are already functioning. Do not modify them unless necessary for database logging.
