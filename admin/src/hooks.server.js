/** @type {import('@sveltejs/kit').Handle} */
export function handle({ event, resolve }) {
	const theme = event.cookies.get('execustack-theme');

	// @ts-ignore
	event.locals.theme = theme || 'system';

	return resolve(event, {
		transformPageChunk: ({ html }) => {
			if (theme) {
				return html.replace('<html', `<html data-theme="${theme}"`);
			}
			return html;
		}
	});
}
