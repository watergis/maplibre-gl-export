import english from './en';
import french from './fr';
import finnish from './fi';
import german from './de';
import swedish from './sv';
import spanish from './es';
import vietnam from './vi';
import ukranian from './uk';
import zhHans from './zhHans';
import zhHant from './zhHant';
import ja from './ja';
import { Language } from '../interfaces/Language';

export const getTranslation = (lang: Language) => {
	switch (lang) {
		case 'de':
			return german;
		case 'en':
			return english;
		case 'fr':
			return french;
		case 'fi':
			return finnish;
		case 'sv':
			return swedish;
		case 'es':
			return spanish;
		case 'vi':
			return vietnam;
		case 'uk':
			return ukranian;
		case 'zhHans':
			return zhHans;
		case 'zhHant':
			return zhHant;
		case 'ja':
			return ja;
		default:
			return english;
	}
};
