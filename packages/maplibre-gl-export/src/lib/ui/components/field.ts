import type { IconNode } from 'lucide';
import { cls, createIcon, el } from './dom';

export interface FieldOptions {
	/** CSS class prefix of the underlying library */
	prefix: string;
	/** added as `{prefix}-export-field--{name}` and used in the class name of the icon */
	name: string;
	icon: IconNode;
	label: string;
	control: HTMLElement;
	/** id of the control the label is for */
	id?: string;
	/** added as `{prefix}-export-field--{modifier}` */
	modifiers?: string[];
	/** element shown after the label, such as the value of a slider */
	value?: HTMLElement;
}

/** Settings row: an icon and a label, then the control */
export const createField = (options: FieldOptions) => {
	const { prefix } = options;
	const field = el('div', cls(prefix, 'field'));
	field.classList.add(cls(prefix, `field--${options.name}`));
	options.modifiers?.forEach((modifier) => field.classList.add(cls(prefix, `field--${modifier}`)));
	const label = el('label', cls(prefix, 'field__label'));
	if (options.id) label.htmlFor = options.id;
	label.append(
		createIcon(prefix, options.icon, options.name),
		el('span', undefined, options.label)
	);
	if (options.value) label.appendChild(options.value);
	const control = el('div', cls(prefix, 'field__control'));
	control.appendChild(options.control);
	field.append(label, control);
	return field;
};
