<script>
	let { data } = $props();
</script>

{#await data.clients}
	Loading...
{:then clients}
	{#each clients as client (client.execustack_id)}
		<div class="client-card">
			<h2>Client ID: {client.execustack_id}</h2>
			<p>Client Name: {client.settings.name}</p>
			<p>Created At: {new Date(client.createdAt).toLocaleString()}</p>
		</div>
	{/each}
{:catch}
	<p>Error loading clients.</p>
{/await}
