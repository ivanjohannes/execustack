import { execution } from '$lib/server/es_api';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	async function summary() {
		try {
			const res = await execution({
				fetch,
				tasks_definitions: {
					clients: {
						function: 'mongodb_aggregation',
						params: {
							collection_name: 'clients',
							pipeline: [
								{
									$group: {
										_id: 0,
										total: { $sum: 1 }
									}
								}
							]
						}
					}
				}
			});

			if (res.status !== 200) throw new Error('ES response status not 200');

			const result = await res.json();

			const execution_metrics = result.execution_metrics;

			if (!execution_metrics.is_success) throw new Error('ES execution unsuccessful');

			return {
				num_clients: result.tasks_results.clients?.data?.[0]?.total || 0
			};
		} catch (err) {
			error(500, 'Failed to fetch summary: ' + err?.message);
		}
	}

	return {
		summary: summary()
	};
}
