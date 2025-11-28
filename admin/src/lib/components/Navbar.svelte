<script>
	import { getNextTheme, setTheme } from '$lib/theme.svelte';
	import Button from './Button.svelte';
	import Logo from './Logo.svelte';

	let { toggleSidebar } = $props();
</script>

<div
	class="w-full flex items-center justify-between px-4 md:px-8 h-18 border-b border-border bg-surface"
>
	<Logo />
	<div class="flex gap-x-2">
		{#if getNextTheme()?.setting}
			<Button onclick={() => setTheme(getNextTheme()?.setting)}>
				{getNextTheme()?.label}
			</Button>
		{/if}
		<Button class="md:hidden" onclick={() => toggleSidebar()}>Menu</Button>
	</div>
</div>
