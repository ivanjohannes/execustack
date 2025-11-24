import { execution } from '$lib/server/api';
import { redirect } from '@sveltejs/kit';

export const actions = {
	create: async ({ request, fetch }) => {
		const formData = await request.formData();
		const name = formData.get('name');

		const response = await execution({
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
				}
			},
			fetch
		});

		if (response.status !== 200) {
			return {
				success: false,
				message: 'Failed to create client.'
			};
		}

        const result = await response.json();

        const client = result?.tasks_results?.create_client?.document ?? null;

        if (client) {
            redirect(303, `/${client.execustack_id}`);
        }

        return {
            success: true,
            message: 'Client created successfully.'
        };
	}
};
