import type { IconNode } from 'lucide';
import { cls, createIcon, el } from './dom';

export interface ButtonOptions {
	/** CSS class prefix of the underlying library */
	prefix: string;
	variant: 'primary' | 'secondary';
	icon: IconNode;
	/** used in the class name of the icon */
	iconName: string;
	label: string;
	title?: string;
	/** extra class name, without the prefix */
	className?: string;
	/** wrap the label in `btn__label` and add a spinner, shown while the button is busy */
	spinner?: boolean;
	onClick: () => void;
}

/** Text button with a leading icon */
export const createButton = (options: ButtonOptions) => {
	const { prefix } = options;
	const classNames = [cls(prefix, 'btn'), cls(prefix, `btn--${options.variant}`)];
	if (options.className) classNames.push(cls(prefix, options.className));
	const button = el('button', classNames.join(' '));
	button.type = 'button';
	if (options.title) button.title = options.title;
	button.appendChild(createIcon(prefix, options.icon, options.iconName));
	if (options.spinner) {
		button.append(
			el('span', cls(prefix, 'btn__label'), options.label),
			el('span', cls(prefix, 'spinner'))
		);
	} else {
		button.appendChild(el('span', undefined, options.label));
	}
	button.addEventListener('click', options.onClick);
	return button;
};

export interface IconButtonOptions {
	/** CSS class prefix of the underlying library */
	prefix: string;
	/** full class name of the button */
	className: string;
	/** accessible name and tooltip */
	label: string;
	icon?: IconNode;
	/** used in the class name of the icon */
	iconName?: string;
	onClick: () => void;
}

/** Button showing only an icon (or a short text), named by its `aria-label` */
export const createIconButton = (options: IconButtonOptions) => {
	const button = el('button', options.className);
	button.type = 'button';
	button.setAttribute('aria-label', options.label);
	button.title = options.label;
	if (options.icon) {
		button.appendChild(createIcon(options.prefix, options.icon, options.iconName ?? ''));
	}
	button.addEventListener('click', options.onClick);
	return button;
};
