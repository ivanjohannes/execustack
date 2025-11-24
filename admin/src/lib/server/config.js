import { env as privateEnv } from '$env/dynamic/private';

export default {
	admin_client_id: privateEnv.ADMIN_CLIENT_ID || 'execustack_admin',
	admin_client_api_key: privateEnv.ADMIN_CLIENT_API_KEY || 'execustack_default_key',
	mongodb: {
		url: privateEnv.MONGODB_CLIENT_URL
	},
	api: {
		url: privateEnv.API_URL
	}
};
