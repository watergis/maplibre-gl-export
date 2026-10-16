import { describe, expect, it } from 'vitest';
import { captureRasterGroups } from './raster-pass';
import { createMap, styleLayer } from './test-utils';

const layers = ['satellite', 'land', 'heat', 'labels'].map((id) => styleLayer(id, 'fill'));
const all = layers.map((layer) => layer.id);

describe('captureRasterGroups', () => {
	it('renders each group on its own', async () => {
		const mock = createMap(layers);
		const images = await captureRasterGroups(
			mock.map,
			[['satellite'], ['heat', 'labels']],
			all,
			10
		);
		expect(images).toEqual(['data:capture/1', 'data:capture/2']);
		expect(mock.captures).toEqual([['satellite'], ['heat', 'labels']]);
	});

	it('restores the visibility of every layer', async () => {
		const mock = createMap(layers);
		await captureRasterGroups(mock.map, [['satellite']], all, 10);
		mock.map.getCanvas().toDataURL();
		expect(mock.captures.at(-1)).toEqual(all);
	});

	it('restores the visibility when rendering fails', async () => {
		const mock = createMap(
			layers,
			{},
			{
				once: () => {
					throw new Error('x');
				}
			}
		);
		await expect(captureRasterGroups(mock.map, [['satellite']], all, 10)).rejects.toThrow('x');
		const hidden = new Set<string>();
		for (const [id, visible] of mock.visibility) {
			if (visible) hidden.delete(id);
			else hidden.add(id);
		}
		expect(hidden.size).toBe(0);
	});

	it('leaves the layers alone which were not visible to begin with', async () => {
		const mock = createMap(layers);
		await captureRasterGroups(mock.map, [['satellite']], ['satellite', 'land'], 10);
		expect(mock.visibility.map(([id]) => id)).not.toContain('labels');
	});

	it('does nothing without groups', async () => {
		const mock = createMap(layers);
		expect(await captureRasterGroups(mock.map, [], all, 10)).toEqual([]);
		expect(mock.visibility).toEqual([]);
	});
});
