# invoice frontend

## local

requires backend at `http://localhost:4000`.

copy `.env.example` to `.env.local`, then set:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

The local site key is Cloudflare's always-pass Turnstile test key. Configure the
matching test secret key in the backend's local `.env`:
`TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA`.

run:

```bash
npm install
npm run dev
```

`.env.local` and `.dev.vars` are local only. do not commit them.

## production

production branch: `release/frontend`

push to `release/frontend` triggers `.github/workflows/deploy-frontend.yml`.

workflow runs:

```bash
npm ci
npm run deploy
```

production frontend values are injected during the github actions build:

```text
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_TURNSTILE_SITE_KEY
```

`NEXT_PUBLIC_API_URL` is required. The build does not fall back to a hardcoded
backend URL, and the value is embedded in the browser bundle during deployment.

required github production secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_TURNSTILE_SITE_KEY
```

`NEXT_PUBLIC_*` values are build time values. changing cloudflare worker variables after deployment does not change the browser bundle.

## cloudflare token

use a custom token policy:

- account: `edit cloudflare workers`
- scope: account containing `invoice-fe`
- zone permissions: none
- workers routes: none

add `workers routes: edit` for `outinvoicehub.com` only if wrangler config starts managing routes or custom domains.

## useful commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run deploy
```
