import { execution } from '$lib/server/api';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	const res = await execution({
		fetch,
		tasks_definitions: {
			get_clients_summary: {
				function: 'mongodb_aggregation',
				params: {
					collection_name: 'clients',
					pipeline: [
						{
							$group: {
								_id: 0,
								num_clients: { $sum: 1 }
							}
						}
					]
				}
			},
			get_ws_token: {
				function: 'util_jwt',
				params: {
					payload: {
						rooms: ['clients']
					}
				}
			}
		}
	});

	if (res.status !== 200) {
		throw new Error(`API responded with status ${res.status}`);
	}

	const result = await res.json();

	const summary = result?.tasks_results?.get_clients_summary?.data?.[0] || { num_clients: 0 };
	const clients_token = result?.tasks_results?.get_ws_token?.token || null;

	return {
		summary,
		clients_token
	};
}
