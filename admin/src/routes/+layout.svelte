<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#await data.ping_response}
	loading...
{:then res}
	{#if res === true}
		{@render children()}
	{:else}
		<h1>API is not reachable</h1>
	{/if}
{:catch}
	<p>Error connecting to API.</p>
{/await}
