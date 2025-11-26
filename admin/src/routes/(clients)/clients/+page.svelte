<script>
	import Button from '$lib/components/Button.svelte';
	import PageTransition from '$lib/components/PageTransition.svelte';

	let { data } = $props();
</script>

{#snippet block({ title, subtitle })}
	<div
		class="border rounded p-4 bg-surface border-border hover:bg-surface-variant flex items-start justify-between"
	>
		<div class="">
			<div class="text-xl text-text">{title}</div>
		</div>
		<Button class="cursor-pointer">View</Button>
	</div>
{/snippet}

<div class="p-6 flex flex-col gap-y-4">
	<div class="flex items-end justify-between">
		<h1 class="text-2xl font-semibold">Clients</h1>
		<a href="/create-client">
			<Button class="cursor-pointer">New Client</Button>
		</a>
	</div>
	<div class="grid grid-cols-1 gap-2">
		{#await data.clients}
			<PageTransition>Loading Clients</PageTransition>
		{:then clients}
			{#each clients as client (client.execustack_id)}
				<a href="/{client.execustack_id}">
					{@render block({
						title: client.settings.name
					})}
				</a>
			{/each}
		{/await}
	</div>
</div>
