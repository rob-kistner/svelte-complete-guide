<script>
  let someDiv
  let usernameInput

  function saveData() {
    if (usernameInput.value.trim() !== '') {
      someDiv.innerHTML = `The username is: <strong>${usernameInput.value}</strong>`
    } else {
      someDiv.innerHTML = ''
    }
    console.dir(someDiv)
    usernameInput.value = ''
  }
</script>

<style>
  input[type="text"]::placeholder {
    color: #aaa;
  }
</style>

<h2>Reference Binding</h2>
<p bind:this={someDiv}></p>
<input type="text" bind:this={usernameInput} placeholder="Enter username">
<button on:click={saveData}>Save</button>


<p><code>bind:this</code> will bind a separate field to be read by a different one, i.e.: as a reference. In the example above, you'd have to click "Save" to update the data that shows above. This allows you to trigger something in a component from a different component.</p>

