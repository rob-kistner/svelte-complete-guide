<script>
  export let favorite = ''

  $: favoriteText = favorite.trim() === '' ? 
    'Pick your favorite color' : 
    `Your favorite color is <span style="color: ${favorite}">${favorite}</span>`
</script>

<style>
  input[type="radio"] {
    position: relative;
    margin-right: 0.25rem;
    top: -2px;
  }
  .red {
    font-weight: 700;
    color: red;
  }
  .green {
    font-weight: 700;
    color: green;
  }
  .blue {
    font-weight: 700;
    color: blue;
  }
</style>

<h2>Radio Bind</h2>

<p>{@html favoriteText}</p>
<label class:red={favorite === 'red'}>
  <input type="radio" name="color" value="red" bind:group={favorite}> Red
</label>
<label class:green={favorite === 'green'}>
  <input type="radio" name="color" value="green" bind:group={favorite}> Green
</label>
<label class:blue={favorite === 'blue'}>
  <input type="radio" name="color" value="blue" bind:group={favorite}> Blue
</label>

<p>Radios bound as a group via <code>bind:group</code>.</p>
