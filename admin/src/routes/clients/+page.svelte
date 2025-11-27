<script>
	import { browser } from '$app/environment';
	import Button from '$lib/components/Button.svelte';
	import PageTransition from '$lib/components/PageTransition.svelte';
	import { joinSocketRooms, leaveSocketRooms, socketio } from '$lib/socketio.svelte.js';
	import { onMount } from 'svelte';

	let { data } = $props();

	let clients = $state();

	async function init() {
		const _page = await data._page;

		clients = _page.tasks_results?.get_clients?.data;

		const clients_token = _page.tasks_results?.get_clients_ws_token?.token;
		if (browser && clients_token && socketio.client) {
			joinSocketRooms(clients_token);

			socketio.client.on('client_created', (payload) => {
				clients.push(payload.client);
			});

			socketio.client.on('client_updated', (payload) => {
				clients = clients.map((c) => {
					if (c.es_id === payload.document.client_id) {
						return payload.document;
					}
					return c;
				});
			});
		}
	}

	onMount(() => {
		init();

		return () => {
			leaveSocketRooms(['clients']);
		};
	});
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

<div class="flex items-end justify-between pb-4">
	<h1 class="text-2xl font-semibold">Clients</h1>
	<a href="/clients/new">
		<Button class="cursor-pointer">New Client</Button>
	</a>
</div>
<div class="grid grid-cols-1 gap-2">
	{#await data._page}
		<PageTransition>Loading Clients</PageTransition>
	{:then}
		{#each clients as client (client.es_id)}
			<a href="/{client.es_id}">
				{@render block({
					title: client.settings.name
				})}
			</a>
		{/each}
	{:catch error}
		{error.message}
	{/await}
</div>
