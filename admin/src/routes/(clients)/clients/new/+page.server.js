import { execution } from '$lib/server/es_api';
import { redirect } from '@sveltejs/kit';

export const actions = {
	create: async ({ request, fetch }) => {
		const formData = await request.formData();
		const name = formData.get('name');

		const res = await execution({
			tasks_definitions: {
				create_client: {
					function: 'mongodb_create_doc',
					params: {
						collection_name: 'clients',
						payload: {
							settings: {
								name
							}
						}
					}
				},
				ws_emit: {
					function: 'ws_emit_event',
					params: {
						room: 'clients',
						event: 'client_created',
						payload: {
							document: '[[jsonata]]tasks_results.create_client.document'
						}
					}
				}
			},
			fetch
		});

		if (res.status !== 200) {
			return {
				success: false,
				message: 'Failed to create client.',
				name
			};
		}

		const result = await res.json();

		const client = result?.tasks_results?.create_client?.document ?? null;

		if (client) {
			redirect(303, `/${client.es_id}`);
		}

		return {
			success: true,
			message: 'Client created successfully.'
		};
	}
};
