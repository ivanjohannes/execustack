import { execution } from '$lib/server/es_api';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ fetch, locals }) {
	async function socket_namespace() {
		try {
			const res = await execution({
				fetch,
				tasks_definitions: {
					socket_namespace: {
						function: 'ws_prep_namespace'
					}
				}
			});

			if (res.status !== 200) throw new Error('ES response status not 200');

			const result = await res.json();

			const execution_metrics = result.execution_metrics;

			if (!execution_metrics.is_success) throw new Error('ES execution unsuccessful');

			return result.tasks_results.socket_namespace;
		} catch (err) {
			console.error('Error executing ES API call:', err);
			error(500, 'Could not get socket connection settings');
			return null;
		}
	}

	return {
		socket_namespace: socket_namespace(),
		initial_theme: locals.theme
	};
}
