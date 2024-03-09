/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_MAPBOX_ACCESSTOKEN: string;
	// more env variables...
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
