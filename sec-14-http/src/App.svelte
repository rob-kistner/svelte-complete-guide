<script>
  import { onMount } from 'svelte'
  import hobbyStore from './hobby-store.js'

  const HOBBIES_URL = 'https://rk-svelte-course.firebaseio.com/hobbies.json'

  let hobbies = []
  let hobbyInput
  let isLoading = false

  /**
   * This is the onMount version,
   *
   * there's also an #await block version, see
   * the 2nd App-awaitBlockVersion.svelte file
   * that shows the markup receiving the promise instead.
   * That's fine for GETs but that version breaks the 
   * POST used here
   * 
   * to be sure data loads right at the beginning,
   * it's best to use onMount. Note import above,
   * lifecycle methods must be imported
   */ 
  isLoading = true
  // load current hobbies from firebase
  let getHobbies = fetch(HOBBIES_URL)
    .then(res => {
      if (!res.ok) throw new Error('Failed to GET')
      return res.json() // returns a promise, move to next .then
    })
    // data received ok, process it
    .then(data => {
      isLoading = false
      // get values only from key/value pairs into array and forward to the store
      hobbyStore.setHobbies(Object.values(data))
      let keys = Object.keys(data)
      // for in loop to test
      for (let key in data) {
        console.log(key, data[key])
      }
    })
    // print error info
    .catch(err => {
      isLoading = false
      console.log(err)
    })

  function addHobby() {
    // add to the hobbies array
    // hobbies = [...hobbies, hobbyInput.value]
    hobbyStore.addHobby(hobbyInput.value)

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
        // hobby added…
        // res.json() => Promise with an object containing the id
      })
      .catch(err => {
        isLoading = false
        console.log(err)
      })
    // clear
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
    {#each $hobbyStore as hobby}
      <li>{hobby}</li>
    {/each}
  </ul>
{/if}

