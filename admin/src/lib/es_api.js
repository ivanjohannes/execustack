import config from './config';

/**
 * @param {object} param0
 * @param {function} param0.fetch
 * @returns
 */
export function ping({ fetch }) {
	const url = `${config.es_api.url}/ping`;

	return fetch(url);
}

/**
 * @param {object} param0
 * @param {string} param0.token
 * @returns
 */
export async function execution({ token }) {
	const url = `${config.es_api.url}/`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		}
	});

	if ([422, 200].includes(response.status)) {
		return await response.json();
	}

	throw new Error(`ES API responded with status ${response.status}`);
}
