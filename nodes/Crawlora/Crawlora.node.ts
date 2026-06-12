import { INodeType, INodeTypeDescription, NodeConnectionTypes } from 'n8n-workflow';

// Properties are GENERATED AT BUILD TIME from the Crawlora OpenAPI spec
// (`npm run gen`) and committed as properties.json, so the published node has
// NO runtime dependencies (an n8n verification requirement). Re-run `npm run gen`
// whenever the API changes to keep the node in sync.
import properties from './properties.json';

export class Crawlora implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Crawlora',
		name: 'crawlora',
		icon: 'file:crawlora.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Get structured web data from the public web via the Crawlora API',
		defaults: {
			name: 'Crawlora',
		},
		// Make the node usable as a tool inside the n8n AI Agent.
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'crawloraApi',
				required: true,
			},
		],
		requestDefaults: {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			baseURL: 'https://api.crawlora.net/api/v1',
		},
		properties: properties as unknown as INodeTypeDescription['properties'],
	};
}
