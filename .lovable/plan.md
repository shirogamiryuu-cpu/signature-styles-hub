# Signature Hair Stylist — Build Plan

A full-stack salon site with a public booking flow and an admin dashboard. Built on TanStack Start + Tailwind + Lovable Cloud (Supabase) with Storage-based image uploads.

## 1. Backend (Lovable Cloud)

### Tables
- `barbers` — id, name, bio, profile_image_url, specialties text[], years_of_experience int, is_active bool, created_at
- `haircut_styles` — id, name, description, duration_minutes int, price numeric, style_image_url, is_active bool, created_at
- `barber_style_map` — barber_id fk, style_id fk, PK(barber_id, style_id)
- `appointments` — id, customer_name, customer_email, customer_phone, appointment_datetime, barber_id, style_id, status enum('pending','confirmed','completed','cancelled'), notes, created_at
- `haircut_registers` — id, barber_id (NOT NULL), style_id (NOT NULL), customer_name, customer_phone, date_performed, price_charged, notes, appointment_id (nullable), created_at
- `reviews` — id, customer_name, appointment_id nullable, rating 1–5, comment, is_approved bool default false, created_at
- `business_info` — single row; address, phone1/2/3, opening_hours_text, facebook_url, google_maps_embed_link
- **Admin auth**: use Lovable Cloud Auth (email/password) with a `user_roles` table + `has_role()` security-definer function (NOT a custom `admin_users` table — that's insecure). The default admin `admin@signature.com / admin123` is seeded via Auth + role grant.

### Triggers
- On `appointments.status` change to `completed` → auto-insert a `haircut_registers` row (linked via `appointment_id`).
- Deleting an appointment does NOT cascade to register entries; admin UI offers an explicit "also delete linked register" checkbox.

### RLS
- Public read: `barbers`/`haircut_styles` where `is_active=true`, `barber_style_map`, approved `reviews`, `business_info`.
- Public insert: `appointments` (pending only), `reviews` (is_approved forced false).
- Admin-only (via `has_role(auth.uid(),'admin')`): all writes on barbers/styles/map/business_info/registers; full CRUD on appointments and reviews.

### Storage
- Buckets: `barber-images`, `style-images` (public read).
- Policies: admin-only insert/update/delete.
- On replace/delete of a barber or style → delete previous file from storage.

## 2. Frontend Routes (TanStack Start)

Public:
- `/` — hero with salon name, rating, address, phone, hours; barber cards grid; CTA to book; reviews preview; footer with FB link + map embed.
- `/barbers/$id` — full bio, experience, image; list of styles they perform (with style image, duration, price); "Book with X" button → prefills booking.
- `/book` — 3-step wizard: (1) pick style (cards with image+price), (2) pick barber filtered by `barber_style_map`, (3) date/time + contact info → inserts pending appointment, shows confirmation.
- `/reviews` — approved reviews list + submit form.

Admin (under `_authenticated/admin`, gated by `has_role` check):
- `/login` — email/password.
- `/admin` — dashboard stats (counts, upcoming appointments).
- `/admin/barbers` — CRUD + image upload (replace deletes old file).
- `/admin/styles` — CRUD + image upload + mapping multiselect to barbers.
- `/admin/appointments` — list/filter, edit status, delete (with "also delete linked register" prompt).
- `/admin/register` — manual entry; barber dropdown → styles filtered by mapping.
- `/admin/reviews` — approve/edit/delete.
- `/admin/business` — edit single business_info row.

## 3. Image Upload Flow

Reusable `<ImageUploader bucket="..." currentUrl="..." onUploaded={url=>...}/>`:
1. User picks file → upload to bucket with `crypto.randomUUID()` filename.
2. Get `getPublicUrl()` → set form field.
3. On save, if `currentUrl` existed and changed, delete the old object by parsing the path from the URL.
4. On entity delete, delete the storage object first, then the row.

## 4. Seed Data
- 3 barbers (Chief / Senior / Junior) with placeholder images.
- 5 styles: Men's Fade, Women's Bob, Kids Cut, Shave, Facial Wash.
- Mapping: Chief → all; Senior → Men's Fade, Women's Bob, Shave, Facial Wash; Junior → Men's Fade, Kids Cut.
- `business_info` row with the provided salon details.
- 3 approved reviews; 1 future pending appointment.
- Admin user via Auth + `admin` role.

## 5. Design Direction

Editorial, warm-luxury salon aesthetic: deep charcoal + warm cream + brass/gold accent. Display serif (Cormorant) headings + clean sans (Inter) body. Generous whitespace, large imagery, subtle motion on cards. Tokens defined in `src/styles.css` (oklch).

## 6. Tech Notes (for the technically curious)
- Stack: TanStack Start v1, React 19, Tailwind v4, shadcn/ui, Lovable Cloud (Supabase).
- Data fetching: TanStack Query via `createServerFn` where auth needed; browser client for public reads and Storage uploads.
- Auth guard: `_authenticated` layout + child `beforeLoad` checking `has_role`.
- Image cleanup handled client-side after admin actions (admin is the only writer).

## Open question
The spec says "default admin: admin@signature.com / admin123" — I'll seed this via Lovable Cloud Auth. You'll be able to sign in immediately and should change the password from the admin panel after first login. OK to proceed?
