<script>
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import { joinSocketRooms, leaveSocketRooms, socketio } from '$lib/socketio.svelte.js';
	import { onMount } from 'svelte';

	let { data, form } = $props();

	let client = $state();

	async function init() {
		const _page = await data._page;

		client = _page.tasks_results?.get_client?.data?.[0];

		const client_token = _page.tasks_results?.get_client_ws_token?.token;
		if (browser && client_token && socketio.client) {
			joinSocketRooms(client_token);

			socketio.client.on('client_updated', () => {
				// invalidate page data
				invalidateAll();
			});
		}
	}

	onMount(() => {
		init();

		return () => {
			if (page.params.client_id) {
				leaveSocketRooms([page.params.client_id]);
			}
		};
	});
</script>

{#await data._page}
	Loading...
{:then}
	<h1 class="text-2xl font-semibold pb-4">Edit Client</h1>
	<form action="?/update" method="POST">
		<div class="flex flex-col gap-y-2">
			<label for="name" class="text-sm font-medium text-text">Client Name</label>
			<input
				type="text"
				name="name"
				id="name"
				required
				class="border border-border rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
				value={form?.name ?? client?.settings.name}
			/>
			<label for="client_id" class="text-sm font-medium text-text">Client ID</label>
			<input
				type="text"
				name="client_id"
				id="client_id"
				required
				class="border border-border rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
	{error.message}
{/await}
