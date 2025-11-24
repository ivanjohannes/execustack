import { execution } from '$lib/server/api';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	async function clients() {
		const res = await execution({
			fetch,
			tasks_definitions: {
				get_clients: {
					function: 'mongodb_aggregation',
					params: {
						collection_name: 'clients',
						pipeline: [
							{
								$limit: 10
							},
							{
								$project: {
									execustack_id: 1,
									settings: 1,
									createdAt: 1
								}
							}
						]
					}
				}
			}
		});

		if (res.status !== 200) {
			throw new Error(`API responded with status ${res.status}`);
		}

		const result = await res.json();

		return result?.tasks_results?.get_clients?.data ?? [];
	}

	return {
		clients: clients()
	};
}
