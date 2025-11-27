<script>
	import Button from '$lib/components/Button.svelte';
</script>

<form action="?/create" method="POST">
	<h1 class="text-2xl font-semibold pb-4">Create New Client</h1>
	<div class="flex flex-col gap-y-2">
		<label for="name" class="text-sm font-medium text-text">Client Name</label>
		<input
			type="text"
			name="name"
			id="name"
			required
			class="border border-border rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
		/>
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
