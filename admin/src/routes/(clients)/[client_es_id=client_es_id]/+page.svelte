<script>
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import InputText from '$lib/components/InputText.svelte';
	import { socketio } from '$lib/socketio.svelte.js';
	import { addToast } from '$lib/toasts.svelte.js';
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
		if (doc.es_id === page.params.client_es_id && page.params.client_es_id) {
			invalidate(page.params.client_es_id);
		}
	}
</script>

{#await data.client}
	Loading...
{:then client}
	<div class="space-y-4">
		<h1 class="text-2xl font-semibold">{client?.settings.name}</h1>
		<h2 class="text-lg font-semibold">Details</h2>
		<form
			action="?/update"
			method="POST"
			use:enhance={() => {
				return async ({ result, update }) => {
					// add toast if error
					if (result.type === 'success') {
						addToast(
							{
								title: 'Success!',
								message: 'Client details updated successfully.'
							},
							2000
						);
					} else {
						addToast({
							title: 'Error!',
							message: result?.data?.error_message
						});
					}

					// update form data
					await update();
				};
			}}
		>
			<div class="flex flex-col gap-y-2">
				<label for="name" class="text-sm font-medium text-text">Client Name</label>
				<InputText name="name" id="name" value={client?.settings.name} />
				<label for="client_id" class="text-sm font-medium text-text">Client ID</label>
				<InputText name="client_id" id="client_id" value={client?.settings.client_id} disabled />
				<div class="flex items-center gap-x-2">
					<div>
						<Button type="submit" class="cursor-pointer">Save</Button>
					</div>
				</div>
			</div>
		</form>
		<hr class="text-divider" />
		<h2 class="text-lg font-semibold">Security</h2>
		<form
			action="?/save_api_key"
			method="POST"
			use:enhance={() => {
				return async ({ result, action, update }) => {
					// add toast if error
					if (result.type === 'success') {
						if (action.search.endsWith('generate_api_key')) {
							addToast(
								{
									title: 'Success!',
									message: 'New API key generated.'
								},
								2000
							);
						} else {
							addToast(
								{
									title: 'Success!',
									message: 'API key saved.'
								},
								3000
							);
						}
					} else {
						addToast({
							title: 'Error!',
							message: result?.data?.error_message
						});
					}

					// update form data
					await update();
				};
			}}
		>
			<div class="flex flex-col gap-y-2">
				<label for="api_key" class="text-sm font-medium text-text">API Key</label>
				<div class="flex items-center gap-x-2">
					<InputText
						name="api_key"
						id="api_key"
						required
						value={form?.api_key ?? client.api_key_hash}
						readonly
						class="grow"
					/>
					<div>
						<Button
							type="submit"
							disabled={client?.is_admin}
							class="bg-secondary hover:bg-secondary-hover text-secondary-foreground"
							formaction="?/generate_api_key"
						>
							Generate
						</Button>
					</div>
					<div>
						<Button type="submit" class="cursor-pointer">Save</Button>
					</div>
				</div>
			</div>
		</form>
	</div>
{:catch error}
	<div class="text-error">{error.message}</div>
{/await}
