import { ping } from '$lib/server/api';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ fetch }) {
	async function pingApi() {
		try {
			const res = await ping({ fetch });

			return res.status === 200;
		} catch {
			return false;
		}
	}

	return {
		ping_response: pingApi()
	};
}
