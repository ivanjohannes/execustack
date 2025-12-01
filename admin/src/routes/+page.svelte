<script>
	import { joinSocketRooms, leaveSocketRooms, socketio } from '$lib/socketio.svelte.js';
	import { addToast } from '$lib/toasts.svelte.js';
	import { onDestroy, untrack } from 'svelte';

	let { data } = $props();

	let num_clients = $state();
	let ws_rooms = $state();

	data.ws_settings
		.then((ws) => {
			if (ws?.ws_rooms) ws_rooms = ws.ws_rooms;
		})
		.catch(() => {});

	data.summary
		.then((summary) => {
			num_clients = summary?.num_clients;
		})
		.catch(() => {});

	$effect(() => {
		!!socketio.client; // depend on socketio.client
		!!ws_rooms; // depend on ws_rooms

		untrack(() => {
			if (socketio.client && ws_rooms) {
				joinSocketRooms(ws_rooms.token, ['home']);
				socketio.client.on('client_created', onClientCreated);
			}
		});
	});

	onDestroy(() => {
		socketio.client?.off('client_created', onClientCreated);
		leaveSocketRooms(['home']);
	});

	function onClientCreated() {
		num_clients += 1;
	}
</script>

<h1 class="text-2xl font-semibold pb-4">Dashboard</h1>
<div class="grid lg:grid-cols-2 gap-2">
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
						{num_clients}
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
