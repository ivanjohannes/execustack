import { execution } from '$lib/server/es_api';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	create: async ({ request, fetch }) => {
		const formData = await request.formData();
		const client_id = formData.get('client_id');

		const formatted_client_id = client_id
			?.toString()
			?.trim()
			?.replace(/\s+/g, '_')
			?.replace(/\./g, '_')
			?.toLowerCase();

		const es_result = await execution({
			tasks_definitions: {
				get_duplicate: {
					execution_order: 1,
					function: 'mongodb_aggregation',
					params: {
						collection_name: 'clients',
						pipeline: [
							{
								$match: {
									'settings.client_id': formatted_client_id
								}
							}
						],
						is_single: true
					},
					error_message: 'Could not check for duplicate client IDs',
					post_validations: [
						{
							expression: '[[jsonata]]$boolean(tasks_results.get_duplicate.data)',
							error_message: 'Client ID already exists.'
						}
					]
				},
				create_client: {
					execution_order: 3,
					function: 'mongodb_create_doc',
					error_message: 'Could not create client',
					params: {
						collection_name: 'clients',
						payload: {
							settings: {
								client_id: formatted_client_id
							}
						}
					}
				},
				ws_emit: {
					execution_order: 4,
					function: 'ws_emit_event',
					is_non_essential: true,
					params: {
						rooms: ['home', 'clients'],
						event_name: 'client_created',
						payload: {
							document: '[[jsonata]]tasks_results.create_client.document'
						}
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
				error_message: es_result.execution_metrics?.error_message,
				client_id: formatted_client_id
			});
		}

		const client = es_result?.tasks_results?.create_client?.document ?? null;

		if (client) {
			redirect(303, `/${client.es_id}`);
		}

		return {
			message: 'Client created successfully.'
		};
	}
};
