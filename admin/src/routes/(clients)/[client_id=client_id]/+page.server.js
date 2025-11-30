import { execution } from '$lib/server/es_api';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, fetch, depends }) {
	const client_id = params.client_id;

	// Add a dependency key for invalidation
	depends(client_id);

	async function client() {
		try {
			const res = await execution({
				fetch,
				tasks_definitions: {
					get_client: {
						function: 'mongodb_aggregation',
						params: {
							collection_name: 'clients',
							pipeline: [
								{
									$match: {
										es_id: client_id
									}
								},
								{
									$limit: 1
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

			return result.tasks_results.get_client?.data?.[0];
		} catch (err) {
			error(500, 'Failed to fetch client: ' + err?.message);
		}
	}

	return {
		client: client()
	};
}

export const actions = {
	update: async ({ request, fetch, params }) => {
		const formData = await request.formData();
		const name = formData.get('name');
		const client_id = formData.get('client_id');

		const res = await execution({
			tasks_definitions: {
				update_client: {
					function: 'mongodb_update_doc',
					params: {
						es_id: params.client_id,
						update: {
							$set: {
								'settings.name': name,
								'settings.client_id': client_id
							}
						}
					}
				},
				ws_emit: {
					function: 'ws_emit_event',
					params: {
						rooms: ['clients'],
						event: 'client_updated',
						payload: {
							document: '[[jsonata]]tasks_results.update_client.document'
						}
					}
				}
			},
			fetch
		});

		if (res.status !== 200) {
			return {
				success: false,
				message: 'Failed to update client.',
				name,
				client_id
			};
		}

		return {
			success: true,
			message: 'Client updated successfully.',
			name,
			client_id
		};
	}
};
