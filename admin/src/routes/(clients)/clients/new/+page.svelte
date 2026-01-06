<script>
	import { enhance } from '$app/forms';
	import { addToast } from 'ui/utils/toasts.svelte.js';
	import InputText from 'ui/input/InputText.svelte';
	import Button from 'ui/input/Button.svelte';
</script>

<form
	action="?/create"
	method="POST"
	use:enhance={() => {
		return async ({ result, update }) => {
			// add toast if error
			if (result.type === 'failure') {
				addToast({
					title: 'Error!',
					message: result?.data?.error_message
				});
			} else if (result.type === 'redirect') {
				addToast(
					{
						title: 'Success!',
						message: 'Client created successfully.'
					},
					2000
				);
			}

			await update();
		};
	}}
>
	<h1 class="text-2xl font-semibold pb-4">Create New Client</h1>
	<div class="flex flex-col gap-y-2">
		<label for="client_id" class="text-sm font-medium text-text">
			Client ID (will be lowercased and trimmed)
		</label>
		<InputText name="client_id" id="client_id" required />
		<div class="flex items-center gap-x-2">
			<div>
				<Button type="submit" class="cursor-pointer">Create Client</Button>
			</div>
			<div>
				<a href="/clients" class="text-sm text-text-muted hover:underline">Cancel</a>
			</div>
		</div>
	</div>
</form>
