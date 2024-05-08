import english from './en';
import french from './fr';
import finnish from './fi';
import german from './de';
import swedish from './sv';
import spanish from './es';
import catalan from './ca';
import vietnam from './vi';
import ukranian from './uk';
import zhHans from './zhHans';
import zhHant from './zhHant';
import ja from './ja';
import pt from './pt';
import { Language } from '../interfaces/Language';
import { Translation } from '../interfaces/Translation';

export const Languages: Translation[] = [
	english,
	french,
	finnish,
	german,
	swedish,
	spanish,
	catalan,
	vietnam,
	ukranian,
	zhHans,
	zhHant,
	ja,
	pt
];

export const AvailableLanguages = [
	'en',
	'fr',
	'fi',
	'de',
	'sv',
	'es',
	'ca',
	'vi',
	'uk',
	'zhHans',
	'zhHant',
	'ja',
	'pt'
] as const;

export const getTranslation = (lang: Language) => {
	return Languages.find((l) => l.LanguageCode === lang) ?? english;
};
