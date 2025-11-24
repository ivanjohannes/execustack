import { execution } from '$lib/server/api';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, fetch }) {
	const client_id = params.client_id;

	async function client() {
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
									execustack_id: client_id
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
		if (res.status !== 200) {
			throw new Error(`API responded with status ${res.status}`);
		}

		const result = await res.json();

		return result?.tasks_results?.get_client?.data?.[0] ?? null;
	}

    return {
		client: await client()
	};
}
