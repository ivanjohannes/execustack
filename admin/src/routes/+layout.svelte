<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main class="min-h-screen bg-slate-50 text-slate-800">
	{@render children()}
</main>
