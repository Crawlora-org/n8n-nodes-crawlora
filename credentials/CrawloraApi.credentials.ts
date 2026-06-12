import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CrawloraApi implements ICredentialType {
	name = 'crawloraApi';

	displayName = 'Crawlora API';

	documentationUrl = 'https://docs.crawlora.net';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your Crawlora API key. Find it at https://crawlora.net/app/api-keys (new accounts include a free monthly credit allowance).',
		},
	];

	// Crawlora authenticates with the x-api-key header (not a Bearer token).
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	// Cheap, key-only request to validate the credential.
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.crawlora.net/api/v1',
			url: '/google/suggest',
			qs: { q: 'crawlora' },
		},
	};
}
