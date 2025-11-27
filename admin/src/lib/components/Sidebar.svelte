<script>
	import { slide } from 'svelte/transition';
	import Button from './Button.svelte';
	import Logo from './Logo.svelte';
	import { cubicInOut } from 'svelte/easing';

	// set state
	let is_open = $state(false);

	export const toggle = () => {
		is_open = !is_open;
	};

	const items = [
		{ name: 'Dashboard', href: '/' },
		{ name: 'Clients', href: '/clients' }
	];
</script>

{#snippet content()}
	<div class="space-y-2">
		{#each items as item}
			<a
				href={item.href}
				class="block px-8 md:px-12 py-4 md:py-2 hover:bg-secondary hover:text-secondary-foreground"
				onclick={toggle}
			>
				{item.name}
			</a>
		{/each}
	</div>
{/snippet}

<div class="hidden md:block h-full w-64 max-w-full pt-4 border-r border-border bg-surface-variant">
	{@render content()}
</div>

{#if is_open}
	<div
		class="fixed top-0 left-0 h-screen w-screen overflow-y-auto md:hidden bg-bg"
		transition:slide={{ duration: 100, axis: 'x', easing: cubicInOut }}
	>
		<div class="w-full flex items-center justify-between h-18 px-4 md:px-8 border-b border-border">
			<Logo />
			<Button class="md:hidden bg-secondary" onclick={toggle}>{is_open ? 'Close' : 'Menu'}</Button>
		</div>
		{@render content()}
	</div>
{/if}
