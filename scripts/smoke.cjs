#!/usr/bin/env node
// Load the compiled node + credential and print a summary. Verifies the generated
// properties load and the resource/operation structure is well-formed.
'use strict';

const { Crawlora } = require('../dist/nodes/Crawlora/Crawlora.node.js');
const { CrawloraApi } = require('../dist/credentials/CrawloraApi.credentials.js');

const node = new Crawlora();
const cred = new CrawloraApi();
const props = node.description.properties;
const resource = props.find((p) => p.name === 'resource');
const resourceCount = (resource && resource.options && resource.options.length) || 0;
const operationProps = props.filter((p) => p.name === 'operation');
const opCount = operationProps.reduce(
	(n, p) => n + ((p.options && p.options.length) || 0),
	0,
);

console.log(`Node:        ${node.description.displayName} (${node.description.name})`);
console.log(`Credential:  ${cred.displayName} (${cred.name})`);
console.log(`Properties:  ${props.length}`);
console.log(`Resources:   ${resourceCount}`);
console.log(`Operations:  ${opCount}`);

if (resourceCount === 0 || opCount === 0) {
	console.error('FAIL: expected at least one resource and one operation.');
	process.exit(1);
}
console.log('OK');
