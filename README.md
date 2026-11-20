# Ishtam: clothing e-commerce (Phases 2A and 2B)

Next.js 14 + TypeScript + Tailwind + Prisma + PostgreSQL + Cloudinary.

## Run it in VS Code on Windows
```powershell
npm install
Copy-Item .env.example .env.local  # set local DATABASE_URL, DIRECT_URL, and Cloudinary keys
```
Next.js reads `.env.local`; Prisma CLI does not. Before running Prisma commands, set `$env:DATABASE_URL` and `$env:DIRECT_URL` in PowerShell to the local values from `.env.local`, so local development cannot accidentally target a hosted database. Then run:
```powershell
npx prisma migrate dev
npm run db:seed
npm run dev                 # http://localhost:3000
```
The Phase 2A migration is `20261120080030_add_cart_wishlist_rate_limit`; it was created and applied with `npx prisma migrate dev --name add_cart_wishlist_rate_limit`.

Owner login: sign in at `/owner/login` with the seeded administrator email and password, or with the owner phone number and password. To enable phone sign-in, set `ADMIN_PHONE` and a private `ADMIN_PASSWORD` in `.env.local`, then run `npm run db:seed`. Running the seed again resets that account to the configured password. Phone sign-in is password-based (not SMS OTP). Customer login remains email/password at `/login`.
The former `/admin/*` pages redirect to `/owner/*`. In the owner panel, use **Website settings** to edit the brand, contact details, homepage copy, and hero imagery; use **Banners**, **Products**, **Categories**, and **Coupons** to manage those sections.
Customers can create an account at `/register`, sign in at `/login`, shop as guests, and save wishlists after signing in.

## Phase 2B database migration
The owner content editor adds `Banner`, adds image fields to `Category`, and adds brand, contact, and homepage content fields to `SiteSettings`. Its migration is `20261120083036_owner_content_management`.

To apply all committed migrations to the local database, first set `$env:DATABASE_URL` and `$env:DIRECT_URL` in the current PowerShell session to the local values from `.env.local`, then run:
```powershell
npx prisma migrate deploy
npx prisma generate
```
No new npm packages are required. Owner-uploaded images require valid Cloudinary credentials; uploads are restricted to JPG, PNG, or WebP files up to 5 MB.

## PostgreSQL
Local: create a DB (`createdb clothing_store`) and set `DATABASE_URL`.
Hosted: create a Neon or Supabase project and paste its connection string.

## Cloudinary
Dashboard > Settings > API Keys. Copy cloud name, API key, and API secret into `.env.local` for local development. They are only read in server code. Restart `npm run dev` after adding them.

## Included
Customer registration/login, separate owner-only sign-in and protected dashboard, per-email login throttling,
guest and account carts with server-side prices/stock checks, wishlist, search and category filters,
editable site settings and homepage, banner management, category images, product editing with image ordering
and per-variant stock, coupon creation/disable, product create/delete/archive, homepage, product pages,
and owner overview. Coupon redemption during checkout is part of Phase 3.

## Next phases
2C. Framer Motion storefront transitions and reduced-motion support
3. Checkout, coupon redemption, Razorpay with server-side signature verification, COD, stock decrement
4. Order management, inventory editing, reviews, profile and addresses, forgot password
5. Vercel + Neon deployment, hardening
