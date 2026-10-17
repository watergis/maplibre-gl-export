import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { Format, type FormatType } from '../../interfaces';
import { createGeoPdfViewport } from '../geopdf';
import { SvgFormat } from './svg';

/**
 * PDF document of the configured page size. The SVG of the map, which holds the map as
 * vectors or as an image, is drawn on it.
 */
export class PdfFormat extends SvgFormat {
	readonly extension: FormatType = Format.PDF;

	protected readonly name: string = 'PDF';

	async toBlob() {
		const pdf = this.createPDFDocument();
		const clone = (await this.createSvgElement()).cloneNode(true) as SVGSVGElement;
		const objectUrls = await this.replaceDataUrlImages(clone);
		try {
			await pdf.svg(clone, { x: 0, y: 0, width: this.width, height: this.height });
		} finally {
			objectUrls.forEach((url) => URL.revokeObjectURL(url));
		}
		return pdf.output('blob');
	}

	/** Create an empty PDF document of the configured page size */
	private createPDFDocument() {
		const { corners, author } = this.getExportInfo(this.options.geoPdf);
		const pdf = new jsPDF({
			orientation: this.width > this.height ? 'l' : 'p',
			unit: this.options.unit,
			compress: true,
			format: [this.width, this.height]
		});

		const { lng, lat } = this.map.getCenter();
		pdf.setProperties({
			title: this.map.getStyle().name,
			subject: `center: [${lng}, ${lat}], zoom: ${this.map.getZoom()}`,
			creator: this.creatorName,
			author: author ?? ''
		});

		if (corners) {
			// jsPDF has no API for page dictionary entries, but it publishes `putPage` while it
			// writes the page dictionary, which is where the viewport has to go.
			const k = pdf.internal.scaleFactor;
			const viewport = createGeoPdfViewport(corners, this.width * k, this.height * k);
			// `write` exists on `internal` but is missing from the typings of jsPDF
			const internal = pdf.internal as typeof pdf.internal & { write: (value: string) => void };
			internal.events.subscribe('putPage', () => internal.write(viewport));
		}

		return pdf;
	}

	/**
	 * Replace the data URLs of the images in the SVG by object URLs.
	 *
	 * svg2pdf.js parses a data URL by a regular expression which overflows the call stack for
	 * a large image, such as a layer rendered as an image for a large page or a high DPI. Any
	 * other URL is loaded as it is, and its format is read from the extension, which is given
	 * by the fragment of the object URL.
	 * @param svg SVG whose images are replaced
	 * @returns object URLs which have to be revoked after the SVG was drawn
	 */
	private async replaceDataUrlImages(svg: SVGSVGElement) {
		const xlinkNs = 'http://www.w3.org/1999/xlink';
		const objectUrls: string[] = [];
		for (const image of Array.from(svg.getElementsByTagName('image'))) {
			const href = image.getAttributeNS(xlinkNs, 'href') || image.getAttribute('href');
			// SVG images are parsed as text by svg2pdf.js, which an object URL would break
			if (!href?.startsWith('data:image/') || href.startsWith('data:image/svg')) continue;
			const blob = await (await fetch(href)).blob();
			const objectUrl = URL.createObjectURL(blob);
			objectUrls.push(objectUrl);
			const url = `${objectUrl}#image.${blob.type.split('/')[1] ?? 'png'}`;
			image.setAttributeNS(xlinkNs, 'xlink:href', url);
			image.setAttribute('href', url);
		}
		return objectUrls;
	}
}
