# Crawlora n8n workflow templates

Ready-to-import workflows built on the Crawlora API. In n8n, open
**Workflows → ⋯ → Import from File**, pick a `.json` below, add your credentials, and run.

## Google Maps → verified emails → Google Sheets

**File:** [`google-maps-email-leads.json`](./google-maps-email-leads.json)

Build a local-business lead list with real emails: pull businesses from Crawlora's Google
Maps dataset (filtered to the ones that have a website), find each site's public business
emails with the Contact API, and append outreach-ready rows to a Google Sheet.

Google Maps gives you a name, phone, and website — but no email. This flow fills that gap,
and because Crawlora handles the anti-bot scraping, it doesn't break the way DIY
HTML-parsing flows do.

### One row per business
`business, category, address, city, state, phone, website, rating, reviews, email,
email_type, email_status, all_emails, socials, place_id`

### Setup
1. **Crawlora key** — create an **HTTP Header Auth** credential named
   `Crawlora API (x-api-key)`: header **Name** `x-api-key`, **Value** = your key from
   [crawlora.net](https://crawlora.net) (free tier: 2,000 credits/month, no card).
2. **Search** — open **Crawlora: Google Maps dataset search** and edit the query parameters
   (`q`, `city`, `state`, `category`, `min_rating`, `has_website`, …).
3. **Sheet** — open **Append lead to Google Sheet**, connect a Google Sheets credential, and
   pick your spreadsheet and tab.

### Notes
- The dataset search is pre-filtered with `has_website=true`, so every business has a site to
  enrich — no wasted Contact calls.
- Each business with a website costs one Contact API call, charged on success.
- Prefer dedicated nodes? Install
  [`n8n-nodes-crawlora`](https://www.npmjs.com/package/n8n-nodes-crawlora) and swap the two
  HTTP Request nodes for the **Crawlora** node's *Datasets → Google Map businesses search* and
  *Web → Contact* operations.

> Tip: test a run with a small `page_size` first, then raise it once your sheet looks right.
