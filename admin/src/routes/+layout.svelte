<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { initSocket } from '$lib/socketio.svelte';
	import { browser } from '$app/environment';
	import { listenToSystemThemeChanges, theme_settings } from '$lib/theme.svelte';

	let sidebar = $state();

	let { data, children } = $props();

	// set initial theme
	theme_settings.theme = data.initial_theme;

	if (browser) {
		data.socket_namespace.then((sn) => {
			if (sn) initSocket(sn);
		});

		listenToSystemThemeChanges();
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main class="bg-bg text-text flex flex-col h-screen min-h-0">
	<div class="shrink-0">
		<Navbar toggleSidebar={sidebar?.toggle} />
	</div>
	<div class="grow flex items-stretch min-h-0">
		<Sidebar bind:this={sidebar} />
		<div class="grow overflow-y-auto p-4 md:px-8">
			{@render children()}
		</div>
	</div>
</main>
