export const DPI = {
	72: 72,
	96: 96,
	200: 200,
	300: 300,
	400: 400
} as const;
export type DPIType = (typeof DPI)[keyof typeof DPI];
