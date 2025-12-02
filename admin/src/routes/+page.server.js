import { execution } from '$lib/server/es_api';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	async function summary() {
		const es_result = await execution({
			fetch,
			tasks_definitions: {
				clients: {
					function: 'mongodb_aggregation',
					error_message: 'Could not get clients summary',
					params: {
						collection_name: 'clients',
						pipeline: [
							{
								$group: {
									_id: 0,
									total: { $sum: 1 }
								}
							}
						],
						is_single: true
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

		return {
			num_clients: es_result.tasks_results.clients?.data?.total || 0
		};
	}

	return {
		summary: summary()
	};
}
