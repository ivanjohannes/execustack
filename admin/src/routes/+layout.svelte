<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { applyStoredTheme, theme_settings } from '$lib/theme.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { browser } from '$app/environment';
	import { initSocket } from '$lib/socketio.svelte';

	let sidebar = $state();

	let { children, data } = $props();

	onMount(() => {
		applyStoredTheme();

		if (browser && data.ws_namespace_settings) {
			initSocket(data.ws_namespace_settings);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if theme_settings.theme}
	<main class="bg-bg text-text flex flex-col h-screen min-h-0">
		<div class="shrink-0">
			<Navbar toggleSidebar={sidebar.toggle} />
		</div>
		<div class="grow flex items-stretch min-h-0">
			<Sidebar bind:this={sidebar} />
			<div class="grow overflow-y-auto p-4 md:px-8">
				{@render children()}
			</div>
		</div>
	</main>
{/if}
