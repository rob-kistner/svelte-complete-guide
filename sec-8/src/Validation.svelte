<script>
  import { isInArray } from './js/validation.js'

  let favorite = 'Sony'
  let cameras = ['Sony', 'Canon', 'Nikon']

  $: validText = isInArray(cameras, favorite) ? `The valid value is ${favorite}` : 'Enter a valid value below…'
</script>

<style>
input[type="text"] {
  width: 50%;
}
input[type="text"]::placeholder {
  color: #aaa;
}
.invalid {
  color: red;
  border: solid 1px red;
}
.valid {
  color: black;
  border: solid 1px green;
}
</style>

<h2>Validation</h2>
<p>{validText}</p>
<form on:submit|preventDefault>
  <input type="text" class={isInArray(cameras, favorite) ? 'valid' : 'invalid'} bind:value={favorite} placeholder="Enter Sony, Canon, or Nikon…">
  <button type="submit" disabled={!isInArray(cameras, favorite)}>Save</button>
</form>

<p>Uses simple validation import to check field value.</p>

