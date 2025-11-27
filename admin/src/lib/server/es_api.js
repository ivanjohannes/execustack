import config from './config';

const admin_client_api_key = config.es_api.admin_client_api_key;

function attachApiKey(headers = {}) {
	return {
		...headers,
		Authorization: `Bearer ${admin_client_api_key}`
	};
}

/**
 * @param {object} param0
 * @param {function} param0.fetch
 * @returns
 */
export function ping({ fetch }) {
	const url = `${config.es_api.url}/ping`;

	return fetch(url, { headers: attachApiKey() });
}

/**
 * @param {object} param0
 * @param {function} param0.fetch
 * @param {object} param0.tasks_definitions
 * @returns
 */
export function execution({ fetch, tasks_definitions }) {
	const url = `${config.es_api.url}/`;

	return fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...attachApiKey()
		},
		body: JSON.stringify({ tasks_definitions })
	});
}
