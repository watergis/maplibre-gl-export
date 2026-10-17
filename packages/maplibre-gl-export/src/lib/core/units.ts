import { Unit, type UnitType } from '../interfaces';

/**
 * Convert mm/inch to pixel
 * @param length mm/inch length
 * @param unit unit of the length
 * @param conversionFactor DPI value. default is 96.
 */
export function toPixels(length: number, unit: UnitType, conversionFactor = 96) {
	if (unit === Unit.mm) {
		conversionFactor /= 25.4;
	}
	return `${conversionFactor * length}px`;
}
