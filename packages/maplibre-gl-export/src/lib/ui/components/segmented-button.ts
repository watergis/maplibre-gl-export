import type { IconNode } from 'lucide';
import { cls, createIcon, el } from './dom';

export interface SegmentedButtonOptions<T extends string> {
	/** CSS class prefix of the underlying library */
	prefix: string;
	/** name of the radio buttons */
	name: string;
	/** accessible name of the group */
	label: string;
	/** options; the value is also used in the class name of the icon */
	choices: { value: T; label: string; icon?: IconNode }[];
	/** checked option */
	value: T;
	/** smaller options, for long lists */
	compact?: boolean;
	/** called with the value of the option the user checked */
	onChange: (value: T) => void;
}

/** Radio buttons styled as a segmented control */
export const createSegmentedButton = <T extends string>(options: SegmentedButtonOptions<T>) => {
	const { prefix } = options;
	const group = el('div', cls(prefix, 'segmented'));
	if (options.compact) group.classList.add(cls(prefix, 'segmented--compact'));
	group.setAttribute('role', 'radiogroup');
	group.setAttribute('aria-label', options.label);
	options.choices.forEach((choice) => {
		const option = el('label', cls(prefix, 'segmented__option'));
		const input = el('input', cls(prefix, 'segmented__input'));
		input.type = 'radio';
		input.name = options.name;
		input.value = choice.value;
		input.checked = options.value === choice.value;
		input.addEventListener('change', () => {
			if (input.checked) options.onChange(choice.value);
		});
		option.appendChild(input);
		if (choice.icon) option.appendChild(createIcon(prefix, choice.icon, choice.value));
		option.appendChild(el('span', cls(prefix, 'segmented__label'), choice.label));
		group.appendChild(option);
	});
	return group;
};
