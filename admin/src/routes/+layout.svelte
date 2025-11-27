<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { applyStoredTheme, theme_settings } from '$lib/theme.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { browser } from '$app/environment';
	import { initSocket } from '$lib/socketio.svelte';
	import PageTransition from '$lib/components/PageTransition.svelte';

	let sidebar = $state();

	let { children, data } = $props();

	async function init() {
		applyStoredTheme();

		const _layout = await data._layout;

		const socket_namespace = _layout.tasks_results?.socket_namespace;

		if (browser && socket_namespace) {
			initSocket(socket_namespace);
		}
	}

	onMount(init);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if theme_settings?.theme}
	{#await data._layout}
		<PageTransition>Loading...</PageTransition>
	{:then}
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
	{:catch error}
		{error.message}
	{/await}
{/if}
