const allowedThemes = ['light', 'dark', 'system', 'unicorn', 'forest', 'blizzard'];

/**
 * @type {{ theme?: string }}
 */
export const theme_settings = $state({});

const next_theme = $derived.by(() => {
	switch (theme_settings.theme) {
		case 'light':
			return {
				label: 'Light',
				setting: 'dark'
			};
		case 'dark':
			return {
				label: 'Dark',
				setting: 'unicorn'
			};
		case 'unicorn':
			return {
				label: 'Unicorn',
				setting: 'forest'
			};
		case 'forest':
			return {
				label: 'Forest',
				setting: 'blizzard'
			};
		case 'blizzard':
			return {
				label: 'Blizzard',
				setting: 'system'
			};
		default:
			return {
				label: 'System',
				setting: 'light'
			};
	}
});

export const getNextTheme = () => {
	return next_theme;
};

/**
 * @description Sets the theme client side and persists it via an API call.
 * @param {string} theme
 * @returns {string | undefined} The applied theme.
 */
export function setTheme(theme) {
	if (!theme) return;

	if (!allowedThemes.includes(theme)) {
		throw new Error(`Invalid theme: ${theme}`);
	}

	let documentAttribute = theme;
	if (theme === 'system') {
		const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
		documentAttribute = isDarkMode ? 'dark' : 'light';
	}

	document.documentElement.setAttribute('data-theme', documentAttribute);

	theme_settings.theme = theme;

	fetch('/api/theme', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ theme })
	});

	return theme;
}

export function listenToSystemThemeChanges() {
	const mq = window.matchMedia('(prefers-color-scheme: dark)');

	function handleChange() {
		if (theme_settings.theme === 'system' || !theme_settings.theme) {
			const newTheme = mq.matches ? 'dark' : 'light';
			document.documentElement.setAttribute('data-theme', newTheme);
		}
	}

	mq.addEventListener('change', handleChange);

	return () => {
		mq.removeEventListener('change', handleChange);
	};
}
