import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_MAPBOX_ACCESSTOKEN: { public: true, static: true }
});
