import type { Preview } from '@storybook/sveltekit';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../src/lib/theme.css';
import './preview.css';

// the theme of the dialog (`--gl-export-*` custom properties) applies to every story
document.body.classList.add('gl-export-theme');

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i
			}
		},

		a11y: {
			// 'todo' - show a11y violations in the test UI only
			// 'error' - fail CI on a11y violations
			// 'off' - skip a11y checks entirely
			test: 'todo'
		}
	}
};

export default preview;
