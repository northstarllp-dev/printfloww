# PrintFloww

Production-oriented MVP for local print shops: private document upload, print options, UPI payment, customer tracking, and server-protected admin workflows.

## Setup

1. Copy `.env.example` to `.env.local` and fill in Supabase, database, storage, and Resend values.
2. Create a private Supabase Storage bucket named by `SUPABASE_STORAGE_BUCKET` (default: `printfloww-private`). Do not make this bucket public.
3. Run migrations:

```bash
npm run db:migrate
```

4. Insert one `shops` row, then map Supabase Auth admin users into `admin_users` using the auth user UUID as `admin_users.id`.

```sql
insert into shops (name, upi_id, email)
values ('PrintFloww Demo Shop', 'shop@upi', 'shop@example.com')
returning id;

insert into admin_users (id, shop_id, email)
values ('SUPABASE_AUTH_USER_UUID', 'SHOP_UUID', 'admin@example.com');
```

## Security Notes

- Customer uploads use signed upload URLs and go directly to private Supabase Storage.
- Tracking tokens are cryptographically random; only SHA-256 hashes are stored.
- Admin routes are protected by Supabase middleware and each admin page/action validates the session server-side.
- Admin document access is via short-lived signed URLs generated only inside authenticated admin pages.
- Customer tracking pages never expose document downloads.

## Verification

```bash
npm exec tsc -- --noEmit
npm run build
```
