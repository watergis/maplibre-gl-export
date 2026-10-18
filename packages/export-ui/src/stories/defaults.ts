import { DPI, Format, PageOrientation, Size, type ExportDialogState } from '../lib';
import { AvailableLanguages } from '../lib/local';

/** Initial state of the dialog, as the control derives it from its default options */
export const defaultDialogState = (): ExportDialogState => ({
	sizeValue: JSON.stringify(Size.A4),
	orientation: PageOrientation.Landscape,
	customWidth: Size.A4[0],
	customHeight: Size.A4[1],
	format: Format.PDF,
	dpi: DPI[300],
	scalebar: true,
	northIcon: true,
	vector: false,
	vectorLabels: false,
	fileName: 'map'
});

/** Control of the language of the dialog */
export const languageArgType = {
	control: 'select' as const,
	options: [...AvailableLanguages]
};
