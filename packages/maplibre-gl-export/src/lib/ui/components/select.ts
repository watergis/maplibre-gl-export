import { cls, el } from './dom';

export interface SelectOptions {
	/** CSS class prefix of the underlying library */
	prefix: string;
	id: string;
	name: string;
	options: { label: string; value: string }[];
	value: string;
	onChange: (value: string) => void;
}

/** Dropdown list */
export const createSelect = (options: SelectOptions) => {
	const select = el('select', cls(options.prefix, 'select'));
	select.id = options.id;
	select.name = options.name;
	options.options.forEach((option) => {
		const element = el('option', undefined, option.label);
		element.value = option.value;
		element.selected = option.value === options.value;
		select.appendChild(element);
	});
	select.addEventListener('change', () => options.onChange(select.value));
	return select;
};
