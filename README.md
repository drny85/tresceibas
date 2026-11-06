# Tres Ceibas

Sitio de la comunidad de Tres Ceibas (Villa Magante, R.D.): proyectos, actividades, donaciones en línea y muro de donantes. Español primero, con traducción al inglés. Pensado primero para el teléfono.

Community site for Tres Ceibas: projects, activities, online donations and a donor wall. Spanish first, English translation. Mobile first.

## Stack

- **Next.js 16** (App Router, Cache Components) · Tailwind CSS v4 · shadcn/ui style components
- **Convex** for data, file storage, payments actions and the Stripe webhook
- **Clerk** for admin sign-in (only emails in `ADMIN_EMAILS` can manage content)
- **Stripe Checkout** (default) and **PayPal** (optional) for donations in USD

## How donations work

- Donors give in USD. The processing fee is added on top so the project receives the exact amount chosen. Defaults: Stripe 2.9% + US$0.30, PayPal 3.49% + US$0.49, editable in **Admin → Ajustes**.
- Amounts are shown in RD$ using the exchange rate in Ajustes. Each donation keeps the rate it was made at.
- Cash and bank transfers in the DR are entered by an admin under **Admin → Donaciones**.
- Donors can be anonymous. Admins can hide a message from the public wall.

## Setup

```bash
npm install
cp .env.example .env.local

# 1. Convex: creates the deployment, fills NEXT_PUBLIC_CONVEX_URL and regenerates convex/_generated
npx convex dev

# 2. Clerk: create an app, enable the Convex integration (JWT template "convex"),
#    copy the keys into .env.local, then tell Convex the issuer:
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-app>.clerk.accounts.dev
npx convex env set ADMIN_EMAILS "you@example.com,committee@example.com"
npx convex env set SITE_URL http://localhost:3000

# 3. Stripe (account in the organizer's name)
npx convex env set STRIPE_SECRET_KEY sk_test_...
#    Webhook endpoint: https://<deployment>.convex.site/stripe/webhook
#    Events: checkout.session.completed, checkout.session.async_payment_succeeded,
#            checkout.session.async_payment_failed, checkout.session.expired
npx convex env set STRIPE_WEBHOOK_SECRET whsec_...

# 4. PayPal (optional)
npx convex env set PAYPAL_CLIENT_ID ...
npx convex env set PAYPAL_CLIENT_SECRET ...
#    For live payments: npx convex env set PAYPAL_API_BASE https://api-m.paypal.com

# 5. Sample content: the land project (RD$2,000,000), the Feb 2027 event and the committee
npx convex run seed:run

npm run dev
```

Open http://localhost:3000. Visitors are sent to `/es` or `/en` by their browser language. The admin lives at `/es/admin`.

## Deploying

Deploy to Vercel. Set the build command to `npx convex deploy --cmd 'npm run build'` and add `CONVEX_DEPLOY_KEY` plus the Clerk and PayPal public variables. Set `SITE_URL` in the production Convex deployment to the real domain and create a live Stripe webhook pointing at the production `.convex.site` URL.

## Project layout

- `convex/` schema, queries, mutations, payment actions (`payments.ts`) and the webhook (`http.ts`)
- `src/app/[lang]/` pages (Spanish route names in both languages)
- `src/i18n/dictionaries/` all public text in `es.json` and `en.json`
- `src/components/club-story/` the animated story of the club (pure SVG, no libraries)
- `public/brand/` logo files

Images are placeholders until real photos are uploaded through the admin.
