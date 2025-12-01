import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export default {
	es_api: {
		admin_client_api_key: privateEnv.ES_ADMIN_CLIENT_API_KEY || 'es_default_key',
		url: publicEnv.PUBLIC_ES_API_URL
	}
};
