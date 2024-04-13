import { writable } from 'svelte/store';
import type { Language } from '@watergis/maplibre-gl-export';

export const LANGUAGE_CONTEXT_KEY = 'language-store-context-id';

export type LanguageStore = ReturnType<typeof createLanguageStore>;

export const createLanguageStore = () => {
	const { set, update, subscribe } = writable<Language>('en');

	return {
		subscribe,
		update,
		set
	};
};
