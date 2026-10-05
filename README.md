# Structure Pest Control — Landing Page

Static landing page for [structurepesttx.com](https://structurepesttx.com). No build step.

**Live:** https://structure-pest-control.pages.dev (Cloudflare Pages project `structure-pest-control`)

## Structure

```
public/                 Everything in here is published
  index.html            Landing page (all sections + SEO/schema markup)
  404.html              Not-found page
  styles.css            Styles (brand colors/fonts are CSS variables at the top)
  script.js             Nav, scroll reveal, hero animations, contact form submission
  _headers              Security + caching headers
  assets/               Logo, photos, favicon, OG image
functions/api/contact.js  Pages Function: receives the form, forwards to GorillaDesk
wrangler.toml           Pages config (output dir = public)
DOCS/                   Client intake notes (never published)
```

## Local preview

```sh
npx wrangler pages dev        # serves public/ + the /api/contact function at http://localhost:8788
```

## Deploy (Cloudflare Pages)

```sh
npx wrangler pages deploy --branch main
```

Direct upload from this folder; no git repo or build step required. Only `public/` and
`functions/` are published.

### Custom domain

`structurepesttx.com` is already on Cloudflare. In the Cloudflare dashboard:
Workers & Pages → `structure-pest-control` → Custom domains → Set up a custom domain → enter
`structurepesttx.com` (and `www.structurepesttx.com`). Cloudflare adds the DNS records
automatically since the zone is in the same account. If the domain lives in a *different*
Cloudflare account, it must be transferred to this one first, or the site re-deployed from
the account that owns the zone.

### Environment variables (Pages > Settings > Environment variables)

| Name | Purpose |
| --- | --- |
| `GORILLADESK_WEBHOOK_URL` | GorillaDesk lead endpoint the form posts to |
| `GORILLADESK_API_KEY` | Bearer token for that endpoint |

Until these are set the function logs the lead and returns success.

## Swapping in brand assets

- **Logo:** replace the `.brand__mark` + `.brand__text` markup in the header/footer with `<img src="/assets/logo.svg" alt="Structure Pest Control">`.
- **Photos:** replace each `.media-placeholder` div with an `<img>` (hero, 3 service cards, why-us, service-area map).
- **Colors/fonts:** edit the `:root` variables at the top of `styles.css` and the Google Fonts `<link>` in `index.html`.
- **OG image:** add `assets/og-image.jpg` (1200×630).
