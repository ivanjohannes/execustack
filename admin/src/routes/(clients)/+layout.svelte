<script>
	import { onDestroy, untrack } from 'svelte';
	import { joinSocketRooms, leaveSocketRooms, socketio } from 'ui/utils/socketio.svelte.js';

    let { data, children } = $props();

	let ws_token = $state();

	data.ws_settings
		.then((ws) => {
			if (ws?.ws_token) ws_token = ws.ws_token;
		})
		.catch(() => {});

	$effect(() => {
		!!socketio.client; // depend on socketio.client
		!!ws_token; // depend on ws_token

		untrack(() => {
			if (socketio.client && ws_token) {
				joinSocketRooms(ws_token.token, ['clients']);
			}
		});
	});

	onDestroy(() => {
		leaveSocketRooms(["clients"])
	});
</script>

{@render children()}