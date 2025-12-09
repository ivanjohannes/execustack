import { execution } from '$lib/server/es_api';
import { error, fail } from '@sveltejs/kit';

const mask = '******************************';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, fetch, depends }) {
	const client_es_id = params.client_es_id;

	// Add a dependency key for invalidation
	depends(client_es_id);

	async function client() {
		const es_result = await execution({
			fetch,
			tasks_definitions: {
				get_client: {
					function: 'mongodb_aggregation',
					error_message: 'Could not get client details',
					params: {
						collection_name: 'clients',
						pipeline: [
							{
								$match: {
									es_id: client_es_id
								}
							},
							{
								$project: {
									es_id: 1,
									settings: 1,
									is_admin: { $eq: ['$settings.client_id', 'es_admin'] },
									api_key_hash: {
										$cond: ['$api_key_hash', mask, '']
									}
								}
							}
						],
						is_single: true
					},
					post_validations: [
						{
							expression: '[[jsonata]]$boolean(tasks_results.get_client.data)',
							error_message: 'Client not found.'
						}
					]
				}
			}
		}).catch((e) => {
			console.error(e);
			return;
		});

		if (!es_result) return error(500, 'Server error');

		const execution_metrics = es_result.execution_metrics;

		if (!execution_metrics.is_success) return error(422, execution_metrics.error_message);

		return es_result.tasks_results.get_client?.data;
	}

	return {
		client: client()
	};
}

export const actions = {
	update: async ({ request, fetch, params }) => {
		const formData = await request.formData();
		const name = formData.get('name');

		const es_result = await execution({
			tasks_definitions: {
				update_client: {
					execution_order: 1,
					function: 'mongodb_update_doc',
					error_message: 'Could not update client',
					params: {
						es_id: params.client_es_id,
						payload: {
							$set: {
								'settings.name': name
							}
						}
					}
				},
				ws_emit: {
					execution_order: 2,
					function: 'ws_emit_event',
					is_non_essential: true,
					params: {
						event_name: 'clients:update',
						rooms: ['clients'],
						payload: '[[jsonata]]tasks_results.update_client.document'
					},
					is_broadcast: true
				}
			},
			fetch
		}).catch((e) => {
			console.error(e);
			return;
		});

		if (!es_result)
			return fail(500, {
				error_message: 'Server error',
				name
			});

		if (!es_result.execution_metrics?.is_success) {
			return fail(422, {
				error_message: es_result.execution_metrics?.error_message,
				name
			});
		}

		return {
			message: 'Client updated successfully.',
			name
		};
	},
	generate_api_key: async ({ fetch }) => {
		const es_result = await execution({
			tasks_definitions: {
				generate_key: {
					error_message: 'Could not generate API key',
					function: 'util_add_context',
					params: {
						random_string: '{{#randomstring 30}}{{/randomstring}}'
					}
				}
			},
			fetch
		}).catch((e) => {
			console.error(e);
			return;
		});

		if (!es_result)
			return fail(500, {
				error_message: 'Server error'
			});

		if (!es_result.execution_metrics?.is_success) {
			return fail(422, {
				error_message: es_result.execution_metrics?.error_message
			});
		}

		console.log(es_result.tasks_results.generate_key)

		const api_key = es_result.tasks_results.generate_key?.random_string;

		return {
			message: 'Generated an API key',
			api_key
		};
	},
	save_api_key: async ({ request, fetch, params }) => {
		const formData = await request.formData();
		const api_key = formData.get('api_key');

		if (api_key === mask) {
			return fail(400, {
				error_message: 'Please provide a new API key to save.'
			});
		}

		const es_result = await execution({
			tasks_definitions: {
				update_client: {
					execution_order: 1,
					function: 'mongodb_update_doc',
					error_message: 'Could not save API key hash',
					params: {
						es_id: params.client_es_id,
						payload: {
							api_key_hash: `{{#hash}}${api_key}{{/hash}}`
						},
						is_secret_task_results: true
					}
				},
				ws_emit: {
					execution_order: 2,
					function: 'ws_emit_event',
					is_non_essential: true,
					params: {
						event_name: 'clients:update',
						rooms: ['clients'],
						payload: '[[jsonata]]tasks_results.update_client.document'
					},
					is_broadcast: true
				}
			},
			fetch
		}).catch((e) => {
			console.error(e);
			return;
		});

		if (!es_result)
			return fail(500, {
				error_message: 'Server error'
			});

		if (!es_result.execution_metrics?.is_success) {
			return fail(422, {
				error_message: es_result.execution_metrics?.error_message
			});
		}

		return {
			message: 'Saved the API key'
		};
	}
};
