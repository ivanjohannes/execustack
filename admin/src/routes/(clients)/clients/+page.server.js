import { execution } from '$lib/server/es_api';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, url, depends }) {
	// Add a dependency key for invalidation
	depends('clients');

	// get q param from url
	const search_text = url.searchParams.get('q');

	async function clients() {
		const es_result = await execution({
			tasks_definitions: {
				get_clients: {
					function: 'mongodb_aggregation',
					error_message: 'Could not get clients list',
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
									name: '$settings.name',
									client_id: '$settings.client_id',
									is_admin: { $eq: ['$settings.client_id', 'es_admin'] },
									createdAt: 1
								}
							},
							{
								$sort: {
									is_admin: 1,
									createdAt: 1
								}
							}
						]
					}
				}
			},
			fetch
		}).catch((e) => {
			console.error(e);
			return;
		});

		if (!es_result) return error(500, 'Server error');

		const execution_metrics = es_result.execution_metrics;

		if (!execution_metrics.is_success) return error(422, execution_metrics.error_message);

		return es_result.tasks_results.get_clients?.data;
	}

	return {
		clients: clients()
	};
}
