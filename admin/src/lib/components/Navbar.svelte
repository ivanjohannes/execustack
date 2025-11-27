<script>
	import { setTheme, theme_settings } from '$lib/theme.svelte';
	import Button from './Button.svelte';
	import Logo from './Logo.svelte';

	let { toggleSidebar } = $props();
</script>

<div class="w-full flex items-center justify-between px-4 md:px-8 h-18 border-b border-border bg-surface">
	<Logo />
	<div class="flex gap-x-2">
		<Button onclick={() => setTheme(theme_settings.theme === 'light' ? 'dark' : 'light')}>
			{theme_settings.theme === 'light' ? 'Dark' : 'Light'}
		</Button>
		<Button class="md:hidden" onclick={() => toggleSidebar()}>Menu</Button>
	</div>
</div>
