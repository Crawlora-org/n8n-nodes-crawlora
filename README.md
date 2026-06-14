# n8n-nodes-crawlora

An [n8n](https://n8n.io) community node for [Crawlora](https://crawlora.net) — get structured web
data from the public web (search, maps, e‑commerce, social, finance, page content, and more) without
maintaining your own parsers.

This node exposes the Crawlora API as n8n **Resources** (Web scraping, Google / SERP, Amazon, eBay,
YouTube, Reddit, TikTok, Instagram, LinkedIn, the App Store & Google Play, Trustpilot, Zillow, Maps
datasets, geocoding) and **Operations** (the endpoints under each). It ships a **curated** set of the
most-used sources — more are added by demand. Properties are generated from the Crawlora OpenAPI spec,
so they stay in sync with the API.

## Installation

In n8n: **Settings → Community Nodes → Install**, then enter `n8n-nodes-crawlora`.

(Self-hosted manual install and local development are covered under "Development" below.)

## Credentials

Create a **Crawlora API** credential and paste your API key. It is sent as the `x-api-key` header on
every request. Get a key from your [Crawlora dashboard](https://crawlora.net/app/api-keys) — new
accounts include a free monthly credit allowance, no card required.

## Usage

1. Add the **Crawlora** node to a workflow.
2. Pick a **Resource** (the data source) and an **Operation** (the endpoint).
3. Fill in the fields and run.

The node is also **usable as a tool** inside the n8n **AI Agent**, so an agent can call Crawlora
operations directly.

> Prefer MCP? Crawlora also ships a hosted MCP server with the full catalog — use n8n's **MCP Client**
> node to call every Crawlora tool from an AI Agent workflow. See https://docs.crawlora.net.

## Development

The node's properties are **generated at build time** from the Crawlora OpenAPI spec and committed as
`nodes/Crawlora/properties.json`, so the published package has **no runtime dependencies**.

```bash
npm install
SWAGGER_PATH=<file-or-url> npm run gen   # regenerate properties.json from the Crawlora API spec
npm run build                            # tsc + copy assets into dist/
npm run smoke                            # load the built node and print resource/operation counts
```

`npm run gen` loads the Crawlora OpenAPI/Swagger spec from `SWAGGER_PATH` (a file path or URL),
converts it to OpenAPI 3.0, drops internal/account endpoints, and rebuilds the node properties.

## Publishing

CI builds and smoke-tests on every push/PR. To release, push a `v*` tag — the **Publish** workflow
publishes to npm with [provenance](https://docs.npmjs.com/generating-provenance-statements) (required
for n8n community-node verification since 2026-05-01):

```bash
npm version <patch|minor>   # creates the v* tag
git push --follow-tags
```

One-time: add an automation npm token as the `NPM_TOKEN` repository secret. Lint the package against
n8n's guidelines with `npx @n8n/scan-community-package .`, then submit it for the verified badge per
the [n8n community-node docs](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/).

## Links

- API documentation: https://docs.crawlora.net
- Crawlora: https://crawlora.net

## License

[MIT](./LICENSE)
