# Structure Pest Control

Landing page for structurepesttx.com. Static files, no build.

Live: https://structure-pest-control.pages.dev

`public/` is what gets published. `functions/api/contact.js` takes the quote form and forwards it to GorillaDesk. `DOCS/` stays off the site.

```sh
npx wrangler pages dev
npx wrangler pages deploy --branch main
```

Custom domain: Cloudflare dashboard, Workers & Pages, `structure-pest-control`, Custom domains. The zone for structurepesttx.com has to be in the same account.

Pages environment variables:

- `GORILLADESK_WEBHOOK_URL`
- `GORILLADESK_API_KEY` (secret)
- `TURNSTILE_SECRET_KEY` (optional)

Until the webhook is set, the form tells people to call. It does not log the lead.
