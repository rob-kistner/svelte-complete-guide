<script>
  import { createEventDispatcher } from 'svelte'
  import Product from './Product.svelte'

  let products

  function addToCart(e)
  {
    console.log(e.type, e.detail)
  }

  function deleteCartItem(e)
  {
    console.log(e.type, e.detail)
  }
</script>

<style>
</style>

<div>
  {#each products as prod, i (prod.id)}
    <Product
      id={prod.id}
      title={prod.title}
      price={prod.price}
      publisher={prod.publisher}
      on:add-to-cart={addToCart}
      on:delete-cart-item={deleteCartItem}
      />
  {/each}
</div>
