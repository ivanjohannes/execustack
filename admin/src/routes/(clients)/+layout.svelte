<script>
	import { joinSocketRooms, leaveSocketRooms, socketio } from '$lib/socketio.svelte';
	import { onDestroy, untrack } from 'svelte';

    let { data, children } = $props();

	let ws_rooms = $state();

	data.ws_settings
		.then((ws) => {
			if (ws?.ws_rooms) ws_rooms = ws.ws_rooms;
		})
		.catch(() => {});

	$effect(() => {
		!!socketio.client; // depend on socketio.client
		!!ws_rooms; // depend on ws_rooms

		untrack(() => {
			if (socketio.client && ws_rooms) {
				joinSocketRooms(ws_rooms.token, ['clients']);
			}
		});
	});

	onDestroy(() => {
		leaveSocketRooms(["clients"])
	});
</script>

{@render children()}