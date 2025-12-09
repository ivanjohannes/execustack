<script>
	let { value = $bindable(), ...rest } = $props();
</script>

<textarea
	bind:value
	{...rest}
	class={[
		'border border-outline rounded p-2 bg-surface text-text min-h-24 resize-y placeholder:text-text/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
		rest.disabled && 'bg-surface/50 cursor-not-allowed',
		rest.class
	]}
></textarea>
