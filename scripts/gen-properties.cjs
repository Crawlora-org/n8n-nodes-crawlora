#!/usr/bin/env node
/*
 * Generate the n8n node properties from the Crawlora OpenAPI/Swagger spec.
 *
 *   1. load the Crawlora API spec (Swagger 2.0 or OpenAPI 3.0; file path or URL)
 *   2. convert it to OpenAPI 3.0 (swagger2openapi)
 *   3. drop internal/account/admin/deprecated endpoints
 *   4. build n8n properties with @devlikeapro/n8n-openapi-node
 *      (Tags -> Resources, operations -> Operations/Actions)
 *   5. write nodes/Crawlora/openapi.json + nodes/Crawlora/properties.json
 *
 * Properties are generated AT BUILD TIME and committed, so the published node
 * has no runtime dependencies. Re-run when the API changes:
 *
 *   SWAGGER_PATH=<file-or-url> npm run gen
 */
'use strict';

const fs = require('fs');
const path = require('path');
const converter = require('swagger2openapi');
const {
	N8NPropertiesBuilder,
	DefaultResourceParser,
	DefaultOperationParser,
} = require('@devlikeapro/n8n-openapi-node');

// The builder humanizes tags/operationIds with lodash.startCase, which mangles brand
// names ("TikTok" -> "Tik Tok", "eBay" -> "E Bay", "YouTube" -> "You Tube"). Override the
// resource/operation display names so the verified node reads cleanly (n8n UX guideline:
// resource Name in Title Case). Only the display Name changes — internal values stay,
// so operation<->resource wiring is untouched.
const RESOURCE_NAMES = {
	TikTok: 'TikTok',
	YouTube: 'YouTube',
	eBay: 'eBay',
	LinkedIn: 'LinkedIn',
	GooglePlay: 'Google Play',
	AppStore: 'App Store',
	IMDb: 'IMDb',
	'Shop.app': 'Shop.app',
};
const BRAND_FIXES = [
	[/\bTik Tok\b/g, 'TikTok'],
	[/\bYou Tube\b/g, 'YouTube'],
	[/\bE Bay\b/g, 'eBay'],
	[/\bLinked In\b/g, 'LinkedIn'],
	[/\bTiktok\b/g, 'TikTok'],
	[/\bYoutube\b/g, 'YouTube'],
	[/\bEbay\b/g, 'eBay'],
	[/\bLinkedin\b/g, 'LinkedIn'],
	[/\bImdb\b/g, 'IMDb'],
	[/\bRottentomatoes\b/g, 'Rotten Tomatoes'],
	[/\bAppstore\b/g, 'App Store'],
	[/\bGoogleplay\b/g, 'Google Play'],
];
function fixBrands(s) {
	let out = s;
	for (const [re, rep] of BRAND_FIXES) out = out.replace(re, rep);
	return out;
}
class ResourceParser extends DefaultResourceParser {
	name(tag) {
		return RESOURCE_NAMES[tag.name] || fixBrands(super.name(tag));
	}
}
class OperationParser extends DefaultOperationParser {
	name(operation, context) {
		return fixBrands(super.name(operation, context));
	}
}

const SWAGGER_PATH = process.env.SWAGGER_PATH;
const OUT_DIR = path.resolve(__dirname, '../nodes/Crawlora');

// Internal / account / admin surfaces that must not appear in the public node.
const SKIP_TAGS = new Set(['Billing', 'Usage', 'Referrals', 'Admin', 'Polymarket']);
const SKIP_PATH = /^\/(admin|ping|release|health|internal)\b/i;
const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);

// Optional local redaction rules to keep descriptions user-facing (e.g. replace any
// internal-infrastructure wording the upstream spec may carry). Loaded from a local,
// untracked file so the rules themselves aren't published. Format:
//   [["regex", "flags", "replacement"], ...]
function loadRedactions() {
	const f = path.resolve(__dirname, 'redactions.local.json');
	if (!fs.existsSync(f)) return [];
	try {
		return JSON.parse(fs.readFileSync(f, 'utf8')).map(([re, flags, rep]) => [new RegExp(re, flags), rep]);
	} catch (e) {
		console.warn(`Ignoring redactions.local.json (${e.message}).`);
		return [];
	}
}
const TEXT_REPLACEMENTS = loadRedactions();

