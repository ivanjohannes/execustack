<script>
	import Button from '$lib/components/Button.svelte';

	let { data } = $props();
</script>

{#snippet block({ title, subtitle })}
	<div class="border rounded p-4 bg-surface border-border hover:bg-surface-variant flex items-start justify-between">
        <div class="">
            <div class="text-xl text-text">{title}</div>
            <div class="text-lg text-text-muted">{subtitle}</div>
        </div>
        <Button class="cursor-pointer">
            View
        </Button>
	</div>
{/snippet}

<div class="p-6 flex flex-col gap-y-2">
	<h1 class="text-2xl font-semibold">Dashboard</h1>
	<div class="grid grid-cols-2 gap-2">
		<a href="/clients">
			{@render block({
				title: 'Clients',
				subtitle: data.clients_summary.num_clients
			})}
		</a>
	</div>
</div>
