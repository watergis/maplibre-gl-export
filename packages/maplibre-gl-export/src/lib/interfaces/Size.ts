export const Size = {
	// A0, A1, B0, B1 are not working well.
	// A0: [1189, 841],
	// A1: [841, 594],
	LETTER: [279, 216], // 8.5x11 - works
	//TABLOID: [432,279] // 11x17 - not working currently prints to 11.68x8.27 in landscape
	A2: [594, 420],
	A3: [420, 297],
	A4: [297, 210],
	A5: [210, 148],
	A6: [148, 105],
	// B0: [1414, 1000],
	// B1: [1000, 707],
	B2: [707, 500],
	B3: [500, 353],
	B4: [353, 250],
	B5: [250, 176],
	B6: [176, 125]
} as const;
// `[number, number]` rather than the union of the preset tuples above so that
// user-entered custom sizes (see the export control) are also valid `SizeType`s.
export type SizeType = readonly [number, number];

/** Name of one of the preset page sizes above. */
export type SizeKey = keyof typeof Size;

/**
 * A page size defined by the developer through the `AllowedSizes` option, for cases the
 * paper presets do not cover (16:9, 3:2, 1:1, ...).
 */
export interface CustomSize {
	/** Label shown in the page size dropdown */
	name: string;
	/** `[width, height]` in mm, in landscape order like the presets above */
	size: SizeType;
}

/** An entry of the `AllowedSizes` option: either a preset name or a developer-defined size. */
export type AllowedSize = SizeKey | CustomSize;
