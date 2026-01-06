<script>
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { socketio } from 'ui/utils/socketio.svelte.js';
	import { onDestroy, untrack } from 'svelte';
	import { debounce } from 'ui/utils/index.js';
	import InputText from 'ui/input/InputText.svelte';
	import Button from 'ui/input/Button.svelte';

	let { data } = $props();

	let search_text = $state();

	$effect(() => {
		!!socketio.client; // depend on socketio.client

		untrack(() => {
			if (socketio.client) {
				socketio.client.on('clients:create', onClientCreated);
				socketio.client.on('clients:update', onClientUpdated);
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
		socketio.client?.off('clients:create', onClientCreated);
		socketio.client?.off('clients:update', onClientUpdated);
	});

	const updateParamsDebounced = debounce(updateParams, 150);

	function updateParams() {
		let skip_goto = true;
		if ((page.url.searchParams.get('q') ?? '') !== (search_text ?? '')) skip_goto = false;
		if (skip_goto) return;
		goto(`?q=${encodeURIComponent(search_text ?? '')}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true,
			invalidate: ['clients']
		});
	}

	async function onClientCreated() {
		if (!search_text) {
			// Invalidate using the specific dependency key
			await invalidate('clients');
		}
	}

	async function onClientUpdated(doc) {
		const is_rendered = await data.clients
			.then((c) => c.some((cl) => cl.es_id === doc.es_id))
			.catch(() => false);
		if (is_rendered) {
			// Invalidate using the specific dependency key
			await invalidate('clients');
		}
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
<div class="flex items-end justify-between pb-4 space-x-2">
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
	{#await data.clients}
		Loading...
	{:then clients}
		{#each clients as client (client.es_id)}
			<a href="/{client.es_id}">
				{@render block({
					title: `${client.name ?? ""} (${client.client_id ?? ""})`
				})}
			</a>
		{/each}
	{:catch error}
		<div class="text-error">{error.message}</div>
	{/await}
</div>
