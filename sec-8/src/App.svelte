<script>
  import CustomInput from './CustomInput.svelte'
  import Toggle from './Toggle.svelte'
  import { isValidEmail } from './validation.js'

  let val = 'Max'
  let selectedOption = 2
  let price = 0
  let agreed
  let favColor = 'green'
  let favColorCheck = ['red']
  let favColorSelect = 'blue'
  // reference bindings
  let usernameInput
  let someDiv
  // custom component binding
  let customInput

  let enteredEmail = ''
  let formIsValid = false

  $: console.log(selectedOption)
  $: console.log(price)
  $: console.log(agreed)
  $: console.log(favColor)
  $: console.log(favColorCheck)
  $: console.log(favColorSelect)
  $: console.log(customInput)

  $: formIsValid = isValidEmail(enteredEmail) ? true : false

  function saveData() {
    // ---------- not the svelte way
    // console.log(document.querySelector('#username').value)
    console.log(usernameInput.value)
    console.dir(usernameInput)
    console.dir(someDiv)
  }
</script>

<style>
  hr { margin: 2rem 0; }
  small {
    display: block;
    font-style: italic;
    }
  .invalid {
    border: solid 1px red;
  }
  .spacer {
    display: block;
    width: 100%;
    height: 50px;
  }
</style>

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

<hr>

<h3>Select Binding</h3>
<div>
  <select bind:value={favColorSelect}>
    <option value="red">Red</option>
    <option value="green">Green</option>
    <option value="blue">Blue</option>
  </select>
  <small>Note: you CAN bind to an object</small>
</div>

<hr>

<h3>Reference Binding</h3>
<input type="text" bind:this={usernameInput}>
<button on:click={saveData}>Save</button>
<small><code>bind:this</code> will bind a separate field to be read by a different one, i.e.: as a reference.
</small>

<div bind:this={someDiv}></div>

<hr>

<h3>Custom Component Binding</h3>
<!-- bind:val equals bind:val={val} -->
<CustomInput bind:val bind:this={customInput} />
<button on:click={() => customInput.empty()}>Click to Empty Val (of CustomInput)</button>

<hr>

<h3>Validation</h3>
<form on:submit|preventDefault>
  <input type="email" class={isValidEmail(enteredEmail) ? '' : 'invalid'} bind:value={enteredEmail} placeholder="Enter valid email">
  <button type="submit" disabled={!formIsValid}>Save</button>
  <small>Email field above {formIsValid ? 'is valid' : 'is not valid'}</small>
</form>
<p>Look at <a href="https://validatejs.org" target="_new">Validate.js</a>, which includes functions you could use for validation on components.</p>

<div class="spacer"></div>