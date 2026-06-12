#!/usr/bin/env node
// Copy non-TS assets (icon + generated properties.json) into dist so the
// compiled node can require them at runtime.
'use strict';

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../nodes/Crawlora');
const DEST = path.resolve(__dirname, '../dist/nodes/Crawlora');

fs.mkdirSync(DEST, { recursive: true });

for (const file of ['properties.json', 'crawlora.svg']) {
	const from = path.join(SRC, file);
	if (fs.existsSync(from)) {
		fs.copyFileSync(from, path.join(DEST, file));
		console.log(`copied ${file}`);
	} else {
		console.warn(`missing ${file} (run "npm run gen" first for properties.json)`);
	}
}
