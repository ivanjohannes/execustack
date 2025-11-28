<script>
	let { children, ...rest } = $props();
</script>

<button
	{...rest}
	class={[
		'p-2 px-4 rounded bg-primary text-primary-foreground text-sm hover:bg-hover focus:bg-focus active:bg-active cursor-pointer h-12',
		rest.class
	]}
>
	{@render children()}
</button>
