<script>
  import Toggle from './components/Toggle.svelte'

  let val = 'Max'

  let selectedOption = 2
</script>

<style>
</style>

<h2>Component Bind</h2>
<p>Selected option: <strong>{selectedOption}</strong></p>
<Toggle bind:chosenOption={selectedOption} />
<p>Toggle Component <code>chosenOption</code> is Dynamically bound to parent component's <code>selectedOption</code></p>
