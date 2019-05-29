import App from './components/App.svelte';
import Header from './components/ui/Header.svelte';

/**
 * Two target svelte app
 */

const app = new App({
  target: document.querySelector('#app')
});

const header = new Header({
  target: document.querySelector('#header')
})

export default {app, header};