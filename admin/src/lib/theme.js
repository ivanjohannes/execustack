const allowedThemes = ['light', 'dark'];

/**
 * @description Applies the stored theme from localStorage or the system preference if none is stored.
 * @returns {string} The applied theme.
 */
export function applyStoredTheme() {
	const storedTheme = localStorage.getItem('theme');

	if (storedTheme && allowedThemes.includes(storedTheme)) {
		return setTheme(storedTheme);
	}

	const prefersDark =
		window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
	const themeToApply = prefersDark ? 'dark' : 'light';

	return setTheme(themeToApply);
}

/**
 * @description Sets the theme and stores it in localStorage.
 * @param {string} theme
 * @returns {string} The applied theme.
 */
export function setTheme(theme) {
	if (!theme) {
		localStorage.removeItem('theme');
		return applyStoredTheme();
	}

	if (!allowedThemes.includes(theme)) {
		throw new Error(`Invalid theme: ${theme}`);
	}

	localStorage.setItem('theme', theme);
	document.documentElement.setAttribute('data-theme', theme);

	return theme;
}
