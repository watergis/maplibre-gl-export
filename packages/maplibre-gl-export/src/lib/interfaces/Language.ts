export const AvailableLanguages = [
	'en',
	'fr',
	'fi',
	'de',
	'sv',
	'es',
	'vi',
	'uk',
	'zhHans',
	'zhHant',
	'ja',
	'pt'
] as const;

export type Language = (typeof AvailableLanguages)[number];
