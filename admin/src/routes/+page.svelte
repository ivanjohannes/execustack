<script>
	import { joinSocketRooms, leaveSocketRooms, socketio } from 'ui/utils/socketio.svelte.js';
	import { onDestroy, untrack } from 'svelte';

	let { data } = $props();

	let summary = $state();
	let ws_token = $state();

	data.ws_settings
		.then((ws) => {
			if (ws?.ws_token) ws_token = ws.ws_token;
		})
		.catch(() => {});

	data.summary
		.then((s) => {
			summary = s;
		})
		.catch(() => {});

	$effect(() => {
		!!socketio.client; // depend on socketio.client
		!!ws_token; // depend on ws_token

		untrack(() => {
			if (socketio.client && ws_token) {
				joinSocketRooms(ws_token.token, ['home']);
				socketio.client.on('clients:create', onClientCreated);
			}
		});
	});

	onDestroy(() => {
		socketio.client?.off('clients:create', onClientCreated);
		leaveSocketRooms(['home']);
	});

	function onClientCreated() {
		summary.num_clients += 1;
	}
</script>

<h1 class="text-2xl font-semibold pb-4">Dashboard</h1>
<div class="grid lg:grid-cols-2 gap-2 items-stretch">
	<a href="/clients">
		<div
			class="border rounded p-4 bg-surface border-border hover:bg-hover flex items-start justify-between"
		>
			<div class="">
				<div class="text-xl text-text">Clients</div>
				<div class="text-lg text-text-muted">
					{#await data.summary}
						Loading...
					{:then}
						{summary.num_clients}
					{:catch error}
						<div class="text-error">
							{error.message}
						</div>
					{/await}
				</div>
			</div>
		</div>
	</a>
</div>
