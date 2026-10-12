# Structure Pest Control

Landing page for structurepesttx.com. Static files, no build.

Live: https://structure-pest-control.pages.dev

`public/` is what gets published. The quote form emails structurepesttx@gmail.com from the browser. `DOCS/` stays off the site.

```sh
npx wrangler pages dev
npx wrangler pages deploy --branch main
```

Custom domain: Cloudflare dashboard, Workers & Pages, `structure-pest-control`, Custom domains. The zone for structurepesttx.com has to be in the same account.

Pages environment variables:

- `TURNSTILE_SECRET_KEY` (optional)

The first quote email asks FormSubmit to confirm structurepesttx@gmail.com. Open that message and activate the form. Later submissions arrive in that inbox, and Reply goes to the customer. The function does not log the lead.
