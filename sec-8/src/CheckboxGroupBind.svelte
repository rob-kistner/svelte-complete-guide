<script>
  export let favorites = []
  $: favoriteText = favorites.length === 0 ? 'Select colors below…' : ''
</script>

<style>
  input[type="checkbox"] {
    position: relative;
    margin-right: 0.25rem;
    top: -2px;
  }
  .selected-colors {
    display: flex;
    height: 30px;
    margin-bottom: 2rem;
  }
  .selected-colors div {
    flex: 1 0;
  }
  .red {
    background-color: red;
  }
  .green {
    background-color: green;
  }
  .blue {
    background-color: blue;
  }
</style>

<h2>Checkbox Group Bind</h2>

<div class="selected-colors">
  {#if favorites.includes('red')}
    <div class="red"></div>
  {/if}
  {#if favorites.includes('green')}
    <div class="green"></div>
  {/if}
  {#if favorites.includes('blue')}
    <div class="blue"></div>
  {/if}
  {favoriteText}
</div>
<label>
  <input type="checkbox" name="color" value="red" bind:group={favorites}> Red
</label>
<label>
  <input type="checkbox" name="color" value="green" bind:group={favorites}> Green
</label>
<label>
  <input type="checkbox" name="color" value="blue" bind:group={favorites}> Blue
</label>

<p>Checkboxes bound as a group via <code>bind:group</code>.</p>
