<script>
	import { cubicOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';

	let { children } = $props();
</script>

<div class="fixed h-screen w-screen flex items-center justify-center bg-bg text-text" transition:fade={{ duration: 200, easing: cubicOut }}>
	{@render children()}
</div>