// Curated allow-list for the VERIFIED node (resource tag -> Set of operationIds, or "*").
// n8n verifies curated single-vendor nodes (SerpApi ~37 ops, ScrapingBee ~17); a 430-op node
// is too sprawling to review. Anything not listed is dropped. Build the full surface with
// CURATE=0 npm run gen. See webscraping-fe docs/n8n-verified-node-packaging-plan-2026-06.md.
function loadCuration() {
	if (process.env.CURATE === '0') return null;
	const f = path.resolve(__dirname, 'curation.json');
	if (!fs.existsSync(f)) return null;
	try {
		const raw = JSON.parse(fs.readFileSync(f, 'utf8'));
		const map = {};
		for (const [tag, ops] of Object.entries(raw)) {
			if (tag.startsWith('_')) continue; // skip _comment and the like
			map[tag] = ops === '*' ? '*' : new Set(ops);
		}
		return map;
	} catch (e) {
		console.warn(`Ignoring curation.json (${e.message}).`);
		return null;
	}
}
const CURATION = loadCuration();

function isCurated(op) {
	if (!CURATION) return true;
	const tags = (op && op.tags) || [];
	return tags.some((t) => {
		const allow = CURATION[t];
		return allow === '*' || (allow && allow.has(op.operationId));
	});
}

function sanitize(text) {
	if (typeof text !== 'string') return text;
	let out = text;
	for (const [re, rep] of TEXT_REPLACEMENTS) out = out.replace(re, rep);
	return out;
}

function sanitizeOperation(op) {
	op.description = sanitize(op.description);
	op.summary = sanitize(op.summary);
	if (Array.isArray(op.parameters)) {
		for (const prm of op.parameters) prm.description = sanitize(prm.description);
	}
	const content = op.requestBody && op.requestBody.content;
	if (content) {
		for (const ct of Object.values(content)) {
			const props = ct.schema && ct.schema.properties;
			if (props) for (const k of Object.keys(props)) props[k].description = sanitize(props[k].description);
		}
	}
}

function isDeprecated(op) {
	return op.deprecated === true || /^\s*deprecated\b/i.test(op.description || '');
}

async function loadSpec(src) {
	if (/^https?:\/\//i.test(src)) {
		const res = await fetch(src);
		if (!res.ok) throw new Error(`Failed to fetch spec (${res.status}) from ${src}`);
		return res.json();
	}
	return JSON.parse(fs.readFileSync(src, 'utf8'));
}

async function main() {
	if (!SWAGGER_PATH) {
		console.error('Set SWAGGER_PATH to the Crawlora OpenAPI/Swagger spec (a file path or URL) and retry.');
		console.error('  e.g. SWAGGER_PATH=./crawlora-openapi.json npm run gen');
		process.exit(1);
	}

	const swagger = await loadSpec(SWAGGER_PATH);

	converter.convertObj(swagger, { patch: true, warnOnly: true }, (err, result) => {
		if (err) throw err;
		const spec = result.openapi;

		// Drop internal/account/admin/deprecated endpoints — only public data
		// operations belong in the published node — and keep descriptions clean.
		let removed = 0;
		for (const p of Object.keys(spec.paths || {})) {
			if (SKIP_PATH.test(p)) {
				removed += Object.keys(spec.paths[p]).filter((m) => HTTP_METHODS.has(m.toLowerCase())).length;
				delete spec.paths[p];
				continue;
			}
			for (const m of Object.keys(spec.paths[p])) {
				if (!HTTP_METHODS.has(m.toLowerCase())) continue;
				const op = spec.paths[p][m];
				const tags = (op && op.tags) || [];
				if (tags.some((t) => SKIP_TAGS.has(t)) || isDeprecated(op)) {
					delete spec.paths[p][m];
					removed++;
					continue;
				}
				sanitizeOperation(op);
			}
			if (Object.keys(spec.paths[p]).length === 0) delete spec.paths[p];
		}

		// Keep only the curated allow-list so the published node stays reviewable
		// (build the full surface with CURATE=0 npm run gen).
		let curatedOut = 0;
		if (CURATION) {
			for (const cp of Object.keys(spec.paths || {})) {
				for (const cm of Object.keys(spec.paths[cp])) {
					if (!HTTP_METHODS.has(cm.toLowerCase())) continue;
					if (!isCurated(spec.paths[cp][cm])) {
						delete spec.paths[cp][cm];
						curatedOut++;
					}
				}
				if (Object.keys(spec.paths[cp]).length === 0) delete spec.paths[cp];
			}
		}

		fs.writeFileSync(path.join(OUT_DIR, 'openapi.json'), JSON.stringify(spec, null, 2));

		const builder = new N8NPropertiesBuilder(spec, {
			resource: new ResourceParser(),
			operation: new OperationParser(),
		});
		const properties = builder.build();

		fs.writeFileSync(path.join(OUT_DIR, 'properties.json'), JSON.stringify(properties, null, 2));

		const resources = (properties.find((p) => p.name === 'resource') || {}).options || [];
		console.log(
			`Generated ${properties.length} properties across ${resources.length} resources ` +
				`(${removed} internal/account/deprecated operations skipped` +
				(CURATION ? `, ${curatedOut} dropped by curation allow-list` : '') +
				`).`,
		);
	});
}

main();
