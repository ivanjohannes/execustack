import { execution } from '$lib/server/es_api';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, url, depends }) {
	// Add a dependency key for invalidation
	depends('clients:list');

	// get q param from url
	const search_text = url.searchParams.get('q');

	async function clients() {
		try {
			const res = await execution({
				tasks_definitions: {
					get_clients: {
						function: 'mongodb_aggregation',
						params: {
							collection_name: 'clients',
							pipeline: [
								{
									$match: search_text
										? {
												$or: [
													{ 'settings.name': { $regex: search_text, $options: 'i' } },
													{ 'settings.client_id': { $regex: search_text, $options: 'i' } }
												]
											}
										: {}
								},
								{
									$project: {
										es_id: 1,
										name: '$settings.name'
									}
								}
							]
						}
					}
				},
				fetch
			});

			if (res.status !== 200) throw new Error('ES response status not 200');

			const result = await res.json();

			const execution_metrics = result.execution_metrics;

			if (!execution_metrics.is_success) throw new Error('ES execution unsuccessful');

			return result.tasks_results.get_clients?.data;
		} catch (err) {
			error(500, 'Failed to fetch clients: ' + err?.message);
		}
	}

	return {
		clients: clients()
	};
}
