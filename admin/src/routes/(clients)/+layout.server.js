import { execution } from '$lib/server/es_api';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ fetch }) {
	async function clients_room() {
		try {
			const res = await execution({
				fetch,
				tasks_definitions: {
					ws_token: {
						function: 'util_jwt',
						params: {
							payload: {
								rooms: ['clients']
							},
							allowed_uses: 1
						}
					}
				}
			});

			if (res.status !== 200) throw new Error('ES response status not 200');

			const result = await res.json();

			const execution_metrics = result.execution_metrics;

			if (!execution_metrics.is_success) throw new Error('ES execution unsuccessful');

			return {
				ws_token: result.tasks_results.ws_token?.token
			};
		} catch (err) {
			console.error('Error executing ES API call:', err);
			error(500, 'Could not get clients websocket token');
			return null;
		}
	}

	return {
		clients_room: clients_room()
	};
}
