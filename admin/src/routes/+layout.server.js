import { execution } from '$lib/server/es_api';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ fetch, locals }) {
	console.log('Loading layout.server.js');

	async function ws_settings() {
		try {
			const res = await execution({
				fetch,
				tasks_definitions: {
					ws_namespace: {
						function: 'ws_prep_namespace'
					},
					ws_rooms: {
						function: 'util_jwt',
						params: {
							payload: {
								rooms: ['home', 'clients']
							},
							expiry_ms: 60 * 60 * 1000 // 60 minutes
						}
					}
				}
			});

			if (res.status !== 200) throw new Error('ES response status not 200');

			const result = await res.json();

			const execution_metrics = result.execution_metrics;

			if (!execution_metrics.is_success) throw new Error('ES execution unsuccessful');

			return result.tasks_results;
		} catch (err) {
			error(500, 'Failed to fetch WebSocket settings: ' + err?.message);
		}
	}

	return {
		ws_settings: ws_settings(),
		initial_theme: locals.theme
	};
}
