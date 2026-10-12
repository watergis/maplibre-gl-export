import type { LayerSpecification } from 'maplibre-gl';

/** A layer of a MapLibre style */
export type StyleLayer = LayerSpecification;

/** Every layer type of the MapLibre style specification */
export type LayerType = StyleLayer['type'];

/** The layer of a type */
export type LayerOfType<T extends LayerType> = Extract<StyleLayer, { type: T }>;

type KeysOfUnion<U> = U extends unknown ? keyof U : never;

type PaintOf<L> = L extends { paint?: infer P } ? NonNullable<P> : never;

type LayoutOf<L> = L extends { layout?: infer P } ? NonNullable<P> : never;

/** Names of the paint properties of a layer type */
export type PaintName<T extends LayerType> = KeysOfUnion<PaintOf<LayerOfType<T>>> & string;

/** Names of the layout properties of a layer type */
export type LayoutName<T extends LayerType> = KeysOfUnion<LayoutOf<LayerOfType<T>>> & string;

/**
 * A layer as it is attached to a rendered feature: its paint and layout properties hold
 * the values which were evaluated for the feature at the current zoom, in place of the
 * expressions of the style.
 */
export interface EvaluatedLayer {
	id: string;
	type: string;
	paint?: Record<string, unknown>;
	layout?: Record<string, unknown>;
}

const read = (bag: Record<string, unknown> | undefined, name: string, fallback?: unknown) => {
	const value = bag?.[name];
	return value === undefined || value === null ? fallback : value;
};

export interface PropertyReader<T extends LayerType> {
	/** Read a paint property, falling back to the default of the style specification */
	paint<V>(name: PaintName<T>, fallback: V): V;
	paint(name: PaintName<T>): unknown;
	/** Read a layout property, falling back to the default of the style specification */
	layout<V>(name: LayoutName<T>, fallback: V): V;
	layout(name: LayoutName<T>): unknown;
}

/**
 * Read the properties of a layer of the given type. The names are checked against the
 * style specification of MapLibre GL JS.
 */
export function properties<T extends LayerType>(
	layer: { paint?: object; layout?: object } | undefined
): PropertyReader<T> {
	const paint = layer?.paint as Record<string, unknown> | undefined;
	const layout = layer?.layout as Record<string, unknown> | undefined;
	return {
		paint: (name: string, fallback?: unknown) => read(paint, name, fallback),
		layout: (name: string, fallback?: unknown) => read(layout, name, fallback)
	} as PropertyReader<T>;
}
