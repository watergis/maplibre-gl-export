import { cls, el } from './dom';

export interface SwitchOptions {
	/** CSS class prefix of the underlying library */
	prefix: string;
	id: string;
	name: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}

/** Checkbox styled as a switch */
export const createSwitch = (options: SwitchOptions) => {
	const input = el('input', cls(options.prefix, 'switch'));
	input.type = 'checkbox';
	input.setAttribute('role', 'switch');
	input.id = options.id;
	input.name = options.name;
	input.checked = options.checked;
	input.addEventListener('change', () => options.onChange(input.checked));
	return input;
};
