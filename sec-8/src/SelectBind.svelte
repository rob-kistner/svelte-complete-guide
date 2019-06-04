<script>
  export let favorite = ''

  let colors = [
    {id: 1, val: 'red', text: 'Red'},
    {id: 2, val: 'green', text: 'Green'},
    {id: 3, val: 'blue', text: 'Blue'},
  ]
</script>

<style>
  select {
    border: 3px solid #666;
  }
  .red { border-color: red; color: red; }
  .green { border-color: green; color: green; }
  .blue { border-color: blue; color: blue; }
</style>

<h2>Select Binding</h2>
<div>
</div>
<select
  bind:value={favorite}
  class={favorite}
  >
  <option value="">Select your favorite color…</option>
  {#each colors as color, i (color.id)}
    <option value={color.val}>{color.text}</option>
  {/each}
</select>

<p>Select value bound via <code>bind:value</code>. NOTE: You are able to bind to an object.</p>

