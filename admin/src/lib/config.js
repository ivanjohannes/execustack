import { env as publicEnv } from '$env/dynamic/public';

export default {
	es_api: {
		url: publicEnv.PUBLIC_ES_API_URL
	}
};
