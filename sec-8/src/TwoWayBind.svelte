<script>
  let val = ''

  $: console.log(val)
</script>

<style>
input[type="text"] {
  width: 100%;
}
</style>

<input type="text" bind:value={val} placeholder="Type in this field and observe console">