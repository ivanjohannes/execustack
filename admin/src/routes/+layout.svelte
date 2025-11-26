<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { applyStoredTheme, setTheme } from '$lib/theme';

	let { children } = $props();

	let theme = $state();

	onMount(() => {
		theme = applyStoredTheme();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if theme}
	<button onclick={() => (theme = setTheme('light'))}>light</button>
	<button onclick={() => (theme = setTheme('dark'))}>dark</button>
	<main class="min-h-screen bg-bg text-text">
		{@render children()}
	</main>
{/if}
