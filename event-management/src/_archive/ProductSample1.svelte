<script>
  export let productTitle
</script>

<article on:click={(e) => console.log(e.target)}>

  <h1>{productTitle}</h1>
  <button on:click=>Add to Cart</button>
  <button>Delete</button>

</article>