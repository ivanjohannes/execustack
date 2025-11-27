import { execution } from '$lib/server/api';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ fetch }) {
	const res = await execution({
		fetch,
		tasks_definitions: {
			prep_namespace: {
				function: 'ws_prep_namespace'
			}
		}
	});

	if (res.status !== 200) {
		throw new Error(`API responded with status ${res.status}`);
	}

	const result = await res.json();

	const ws_namespace_settings = result?.tasks_results?.prep_namespace;

	return {
		ws_namespace_settings
	};
}
