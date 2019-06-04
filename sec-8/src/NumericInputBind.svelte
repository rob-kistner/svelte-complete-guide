<script>
  let price = 5.99

  $: formattedPrice = `$ ${price == null ? 0 : price.toFixed(2)}`
</script>

<style>
</style>

<h2>Numeric Input Bind</h2>
<p>Selected option: <strong>{formattedPrice}</strong></p>
<input type="number" id="myfield" bind:value={price}>
<p>Shows conversion between <code>string</code> and <code>number</code> is done naturally through svelte.</p>

