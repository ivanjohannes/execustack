<script>
	import { joinSocketRooms, leaveSocketRooms, socketio } from '$lib/socketio.svelte.js';
	import { onDestroy, untrack } from 'svelte';

	let { data } = $props();

	/**
	 * @typedef {object} Summary
	 * @property {number} [num_clients]
	 * @property {string} [ws_token]
	 */

	/** @type {Summary} */
	const summary = $state({});

	data.summary.then((s) => {
		if (!s) return;
		summary.num_clients = s.num_clients;
		summary.ws_token = s.ws_token;
	});

	$effect(() => {
		!!socketio.client; // depend on socketio.client
		!!summary.ws_token; // depend on ws_token

		untrack(() => {
			if (socketio.client && summary.ws_token) {
				joinSocketRooms(summary.ws_token);
				socketio.client.on('client_created', onClientCreated);
			}
		});
	});

	onDestroy(() => {
		socketio.client?.off('client_created', onClientCreated);
		leaveSocketRooms(['clients']);
	});

	function onClientCreated() {
		if (summary.num_clients === undefined) return;
		summary.num_clients += 1;
	}
</script>

{#snippet block(/** @type {{ title: string, subtitle: string }}*/ { title, subtitle })}
	<div
		class="border rounded p-4 bg-surface border-border hover:bg-hover flex items-start justify-between"
	>
		<div class="">
			<div class="text-xl text-text">{title}</div>
			<div class="text-lg text-text-muted">{subtitle}</div>
		</div>
	</div>
{/snippet}

<h1 class="text-2xl font-semibold pb-4">Dashboard</h1>
<div class="grid lg:grid-cols-2 gap-2">
	<a href="/clients">
		{@render block({
			title: 'Clients',
			subtitle: summary.num_clients !== undefined ? summary.num_clients.toString() : 'Loading...'
		})}
	</a>
</div>
