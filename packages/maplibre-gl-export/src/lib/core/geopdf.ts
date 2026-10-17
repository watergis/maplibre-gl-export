/** Longitude and latitude of a point, in degrees */
export type LngLatTuple = [number, number];

/** Geographic coordinates of the four corners of the exported map */
export interface GeoCorners {
	topLeft: LngLatTuple;
	topRight: LngLatTuple;
	bottomRight: LngLatTuple;
	bottomLeft: LngLatTuple;
}

/**
 * WKT of WGS 84 / Pseudo-Mercator (EPSG:3857), the projection the map is drawn in.
 * It holds no parentheses, so it can be written as a PDF string as it is.
 */
export const EPSG_3857_WKT =
	'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs"],AUTHORITY["EPSG","3857"]]';

const num = (value: number, digits: number) => Number(value.toFixed(digits)).toString();

/**
 * Create the viewport array (`/VP`) of a page dictionary which georeferences the page,
 * following the geospatial extension of ISO 32000 which GDAL, QGIS and Avenza Maps read.
 *
 * The map is expected to fill the whole page. The corners are given in latitude and
 * longitude, and readers project them into EPSG:3857 to fit the transform of the page,
 * so the map keeps its Web Mercator projection and a rotated map stays rotated.
 *
 * @param corners geographic coordinates of the corners of the page
 * @param width page width in PDF points
 * @param height page height in PDF points
 */
export function createGeoPdfViewport(corners: GeoCorners, width: number, height: number) {
	// GPTS are written as latitude / longitude pairs
	const gpts = [corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft]
		.map(([lng, lat]) => `${num(lat, 9)} ${num(lng, 9)}`)
		.join(' ');
	// LPTS are relative to the BBox, whose origin is at the bottom-left of the page
	const lpts = '0 1 1 1 1 0 0 0';
	return [
		'/VP [<<',
		'/Type /Viewport',
		`/BBox [0 0 ${num(width, 4)} ${num(height, 4)}]`,
		'/Name (Map)',
		'/Measure <<',
		'/Type /Measure',
		'/Subtype /GEO',
		'/Bounds [0 0 0 1 1 1 1 0]',
		`/GPTS [${gpts}]`,
		`/LPTS [${lpts}]`,
		`/GCS << /Type /PROJCS /EPSG 3857 /WKT (${EPSG_3857_WKT}) >>`,
		'/PDU [/M /SQM /DEG]',
		'>>',
		'>>]'
	].join('\n');
}
