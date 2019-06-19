<script>
  const HOBBIES_URL = 'https://rk-svelte-course.firebaseio.com/hobbies.json'

  let hobbies = []
  let hobbyInput
  let isLoading = false

  // load current hobbies from firebase
  fetch(HOBBIES_URL)
    .then(res => {
      if (!res.ok) throw new Error('Failed to GET')
      return res.json() // returns a promise, move to next .then
    })
    // data received ok, process it
    .then(data => {
      // get values only from key/value pairs into array
      hobbies = Object.values(data)
      let keys = Object.keys(data)
      // for in loop to test
      for (let key in data) {
        console.log(key, data[key])
      }
    })
    // print error info
    .catch(err => {
      console.log(err)
    })

  function addHobby() {
    // add to the hobbies array
    hobbies = [...hobbies, hobbyInput.value]

    isLoading = true
    /**
     * the "hobbies.json" below will create the necessary 
     * api structure to store data if it doesn't exist
     */
    fetch(HOBBIES_URL, {
      method: 'POST', // get by default
      body: JSON.stringify(hobbyInput.value),
      headers: {
        'Content-type': 'application/json'
      }
    })
      .then(res => {
        isLoading = false
        if (!res.ok) { // should return 200, fetch see it as .ok, if not...
           throw new Error('Failed to POST') // moves to catch block if it's not ok
        }
        // otherwise do nothing
        alert('Saved data.')
      })
      .catch(err => {
        isLoading = false
        console.log(err)
      })
    hobbyInput.value = ''
    hobbyInput.focus()
  }
</script>

<label for="hobby">Hobby</label>
<input type="text" name="hobby" id="hobby" bind:this={hobbyInput}>
<button on:click={addHobby}>Add Hobby</button>

{#if isLoading}
  <p>Loading…</p>
{:else}
  <ul>
    {#each hobbies as hobby}
      <li>{hobby}</li>
    {/each}
  </ul>
{/if}

