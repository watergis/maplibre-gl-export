import {
	PageOrientation,
	Size,
	type AllowedSize,
	type CustomSize,
	type PageOrientationType,
	type SizeType
} from '../interfaces';

/**
 * Sentinel value of the page-size `<select>` option that switches the dialog to the
 * user-entered custom width/height inputs. It is intentionally not valid JSON so it can
 * never be confused with a serialized `[width, height]` preset tuple.
 */
export const CUSTOM_SIZE_VALUE = 'custom';

/**
 * Turn a `[long, short]` page size (the order the presets are stored in) into the
 * `[width, height]` of the page in the given orientation.
 */
export const orientSize = (
	size: SizeType,
	orientation: PageOrientationType | string
): [number, number] =>
	orientation === PageOrientation.Portrait ? [size[1], size[0]] : [size[0], size[1]];

/** Whether a developer-defined page size has a name and two positive dimensions */
export const isValidCustomSize = (customSize: CustomSize): boolean => {
	if (typeof customSize?.name !== 'string' || customSize.name.length === 0) {
		return false;
	}
	const size = customSize.size;
	return (
		Array.isArray(size) &&
		size.length === 2 &&
		size.every((value) => typeof value === 'number' && Number.isFinite(value) && value > 0)
	);
};

/**
 * Resolve the `AllowedSizes` option into the `label -> [width, height]` map backing the
 * page size dropdown. Entries are either a preset name or a developer-defined
 * `{ name, size }` pair; invalid entries are skipped so a single bad entry cannot break
 * the dialog. Falls back to every preset when nothing valid is left.
 */
export const resolveAllowedSizes = (allowedSizes?: AllowedSize[]): Record<string, SizeType> => {
	const sizes: Record<string, SizeType> = {};
	allowedSizes?.forEach((allowedSize) => {
		let name: string;
		let size: SizeType;
		if (typeof allowedSize === 'string') {
			const dimensions = Size[allowedSize];
			if (!dimensions) {
				return;
			}
			name = allowedSize;
			size = dimensions;
		} else {
			if (!isValidCustomSize(allowedSize)) {
				console.warn('maplibre-gl-export: ignoring invalid AllowedSizes entry', allowedSize);
				return;
			}
			name = allowedSize.name;
			size = allowedSize.size;
		}
		// first entry wins so the dropdown never shows the same label twice
		if (name in sizes) {
			return;
		}
		sizes[name] = size;
	});
	if (Object.keys(sizes).length === 0) {
		return { ...Size };
	}
	return sizes;
};

/** Whether two page sizes are equal by value */
export const isSameSize = (a: SizeType | undefined, b: SizeType | undefined) =>
	!!a && !!b && a.length === b.length && a.every((item, index) => item === b[index]);
