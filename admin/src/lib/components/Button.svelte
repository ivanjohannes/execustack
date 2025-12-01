<script>
	let { children, ...rest } = $props();
</script>

<button
	{...rest}
	class={[
		'p-2 px-4 rounded bg-primary text-primary-foreground text-sm h-12',
		rest.disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-hover focus:bg-focus active:bg-active',
		rest.class
	]}
>
	{@render children()}
</button>
