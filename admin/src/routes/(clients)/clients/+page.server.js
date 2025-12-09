import { clients } from '$lib/server/utils';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, url, depends }) {
	// Add a dependency key for invalidation
	depends('clients');

	// get q param from url
	const search_text = url.searchParams.get('q') || '';

	return {
		clients: clients({ search_text, fetch })
	};
}
