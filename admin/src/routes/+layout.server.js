import { execution } from '$lib/server/es_api';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ fetch }) {
	async function es() {
		const res = await execution({
			fetch,
			tasks_definitions: {
				socket_namespace: {
					function: 'ws_prep_namespace'
				}
			}
		});

		// // wait 2 seconds to simulate longer processing time
		// await new Promise(resolve => setTimeout(resolve, 2000));

		if (res.status !== 200) {
			error(500, `ExecuStack API responded with status ${res.status}`);
		}

		const result = await res.json();

		const execution_metrics = result.execution_metrics;

		if (!execution_metrics.is_success) {
			error(500, "ExecuStack API reported unsuccessful execution");
		}

		const tasks_results = result.tasks_results;

		return {
			tasks_results,
			execution_metrics
		};
	}

	return {
		_layout: es()
	};
}
