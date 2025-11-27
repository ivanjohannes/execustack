<script>
	import { browser } from '$app/environment';
	import { joinSocketRooms, leaveSocketRooms, socketio } from '$lib/socketio.svelte.js';
	import { onMount } from 'svelte';

	let { data } = $props();

	let num_clients = $state();

	async function init() {
		const _page = await data._page;

		num_clients = _page.tasks_results?.get_clients_summary?.data?.[0]?.num_clients;

		const clients_token = _page.tasks_results?.get_clients_ws_token?.token;
		if (browser && clients_token && socketio.client) {
			joinSocketRooms(clients_token);

			socketio.client.on('client_created', (payload) => {
				num_clients = num_clients + 1;
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

{#snippet block({ title, subtitle })}
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
{#await data._page}
	Loading...
{:then}
	<div class="grid lg:grid-cols-2 gap-2">
		<a href="/clients">
			{@render block({
				title: 'Clients',
				subtitle: num_clients
			})}
		</a>
	</div>
{:catch error}
	{error.message}
{/await}
