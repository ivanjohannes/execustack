<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { debounce } from '$lib';
	import Button from '$lib/components/Button.svelte';
	import InputText from '$lib/components/InputText.svelte';
	import { joinSocketRooms, leaveSocketRooms, socketio } from '$lib/socketio.svelte.js';
	import { onDestroy, untrack } from 'svelte';

	let { data } = $props();

	let ws_token = $state();
	let search_text = $state();

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
				socketio.client.on('client_created', onClientCreated);
				socketio.client.on('client_updated', onClientUpdated);
			}
		});
	});

	$effect(() => {
		// update the clients list when search_text changes
		search_text;

		untrack(() => {
			updateParamsDebounced();
		});
	});

	onDestroy(() => {
		socketio.client?.off('client_created', onClientCreated);
		socketio.client?.off('client_updated', onClientUpdated);
		leaveSocketRooms(['clients']);
	});

	const updateParamsDebounced = debounce(updateParams, 150);

	function updateParams() {
		goto(`?q=${encodeURIComponent(search_text ?? '')}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true,
			invalidate: [(url) => url.pathname === page.url.pathname]
		});
	}

	function onClientCreated(created_client) {
		console.log('client created', created_client);
	}

	function onClientUpdated(updated_client) {
		console.log('client updated', updated_client);
	}

</script>

{#snippet block({ title })}
	<div
		class="border rounded p-4 bg-surface border-border hover:bg-hover flex items-start justify-between"
	>
		<div class="">
			<div class="text-xl text-text">{title}</div>
		</div>
	</div>
{/snippet}

<h1 class="text-2xl font-semibold pb-4">Clients</h1>
<div class="flex items-end justify-between pb-4 space-x-4">
	<InputText
		bind:value={search_text}
		class="grow"
		placeholder="Type to search"
		name="search"
		type="search"
	/>
	<a href="/clients/new">
		<Button class="cursor-pointer">New Client</Button>
	</a>
</div>
<hr class="text-divider pb-4" />
<div class="grid grid-cols-1 gap-2">
	{#each data.clients as client (client.es_id)}
		<a href="/{client.es_id}">
			{@render block({
				title: client.settings.name
			})}
		</a>
	{/each}
</div>
