import { FormatType } from './Format';
import { Language } from './Language';
import { PageOrientationType } from './PageOrientation';
import { SizeType } from './Size';

export interface ControlOptions {
	PageSize?: SizeType;
	PageOrientation?: PageOrientationType;
	Format?: FormatType;
	DPI?: number;
	Crosshair?: boolean;
	PrintableArea?: boolean;
	Local?: Language;
	AllowedSizes?: ('LETTER' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6')[];
	Filename?: string;
}
