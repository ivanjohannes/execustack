<script>
	let {
		value = $bindable(),
		options = [],
		placeholder = 'Select an option...',
		disabled = false,
		name,
		id,
		class: className = '',
		...rest
	} = $props();

	let isOpen = $state(false);
	let filterText = $state('');
	let highlightedIndex = $state(0);
	let containerRef;
	let filterInputRef = $state();

	// Filter options based on search text
	let filteredOptions = $derived(
		filterText
			? options.filter((opt) => {
					const label = typeof opt === 'string' ? opt : opt.label;
					return label.toLowerCase().includes(filterText.toLowerCase());
				})
			: options
	);

	// Get display label for selected value
	let selectedLabel = $derived(() => {
		if (!value) return '';
		const selected = options.find((opt) => {
			const optValue = typeof opt === 'string' ? opt : opt.value;
			return optValue === value;
		});
		if (!selected) return '';
		return typeof selected === 'string' ? selected : selected.label;
	});

	function toggleDropdown() {
		if (disabled) return;
		isOpen = !isOpen;
		if (isOpen) {
			filterText = '';
			highlightedIndex = 0;
			// Focus the filter input when opening
			setTimeout(() => {
				filterInputRef?.focus();
			}, 0);
		}
	}

	function selectOption(option) {
		const optValue = typeof option === 'string' ? option : option.value;
		value = optValue;
		isOpen = false;
		filterText = '';
	}

	function handleKeydown(e) {
		if (disabled) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				if (!isOpen) {
					isOpen = true;
					highlightedIndex = 0;
				} else {
					highlightedIndex = Math.min(highlightedIndex + 1, filteredOptions.length - 1);
					scrollToHighlighted();
				}
				break;
			case 'ArrowUp':
				e.preventDefault();
				if (isOpen) {
					highlightedIndex = Math.max(highlightedIndex - 1, 0);
					scrollToHighlighted();
				}
				break;
			case 'Enter':
				e.preventDefault();
				if (isOpen && filteredOptions.length > 0) {
					selectOption(filteredOptions[highlightedIndex]);
				} else if (!isOpen) {
					toggleDropdown();
				}
				break;
			case 'Escape':
				e.preventDefault();
				isOpen = false;
				filterText = '';
				break;
			case 'Tab':
				if (isOpen) {
					e.preventDefault();
					if (filteredOptions.length > 0) {
						selectOption(filteredOptions[highlightedIndex]);
					} else {
						isOpen = false;
					}
				}
				break;
		}
	}

	function scrollToHighlighted() {
		setTimeout(() => {
			const highlighted = containerRef?.querySelector('[data-highlighted="true"]');
			if (highlighted) {
				highlighted.scrollIntoView({ block: 'nearest' });
			}
		}, 0);
	}

	function handleClickOutside(e) {
		if (containerRef && !containerRef.contains(e.target)) {
			isOpen = false;
			filterText = '';
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});

	// Reset highlighted index when filter changes
	$effect(() => {
		if (filterText) {
			highlightedIndex = 0;
		}
	});
</script>

<div bind:this={containerRef} class="relative w-full" {...rest}>
	<!-- Hidden input for form submission -->
	<input type="hidden" {name} {id} {value} />

	<!-- Selected value display / trigger button -->
	<button
		type="button"
		onclick={toggleDropdown}
		onkeydown={handleKeydown}
		disabled={disabled}
		class={[
			'w-full border border-outline rounded p-2 bg-surface text-text h-12 flex items-center justify-between focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-left',
			disabled && 'bg-surface/50 cursor-not-allowed',
			!selectedLabel() && 'text-text/50',
			className
		]
			.filter(Boolean)
			.join(' ')}
	>
		<span class="truncate">{selectedLabel() || placeholder}</span>
		<svg
			class="w-5 h-5 ml-2 transition-transform duration-200 shrink-0"
			class:rotate-180={isOpen}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Dropdown -->
	{#if isOpen}
		<div
			class="absolute z-50 w-full mt-1 bg-surface border border-outline rounded shadow-lg overflow-hidden"
		>
			<!-- Filter input -->
			<div class="p-2 border-b border-outline">
				<input
					bind:this={filterInputRef}
					bind:value={filterText}
					type="text"
					placeholder="Type to filter..."
					onkeydown={handleKeydown}
					class="w-full border border-outline rounded p-2 bg-surface text-text h-10 placeholder:text-text/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				/>
			</div>

			<!-- Options list -->
			<div class="max-h-60 overflow-y-auto">
				{#if filteredOptions.length === 0}
					<div class="p-3 text-text/50 text-center">No options found</div>
				{:else}
					{#each filteredOptions as option, index}
						{@const optValue = typeof option === 'string' ? option : option.value}
						{@const optLabel = typeof option === 'string' ? option : option.label}
						{@const isSelected = optValue === value}
						{@const isHighlighted = index === highlightedIndex}
						<button
							type="button"
							onclick={() => selectOption(option)}
							data-highlighted={isHighlighted}
							class={[
								'w-full text-left p-3 hover:bg-primary/10 transition-colors cursor-pointer border-none',
								isSelected && 'bg-primary/20 font-medium',
								isHighlighted && 'bg-primary/10'
							]
								.filter(Boolean)
								.join(' ')}
						>
							{optLabel}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	button {
		appearance: none;
		-webkit-appearance: none;
	}
</style>
