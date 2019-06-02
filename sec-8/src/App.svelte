<script>
  import CustomInput from './CustomInput.svelte'
  import Toggle from './Toggle.svelte'

  let val = 'Max'
  let selectedOption = 2
  let price = 0
  let agreed
  let favColor = 'green'
  let favColorCheck = ['red']

  $: console.log(selectedOption)
  $: console.log(price)
  $: console.log(agreed)
  $: console.log(favColor)
  $: console.log(favColorCheck)
</script>

<style>
  hr { margin: 2rem 0; }
</style>

<!-- <input type="text" bind:value={val} placeholder="Type in this field and observe console"> -->
<CustomInput bind:val={val} />

<hr>

<p>Component <code>chosenOption</code> is Dynamically bound to App's <code>selectedOption</code></p>
<Toggle bind:chosenOption={selectedOption} />

<hr>

<div>
  <input type="number" value={price} bind:value={price}>
</div>

<hr>

<div>
  <label>
  <input type="checkbox" bind:checked={agreed} />
  Agree to terms?
  </label>
</div>

<hr>

<div>
  <h3>Favorite Color:</h3>
  <label>
    <input type="radio" name="color" value="red" bind:group={favColor}> Red
  </label>
  <label>
    <input type="radio" name="color" value="green" bind:group={favColor}> Green
  </label>
  <label>
    <input type="radio" name="color" value="blue" bind:group={favColor}> Blue
  </label>
</div>

<hr>

<div>
  <h3>Favorite Color Checkboxes:</h3>
  <label>
    <input type="checkbox" name="color" value="red" bind:group={favColorCheck}> Red
  </label>
  <label>
    <input type="checkbox" name="color" value="green" bind:group={favColorCheck}> Green
  </label>
  <label>
    <input type="checkbox" name="color" value="blue" bind:group={favColorCheck}> Blue
  </label>
</div>