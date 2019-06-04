<script>
  export let val
  export let placeholder = 'Type in this field and observe console'
  
  export function empty() {
    val = ''
  }

  $: console.log(val)

  function setValue(e) {
    e.target.value = val
  }
</script>

<style>
input[type="text"] {
  width: 100%;
}
</style>

<input
  type="text"
  bind:value={val}
  placeholder={placeholder}
  >