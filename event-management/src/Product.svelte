<script>
  import { createEventDispatcher } from 'svelte'

  export let title
  export let price
  export let bestseller = false

  const dispatch = createEventDispatcher()

  function addToCart() {
    dispatch('add-to-cart', {id: 'p1'})
  }

  function deleteCartItem() {
    dispatch('delete-cart-item', {id: 'p1'})
  }
</script>

<style>
  .bestseller {
    display: table;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-weight: 700;
    font-style: italic;
    background-color: yellow;
    color: darkred;
  }
  h3 {
    margin: 0 0 0.25rem;
  }
  p {
    margin: 0 0 0.75rem;
  }
  button {
    cursor: pointer;
    border-radius: 4px;
    margin-right: 0.125rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.85rem;
    transition: all 0.3s;
  }
  button:hover {
    background-color: transparent;
    transition: all 0.3s;
  }
  button .fal {
    margin-right: 0.25rem;
  }
</style>


<article>
{#if bestseller}
  <p class="bestseller">BESTSELLER!</p>
{/if}
  <h3>{title}</h3>
  <p>$ {price}</p>
  <button on:click={addToCart}>
    <i class="fal fa-plus"></i> Add
  </button>
  <button on:click={deleteCartItem}>
    <i class="fal fa-times"></i> Remove
  </button>
</article>