import { cls, el } from './dom';

export interface SliderOptions {
	/** CSS class prefix of the underlying library */
	prefix: string;
	id: string;
	name: string;
	/** values the slider snaps to, in ascending order */
	values: number[];
	/** selected value, one of `values` */
	value: number;
	/** accessible text of a value, e.g. `300 DPI` */
	valueText?: (value: number) => string;
	onChange: (value: number) => void;
}

/**
 * Slider snapping to a list of values, with a button for every value below it.
 * The slider holds the index of the value, so the values are evenly spaced.
 * @returns the slider, its input (for the `for` of a label) and a readout of the selected value
 * to be placed by the caller (usually in the label of the field)
 */
export const createSlider = (options: SliderOptions) => {
	const { prefix, values } = options;
	const element = el('div', cls(prefix, 'range'));
	const input = el('input', cls(prefix, 'range__input'));
	input.type = 'range';
	input.id = options.id;
	input.name = options.name;
	input.min = '0';
	input.max = String(values.length - 1);
	input.step = '1';

	const readout = el('span', cls(prefix, 'field__value'));

	const ticks = el('div', cls(prefix, 'range__ticks'));
	const tickButtons = values.map((value, index) => {
		const tick = el('button', cls(prefix, 'range__tick'), String(value));
		tick.type = 'button';
		// the slider itself is reachable with the keyboard
		tick.tabIndex = -1;
		tick.addEventListener('click', () => {
			input.value = String(index);
			update();
			input.focus();
		});
		return tick;
	});
	ticks.append(...tickButtons);

	const update = () => {
		const index = Number(input.value);
		const value = values[index];
		readout.textContent = String(value);
		input.setAttribute('aria-valuetext', options.valueText?.(value) ?? String(value));
		input.style.setProperty(
			'--gl-export-range-progress',
			`${(index / Math.max(values.length - 1, 1)) * 100}%`
		);
		tickButtons.forEach((tick, i) =>
			tick.classList.toggle(cls(prefix, 'range__tick--active'), i === index)
		);
		options.onChange(value);
	};
	input.value = String(values.indexOf(options.value));
	input.addEventListener('input', update);
	update();

	element.append(input, ticks);
	return { element, input, readout };
};
