<script>
  import { onMount } from 'svelte'

  const URL = 'https://robkdata.firebaseio.com/gearvault.json'

  let gearvault = null
  let isLoading = false

  onMount(() => {
    fetch(URL)
      .then(res => {
        if (!res.ok) throw new Error('Failed to GET')
        return res.json() // returns a promise, move to next .then
      })
      // data received ok, process it
      .then(data => {
        
        let keys = Object.keys(data)
        // for in loop to test
        for (let key in data) {
          console.log(key, data[key])
        }
        gearvault = data
        console.log(gearvault)
      })
      // print error info
      .catch(err => {
        console.log(err)
      })
  })

</script>

<h1>GearVault</h1>
