export const PageOrientation = {
	Landscape: 'landscape',
	Portrait: 'portrait'
} as const;
export type PageOrientationType = (typeof PageOrientation)[keyof typeof PageOrientation];
