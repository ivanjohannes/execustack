<script>
	import { joinSocketRooms, leaveSocketRooms, socketio } from '$lib/socketio.svelte.js';
	import { onDestroy, untrack } from 'svelte';

	let { data, children } = $props();

	let ws_token = $state();

	data.clients_room.then((cr) => {
		if (!cr) return;
		ws_token = cr.ws_token;
	});

	$effect(() => {
		!!socketio.client; // depend on socketio.client
		!!ws_token; // depend on ws_token

		untrack(() => {
			if (socketio.client && ws_token) {
				joinSocketRooms(ws_token);
			}
		});
	});

	onDestroy(() => {
		leaveSocketRooms(['clients']);
	});
</script>

{@render children()}
