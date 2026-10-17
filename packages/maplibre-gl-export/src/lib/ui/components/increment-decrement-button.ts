import { Minus, Plus } from 'lucide';
import { createIconButton } from './button';
import { cls, el } from './dom';

export interface IncrementDecrementButtonOptions {
	/** CSS class prefix of the underlying library */
	prefix: string;
	/** accessible names of the buttons */
	labels: { decrement: string; reset: string; increment: string };
	onDecrement: () => void;
	onReset: () => void;
	onIncrement: () => void;
}

/**
 * Decrement / value (click to reset) / increment buttons.
 * They use the `zoom` class names, as the zoom of the preview is what they are styled for.
 * @returns the group and `update`, which shows the value and enables the buttons
 */
export const createIncrementDecrementButton = (options: IncrementDecrementButtonOptions) => {
	const { prefix, labels } = options;
	const group = el('div', cls(prefix, 'zoom'));
	group.setAttribute('role', 'group');

	const className = (name: string) => `${cls(prefix, 'zoom__button')} ${cls(prefix, name)}`;
	const decrement = createIconButton({
		prefix,
		className: className('zoom__out'),
		label: labels.decrement,
		icon: Minus,
		iconName: 'zoomOut',
		onClick: options.onDecrement
	});
	const reset = createIconButton({
		prefix,
		className: className('zoom__reset'),
		label: labels.reset,
		onClick: options.onReset
	});
	const increment = createIconButton({
		prefix,
		className: className('zoom__in'),
		label: labels.increment,
		icon: Plus,
		iconName: 'zoomIn',
		onClick: options.onIncrement
	});
	group.append(decrement, reset, increment);

	const update = (text: string, canDecrement: boolean, canIncrement: boolean) => {
		reset.textContent = text;
		decrement.disabled = !canDecrement;
		increment.disabled = !canIncrement;
	};
	return { element: group, update };
};
