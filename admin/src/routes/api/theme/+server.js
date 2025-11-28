export async function POST({ request, cookies }) {
	const { theme } = await request.json();

	cookies.set('execustack-theme', theme, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false,
		maxAge: 60 * 60 * 24 * 365 // 1 year
	});

	return new Response(null, { status: 204 });
}
