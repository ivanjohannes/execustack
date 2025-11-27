import { env as privateEnv } from '$env/dynamic/private';

export default {
		es_api: {
		admin_client_api_key: privateEnv.ES_ADMIN_CLIENT_API_KEY || 'es_default_key',
		url: privateEnv.ES_API_URL
	}
};
