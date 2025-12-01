<script>
	let { value = $bindable(), ...rest } = $props();
</script>

<input
	type="text"
	bind:value
	{...rest}
	class={[
		'border border-outline rounded p-2 bg-surface text-text h-12 placeholder:text-text/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
		rest.disabled && 'bg-surface/50 cursor-not-allowed',
		rest.class
	]}
/>
