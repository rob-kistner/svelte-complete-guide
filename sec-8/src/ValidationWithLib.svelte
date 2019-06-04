<script>
  import v8n from 'v8n'

  let favorite = 'Sony'
  let cameras = ['Sony', 'Canon', 'Nikon']

  $: validText = v8n().includes(favorite).test(cameras) ? `The valid value is ${favorite}` : 'Enter a valid value below…'
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

<h2>Validation With Library</h2>
<p>{validText}</p>
<form on:submit|preventDefault>
  <input type="text"
    class={v8n().includes(favorite).test(cameras) ? 'valid' : 'invalid'} 
    bind:value={favorite} 
    placeholder="Enter Sony, Canon, or Nikon…"
    >
  <button type="submit" disabled={!v8n().includes(favorite).test(cameras)}>Save</button>
</form>

<p>Uses the <a href="https://imbrn.github.io/v8n/" target="_new">v8n</a> validation library.</p>

