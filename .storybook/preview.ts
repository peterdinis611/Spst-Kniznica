import '../src/routes/layout.css';
import '../src/routes/landing.css';
import type { Preview } from '@storybook/sveltekit';
import Decorator from './Decorator.svelte';

const preview: Preview = {
	decorators: [() => Decorator],
	parameters: {
		layout: 'centered',
		controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
		backgrounds: {
			default: 'page',
			values: [
				{ name: 'page', value: '#f6f0e6' },
				{ name: 'ink', value: '#16120e' }
			]
		},
		a11y: { test: 'todo' }
	}
};

export default preview;
