import { execution } from '$lib/server/es_api';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ fetch, locals }) {
	async function ws_settings() {
		const es_result = await execution({
			fetch,
			tasks_definitions: {
				ws_namespace: {
					function: 'ws_prep_namespace',
					error_message: 'Could not prepare WS namespace'
				},
				ws_rooms: {
					function: 'util_jwt',
					error_message: 'Could not generate WS rooms JWT',
					params: {
						payload: {
							rooms: ['home', 'clients']
						},
						expiry_ms: 60 * 60 * 1000 // 60 minutes
					}
				}
			}
		}).catch((e) => {
			console.error(e);
			return;
		});

		if (!es_result) return error(500, 'Server error');

		const execution_metrics = es_result.execution_metrics;

		if (!execution_metrics.is_success) return error(422, execution_metrics.error_message);

		return es_result.tasks_results;
	}

	return {
		ws_settings: ws_settings(),
		initial_theme: locals.theme
	};
}
