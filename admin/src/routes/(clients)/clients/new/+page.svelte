<script>
	import { enhance } from '$app/forms';
	import Button from '$lib/components/Button.svelte';
	import InputText from '$lib/components/InputText.svelte';
</script>

<form action="?/create" method="POST" use:enhance>
	<h1 class="text-2xl font-semibold pb-4">Create New Client</h1>
	<div class="flex flex-col gap-y-2">
		<label for="name" class="text-sm font-medium text-text">Client Name</label>
		<InputText name="name" id="name" required />
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
