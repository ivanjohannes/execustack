<script>
	import { removeToast, toast_queue } from '$lib/toasts.svelte.js';
</script>

<div class="fixed bottom-12 right-6 space-y-4">
	{#each toast_queue.toasts as toast (toast.id)}
		<div
			class="rounded bg-overlay p-4 w-[300px] text-text border border-primary cursor-pointer"
			onclick={() => removeToast(toast.id)}
			role="none"
		>
			<div class="text-sm font-semibold">{toast.title}</div>
			<div class="font-light">{toast.message}</div>
		</div>
	{/each}
</div>
