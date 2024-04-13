export const Unit = {
	// don't use inch unit. because page size setting is using mm unit.
	in: 'in',
	mm: 'mm'
} as const;
export type UnitType = (typeof Unit)[keyof typeof Unit];
