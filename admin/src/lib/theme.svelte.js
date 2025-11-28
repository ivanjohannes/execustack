export const allowedThemes = ['light', 'dark', 'system', 'fire', 'water', 'earth', 'air'];

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
				setting: 'system'
			};
		case 'system':
			return {
				label: 'System',
				setting: 'fire'
			};
		case 'fire':
			return {
				label: 'Fire',
				setting: 'water'
			};
		case 'water':
			return {
				label: 'Water',
				setting: 'earth'
			};
		case 'earth':
			return {
				label: 'Earth',
				setting: 'air'
			};
		case 'air':
			return {
				label: 'Air',
				setting: 'light'
			};
		default:
			return null;
	}
});

export const getNextTheme = () => {
	return next_theme;
};

/**
 * @description Sets the theme client side and persists it via an API call.
 * @param {string} [theme]
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
