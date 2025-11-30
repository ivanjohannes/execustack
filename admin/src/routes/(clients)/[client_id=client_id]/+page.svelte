<script>
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import InputText from '$lib/components/InputText.svelte';
	import { socketio } from '$lib/socketio.svelte.js';
	import { onDestroy, untrack } from 'svelte';

	let { data, form } = $props();

	$effect(() => {
		!!socketio.client; // depend on socketio.client

		untrack(() => {
			if (socketio.client) {
				socketio.client.on('client_updated', onClientUpdated);
			}
		});
	});

	onDestroy(() => {
		socketio.client?.off('client_updated', onClientUpdated);
	});

	function onClientUpdated(msg) {
		const doc = msg.document;
		if (doc.es_id === page.params.client_id && page.params.client_id) {
			invalidate(page.params.client_id);
		}
	}
</script>

{#await data.client}
	Loading...
{:then client}
	<h1 class="text-2xl font-semibold pb-4">Edit Client</h1>
	<form action="?/update" method="POST" use:enhance>
		<div class="flex flex-col gap-y-2">
			<label for="name" class="text-sm font-medium text-text">Client Name</label>
			<InputText name="name" id="name" required value={form?.name ?? client?.settings.name} />
			<label for="client_id" class="text-sm font-medium text-text">Client ID</label>
			<InputText
				name="client_id"
				id="client_id"
				required
				value={form?.client_id ?? client?.settings.client_id}
			/>
			<div class="flex items-center gap-x-2">
				<div>
					<Button type="submit" class="cursor-pointer">Update Client</Button>
				</div>
				<div>
					<a href="/clients" class="text-sm text-text-muted hover:underline">Cancel</a>
				</div>
			</div>
		</div>
	</form>
{:catch error}
	<div class="text-error">{error.message}</div>
{/await}
