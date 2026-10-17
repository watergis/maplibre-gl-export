import { cls, el } from './dom';

export interface InputGroupOptions {
	/** CSS class prefix of the underlying library */
	prefix: string;
	id: string;
	name: string;
	type: 'text' | 'number';
	value: string;
	/** text shown after the input, such as a unit. It can be changed later through `addon` */
	addon?: string;
	/** called on every keystroke */
	onInput?: (value: string) => void;
	/** called when the user commits the value (blur or Enter) */
	onChange?: (value: string) => void;
}

/** Input with a trailing addon, such as a unit or a file extension */
export const createInputGroup = (options: InputGroupOptions) => {
	const { prefix } = options;
	const element = el('div', cls(prefix, 'input-group'));
	const input = el('input', cls(prefix, 'input'));
	input.type = options.type;
	if (options.type === 'number') {
		input.min = '1';
		input.step = '1';
		input.required = true;
		input.inputMode = 'decimal';
	} else {
		input.spellcheck = false;
		input.autocomplete = 'off';
	}
	input.id = options.id;
	input.name = options.name;
	input.value = options.value;
	const { onInput, onChange } = options;
	if (onInput) input.addEventListener('input', () => onInput(input.value));
	if (onChange) input.addEventListener('change', () => onChange(input.value));
	const addon = el('span', cls(prefix, 'input-addon'), options.addon);
	element.append(input, addon);
	return { element, input, addon };
};
