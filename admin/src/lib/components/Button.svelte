<script>
	let { children, ...rest } = $props();
</script>

<button {...rest} class={['p-2 px-4 rounded bg-slate-600 text-white text-sm', rest.class]}>
	{@render children()}
</button>
