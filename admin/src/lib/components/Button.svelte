<script>
	let { children, ...rest } = $props();
</script>

<button {...rest} class={['p-2 px-4 rounded bg-primary text-primary-foreground text-sm', rest.class]}>
	{@render children()}
</button>
