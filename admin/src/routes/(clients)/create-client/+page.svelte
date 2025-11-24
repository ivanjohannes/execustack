<script>
	import Button from '$lib/components/Button.svelte';
</script>

<form action="?/create" method="POST">
	<div class="p-6 flex flex-col gap-y-4">
		<h1 class="text-2xl font-semibold">Create New Client</h1>
		<div class="flex flex-col gap-y-2">
			<label for="name" class="text-sm font-medium text-slate-700">Client Name</label>
			<input
				type="text"
				name="name"
				id="name"
				required
				class="border border-slate-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
			/>
		</div>
		<div class="flex items-center gap-x-2">
            <div>

                <Button type="submit" class="cursor-pointer">Create Client</Button>
            </div>
            <div>

                <a href="/clients" class="text-sm text-slate-600 hover:underline">Cancel</a>
            </div>
		</div>
	</div>
</form>
